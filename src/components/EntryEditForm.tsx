
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
 * - Corrigido problema de validação dos campos numéricos, aceitando vírgula ou ponto
 * - Adicionado suporte a cotação opcional com cálculo automático
 * - Corrigido importação do tipo Origin
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BitcoinEntry, CurrentRate, Origin } from '@/types';
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
import { FormError } from '@/components/auth/FormError';

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
  const [origin, setOrigin] = useState<Origin>(entry.origin || 'corretora');
  const [formError, setFormError] = useState<string | null>(null);
  const [rateInfoMessage, setRateInfoMessage] = useState<string | null>(null);
  const [isExchangeRateCalculated, setIsExchangeRateCalculated] = useState<boolean>(false);
  
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

  // Aceita tanto vírgula quanto ponto como separador decimal e normaliza para o formato brasileiro
  const handleAmountChange = (value: string) => {
    // Remove todos os caracteres que não sejam números, vírgula ou ponto
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Substitui pontos por vírgulas para o formato brasileiro
    const formattedValue = cleanedValue.replace(/\./g, ',');
    
    setAmountInvestedDisplay(formattedValue);
  };

  // Aceita tanto vírgula quanto ponto como separador decimal e normaliza para o formato brasileiro
  const handleExchangeRateChange = (value: string) => {
    // Remove todos os caracteres que não sejam números, vírgula ou ponto
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Substitui pontos por vírgulas para o formato brasileiro
    const formattedValue = cleanedValue.replace(/\./g, ',');
    
    setExchangeRateDisplay(formattedValue);
    const val = parseLocalNumber(formattedValue);
    if (!isNaN(val)) {
      setExchangeRate(val);
      setIsExchangeRateCalculated(false);
    }
  };

  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    setCurrency(newCurrency);
    if (currentRate) {
      const newRate = newCurrency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(newRate);
      setExchangeRateDisplay(formatNumber(newRate));
      setIsExchangeRateCalculated(false);
    }
  };

  const handleOriginChange = (newOrigin: Origin) => {
    setOrigin(newOrigin);
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

  /**
   * Calcula automaticamente a cotação baseada no valor investido e na quantidade de BTC
   * Retorna true se o cálculo foi bem-sucedido, false caso contrário
   */
  const calculateExchangeRate = (): boolean => {
    const parsedAmount = parseLocalNumber(amountInvestedDisplay);
    const parsedBtc = parseLocalNumber(btcAmountDisplay);
    
    // Verificações de segurança
    if (isNaN(parsedAmount) || parsedAmount <= 0) return false;
    
    // Converte SATS para BTC se necessário
    const btc = displayUnit === 'SATS' ? parsedBtc / 100000000 : parsedBtc;
    
    // Evita divisão por zero
    if (isNaN(btc) || btc <= 0) return false;
    
    const calculatedRate = parsedAmount / btc;
    
    // Atualiza os estados
    setExchangeRate(calculatedRate);
    setExchangeRateDisplay(formatNumber(calculatedRate));
    setIsExchangeRateCalculated(true);
    
    return true;
  };

  /**
   * Valida o formulário, verificando se os campos obrigatórios estão preenchidos
   * e se os valores são válidos
   */
  const validateForm = (): string | null => {
    const parsedAmount = parseLocalNumber(amountInvestedDisplay);
    const parsedBtc = parseLocalNumber(btcAmountDisplay);
    
    // Verificar valor investido
    if (!amountInvestedDisplay.trim()) {
      return 'O valor investido é obrigatório';
    }
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'O valor investido deve ser um número positivo';
    }
    
    // Verificar quantidade de BTC
    if (!btcAmountDisplay.trim()) {
      return 'A quantidade de Bitcoin é obrigatória';
    }
    
    if (isNaN(parsedBtc) || parsedBtc <= 0) {
      return 'A quantidade de Bitcoin deve ser um número positivo';
    }
    
    // Se a data é inválida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Selecione uma data válida';
    }
    
    // Se a cotação foi preenchida, validar
    if (exchangeRateDisplay.trim()) {
      const parsedRate = parseLocalNumber(exchangeRateDisplay);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        return 'A cotação deve ser um número positivo';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setRateInfoMessage(null);

    if (!user) {
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para editar aportes.',
        variant: 'destructive',
      });
      return;
    }

    // Validação inicial do formulário
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    // Converte os valores de string para number para processamento
    let parsedAmount = parseLocalNumber(amountInvestedDisplay);
    let parsedBtc = parseLocalNumber(btcAmountDisplay);
    // Converte SATS para BTC se necessário
    if (displayUnit === 'SATS') parsedBtc = parsedBtc / 100000000;
    
    // Se a cotação não foi preenchida ou é zero, calcula automaticamente
    let parsedRate = exchangeRate;
    if (!exchangeRateDisplay.trim() || parsedRate === 0) {
      const success = calculateExchangeRate();
      if (!success) {
        setFormError("Não foi possível calcular a cotação. Verifique os valores informados.");
        return;
      }
      parsedRate = exchangeRate; // Usa o valor calculado
      setRateInfoMessage("Cotação calculada automaticamente com base no valor investido e quantidade de bitcoin.");
    }

    // Garantir que a data é válida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      setFormError('Data inválida. Por favor, selecione uma data válida.');
      return;
    }

    // Log para verificar os dados antes de enviar
    console.log('Dados sendo enviados para atualização:', {
      id: entry.id,
      amountInvested: parsedAmount,
      btcAmount: parsedBtc,
      exchangeRate: parsedRate,
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
        exchangeRate: parsedRate,
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
              onChange={(e) => handleAmountChange(e.target.value)}
              className="pl-8 rounded-xl"
              type="text"
              inputMode="decimal"
              required
            />
          </div>
        </div>

        {/* Campo de Bitcoin ou Sats */}
        <BtcInput displayUnit={displayUnit} value={btcAmountDisplay} onChange={setBtcAmountDisplay} />
      </div>

      {/* Cotação */}
      <div className="flex flex-col space-y-1.5 mt-4">
        <Label>
          Cotação no momento da compra
          <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
        </Label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
            {currency === 'USD' ? '$' : 'R$'}
          </span>
          <Input
            placeholder="Deixe vazio para cálculo automático"
            value={exchangeRateDisplay}
            onChange={(e) => handleExchangeRateChange(e.target.value)}
            className={`pl-8 rounded-xl ${isExchangeRateCalculated ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
            type="text"
            inputMode="decimal"
          />
        </div>
      </div>

      {/* Exibe mensagem de informação sobre cotação calculada */}
      {rateInfoMessage && (
        <FormError message={rateInfoMessage} variant="warning" />
      )}

      {/* Exibe mensagem de erro de validação */}
      {formError && (
        <FormError message={formError} variant="destructive" />
      )}

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
