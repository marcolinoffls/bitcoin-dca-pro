/**
 * Componente EntryEditForm
 *
 * Função: Permite ao usuário editar um aporte de Bitcoin já registrado.
 * Onde é usado: No modal de edição, dentro da seção "Aportes Registrados".
 *
 * Integrações:
 * - Supabase: Atualiza um registro da tabela `aportes` via hook useBitcoinEntries.
 * - Props:
 *    - entry: os dados originais do aporte
 *    - currentRate: cotação atual do Bitcoin
 *    - onClose: função para fechar o modal
 *    - displayUnit: unidade usada para exibir BTC ou SATS
 * 
 * Atualizações:
 * - Corrigido o problema de atualização de data no Supabase
 * - Convertidos os campos de string para number para manipulação mais segura
 * - Garantida a atualização da lista de aportes após uma edição
 * - Adicionado console.log para mostrar a data selecionada antes de enviar ao Supabase
 * - Melhorada a validação e tratamento da data
 * - Garantido que a data selecionada no calendário seja aplicada imediatamente
 * - Corrigido problema de timezone, forçando o horário local ao interpretar datas
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber } from '@/lib/utils';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries'; // Importa o hook para uso direto

import CurrencySelector from '@/components/CurrencySelector';
import OriginSelector from '@/components/form/OriginSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BtcInput } from '@/components/form/BtcInput';
import DatePickerField from '@/components/form/DatePickerField';

interface EntryEditFormProps {
  entry: BitcoinEntry;
  currentRate: CurrentRate;
  onClose: () => void;
  displayUnit?: 'BTC' | 'SATS';
}

/**
 * Converte string de data para objeto Date, forçando o fuso horário local
 * @param dateInput Data no formato string ou Date
 * @returns Objeto Date com o fuso horário local
 */
const ensureLocalDate = (dateInput: Date | string): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  // Adiciona o horário T00:00:00 para forçar a interpretação no fuso horário local
  return new Date(`${dateInput}T00:00:00`);
};

const EntryEditForm: React.FC<EntryEditFormProps> = ({
  entry,
  currentRate,
  onClose,
  displayUnit = 'BTC',
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  // Usamos o hook diretamente no componente para ter acesso à função updateEntry
  const { updateEntry } = useBitcoinEntries();

  // Inicializa os campos com valores formatados para exibição
  const [amountInvestedDisplay, setAmountInvestedDisplay] = useState(formatNumber(entry.amountInvested));
  const [btcAmountDisplay, setBtcAmountDisplay] = useState(
    displayUnit === 'SATS'
      ? formatNumber(entry.btcAmount * 100000000, 0)
      : formatNumber(entry.btcAmount, 8)
  );
  const [exchangeRate, setExchangeRate] = useState(entry.exchangeRate);
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState(formatNumber(entry.exchangeRate));
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(entry.currency);
  const [origin, setOrigin] = useState<'corretora' | 'p2p' | 'planilha'>(
    entry.origin || 'corretora'
  );
  
  // Garantir que a data seja sempre uma instância de Date válida com fuso horário local
  const [date, setDate] = useState<Date>(() => {
    return ensureLocalDate(entry.date);
  });

  // Atualizamos a data quando o entry mudar, garantindo que seja sempre um objeto Date com fuso horário local
  useEffect(() => {
    console.log('Entry atualizado, data original:', entry.date);
    if (entry.date) {
      const newDate = ensureLocalDate(entry.date);
      if (!isNaN(newDate.getTime())) {
        setDate(newDate);
        console.log('Data do entry convertida e atualizada:', newDate, 
          'Formatada:', format(newDate, "dd/MM/yyyy", { locale: ptBR }));
      }
    }
  }, [entry]);

  // Função para converter string em formato brasileiro para número
  const parseLocalNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    setCurrency(newCurrency);
    if (currentRate) {
      const newRate = newCurrency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(newRate);
      setExchangeRateDisplay(formatNumber(newRate));
    }
  };

  // Função para atualizar a data do aporte
  const handleDateChange = (newDate: Date) => {
    console.log('Nova data selecionada em EntryEditForm:', newDate);
    console.log('Formatada para exibição:', format(newDate, "dd/MM/yyyy", { locale: ptBR }));
    
    if (newDate instanceof Date && !isNaN(newDate.getTime())) {
      setDate(newDate);
    } else {
      console.error('Data inválida recebida:', newDate);
    }
  };

  const handleOriginChange = (newOrigin: 'corretora' | 'p2p' | 'planilha') => {
    setOrigin(newOrigin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para editar aportes.',
        variant: 'destructive',
      });
      return;
    }

    // Converte os valores de string para number para processamento
    let parsedAmount = parseLocalNumber(amountInvestedDisplay);
    let parsedBtc = parseLocalNumber(btcAmountDisplay);
    // Converte SATS para BTC se necessário
    if (displayUnit === 'SATS') parsedBtc = parsedBtc / 100000000;
    
    if (
      isNaN(parsedAmount) ||
      isNaN(parsedBtc) ||
      isNaN(exchangeRate) ||
      exchangeRate === 0
    ) {
      toast({
        title: 'Erro nos dados',
        description: 'Por favor, verifique os valores inseridos.',
        variant: 'destructive',
      });
      return;
    }

    // Garantir que a data é válida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      toast({
        title: 'Data inválida',
        description: 'Por favor, selecione uma data válida.',
        variant: 'destructive',
      });
      return;
    }

    // Log para verificar os dados antes de enviar
    console.log('Dados sendo enviados para atualização:', {
      id: entry.id,
      amountInvested: parsedAmount,
      btcAmount: parsedBtc,
      exchangeRate: exchangeRate,
      currency: currency,
      date: date,
      formattedDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
      origin: origin
    });

    try {
      // Usa a função updateEntry do hook useBitcoinEntries com a data correta
      await updateEntry(entry.id, {
        amountInvested: parsedAmount,
        btcAmount: parsedBtc,
        exchangeRate: exchangeRate,
        currency: currency,
        date: date, // Garante que a data atualizada seja enviada
        origin: origin
      });

      toast({
        title: 'Aporte atualizado',
        description: 'Os dados foram atualizados com sucesso.',
        variant: 'success',
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o aporte.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      {/* Data do aporte */}
      <DatePickerField date={date} onDateChange={handleDateChange} />

      {/* Moeda (BRL ou USD) */}
      <CurrencySelector selectedCurrency={currency} onChange={handleCurrencyChange} />

      {/* Valor Investido e BTC */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Campo de Valor Investido */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="editAmount">Valor Investido</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
              {currency === 'USD' ? '$' : 'R$'}
            </span>
            <Input
              id="editAmount"
              placeholder="0,00"
              value={amountInvestedDisplay}
              onChange={(e) => {
                // Substitui pontos por vírgulas para compatibilidade com formato brasileiro
                const formattedInput = e.target.value.replace(/\./g, ',');
                
                if (e.target.value === '0.') {
                  setAmountInvestedDisplay('0,');
                  return;
                }

                setAmountInvestedDisplay(formattedInput);
              }}
              className="pl-8 rounded-xl"
              type="text"
              required
            />
          </div>
        </div>

        {/* Campo de Bitcoin ou Sats */}
        <BtcInput displayUnit={displayUnit} value={btcAmountDisplay} onChange={setBtcAmountDisplay} />
      </div>

      {/* Cotação */}
      <div className="flex flex-col space-y-1.5 mt-4">
        <Label>Cotação no momento da compra</Label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
            {currency === 'USD' ? '$' : 'R$'}
          </span>
          <Input
            placeholder="0,00"
            value={exchangeRateDisplay}
            onChange={(e) => {
              // Substitui pontos por vírgulas para compatibilidade com formato brasileiro
              const formattedInput = e.target.value.replace(/\./g, ',');
              
              setExchangeRateDisplay(formattedInput);
              const val = parseLocalNumber(formattedInput);
              if (!isNaN(val)) {
                setExchangeRate(val);
              }
            }}
            className="pl-8 rounded-xl"
            type="text"
            required
          />
        </div>
      </div>

      {/* Origem do aporte */}
      <OriginSelector origin={origin} onOriginChange={handleOriginChange} />

      {/* Botões de ação */}
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 bg-bitcoin hover:bg-bitcoin/90 rounded-xl py-3 px-4">
          Atualizar
        </Button>
      </div>
    </form>
  );
};

export default EntryEditForm;
