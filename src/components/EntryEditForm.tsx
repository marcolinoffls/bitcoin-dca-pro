
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
 */

import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatNumber } from '@/lib/utils';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries'; // Importa o hook para uso direto

import CurrencySelector from '@/components/CurrencySelector';
import OriginSelector from '@/components/form/OriginSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarCheck, CalendarIcon, Check } from 'lucide-react';
import { BtcInput } from '@/components/form/BtcInput';

interface EntryEditFormProps {
  entry: BitcoinEntry;
  currentRate: CurrentRate;
  onClose: () => void;
  displayUnit?: 'BTC' | 'SATS';
}

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
  const [origin, setOrigin] = useState<'corretora' | 'p2p'>(entry.origin || 'corretora');
  const [date, setDate] = useState<Date>(entry.date);
  const [tempDate, setTempDate] = useState<Date>(entry.date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);

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

  // Essa função garante que a data selecionada no calendário seja aplicada corretamente
  const confirmDateSelection = () => {
    setDate(tempDate);
    setIsCalendarOpen(false);
  };

  const setToday = () => {
    const today = new Date();
    setDate(today);
    setTempDate(today);
    setIsCalendarOpen(false);
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

    try {
      // Usa a função updateEntry do hook useBitcoinEntries com a data correta
      await updateEntry(entry.id, {
        amountInvested: parsedAmount,
        btcAmount: parsedBtc,
        exchangeRate: exchangeRate,
        currency: currency,
        date: date, // Usa a data atualizada
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
      <div className="flex flex-col space-y-1.5">
        <Label>Data do Aporte</Label>
        <div className="flex gap-4">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={calendarPopoverRef}
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal rounded-xl',
                  !date && 'text-muted-foreground'
                )}
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 rounded-md shadow-sm">
                <Calendar
                  mode="single"
                  selected={tempDate}
                  onSelect={(newDate) => newDate && setTempDate(newDate)}
                  initialFocus
                  locale={ptBR}
                  className="rounded-md border-0 shadow-none pointer-events-auto"
                />
                <div className="flex justify-center p-2 mt-2">
                  <Button
                    type="button"
                    onClick={confirmDateSelection}
                    className="rounded-full bg-bitcoin hover:bg-bitcoin/90 text-white w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            onClick={setToday}
            className="shrink-0 rounded-xl"
          >
            <CalendarCheck className="h-4 w-4 mr-2" />
            Hoje
          </Button>
        </div>
      </div>

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
      <OriginSelector origin={origin} onOriginChange={setOrigin} />

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
