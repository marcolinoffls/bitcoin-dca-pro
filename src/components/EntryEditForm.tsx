
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import CurrencySelector from '@/components/CurrencySelector';
import OriginSelector from '@/components/OriginSelector';
import { Bitcoin, CalendarIcon, CalendarCheck, Check } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  displayUnit = 'BTC'
}) => {
  const [amountInvested, setAmountInvested] = useState(
    formatNumber(entry.amountInvested)
  );
  const [btcAmount, setBtcAmount] = useState(
    displayUnit === 'SATS' 
      ? formatNumber(entry.btcAmount * 100000000, 0)
      : formatNumber(entry.btcAmount, 8)
  );
  const [exchangeRate, setExchangeRate] = useState(
    formatNumber(entry.exchangeRate)
  );
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(entry.currency);
  const [origin, setOrigin] = useState<'corretora' | 'p2p'>(
    entry.origin || 'corretora'
  );
  const [date, setDate] = useState<Date>(entry.date);
  const [tempDate, setTempDate] = useState<Date>(entry.date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const parseLocalNumber = (value: string): number => {
    return parseFloat(value.replace(',', '.'));
  };

  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    setCurrency(newCurrency);
    
    if (currentRate) {
      setExchangeRate(
        formatNumber(newCurrency === 'USD' ? currentRate.usd : currentRate.brl)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para editar aportes.",
        variant: "destructive"
      });
      return;
    }
    
    let parsedAmount = parseLocalNumber(amountInvested);
    let parsedBtc = parseLocalNumber(btcAmount);
    
    if (displayUnit === 'SATS') {
      parsedBtc = parsedBtc / 100000000;
    }
    
    const parsedRate = parseLocalNumber(exchangeRate);
    
    if (isNaN(parsedAmount) || isNaN(parsedBtc) || isNaN(parsedRate)) {
      toast({
        title: "Erro nos dados",
        description: "Por favor, verifique os valores inseridos.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Update entry in Supabase
      const { error } = await supabase
        .from('aportes')
        .update({
          data_aporte: date.toISOString().split('T')[0],
          moeda: currency,
          cotacao_moeda: currency,
          valor_investido: parsedAmount,
          bitcoin: parsedBtc,
          cotacao: parsedRate,
          origem_aporte: origin
        })
        .eq('id', entry.id);
        
      if (error) throw error;
      
      // Reload the page to see updated data
      window.location.reload();
      
      toast({
        title: "Aporte atualizado",
        description: "Os dados do aporte foram atualizados com sucesso."
      });
    } catch (error) {
      console.error("Error updating entry:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o aporte.",
        variant: "destructive"
      });
    }
    
    onClose();
  };

  const useCurrentRate = () => {
    if (currentRate) {
      const rate = currency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(formatNumber(rate));
    }
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setTempDate(newDate);
    }
  };

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="editPurchaseDate">Data do Aporte</Label>
        <div className="flex gap-4">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={calendarPopoverRef}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-xl",
                  !date && "text-muted-foreground"
                )}
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <div className="p-3 rounded-md shadow-sm">
                <Calendar
                  mode="single"
                  selected={tempDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  locale={ptBR}
                  className="rounded-md border-0 shadow-none pointer-events-auto"
                />
                <div className="flex justify-center p-2 mt-2">
                  <Button 
                    type="button" 
                    onClick={confirmDateSelection}
                    className="rounded-full bg-bitcoin hover:bg-bitcoin/90 text-white px-4 w-auto"
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
      
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="editCurrency">Moeda</Label>
        <CurrencySelector
          selectedCurrency={currency}
          onChange={handleCurrencyChange}
          buttonType="button"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="editAmount">Valor Investido</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
              {currency === 'USD' ? '$' : 'R$'}
            </span>
            <Input
              id="editAmount"
              placeholder="0,00"
              value={amountInvested}
              onChange={(e) => {
                setAmountInvested(e.target.value);
                // Auto-calculate BTC amount when amount changes
                const amount = parseLocalNumber(e.target.value);
                const rate = parseLocalNumber(exchangeRate);
                if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
                  const btc = amount / rate;
                  if (displayUnit === 'SATS') {
                    setBtcAmount(formatNumber(btc * 100000000, 0));
                  } else {
                    setBtcAmount(formatNumber(btc, 8));
                  }
                }
              }}
              className="pl-8 rounded-xl"
              type="text"
              required
            />
          </div>
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="editBtcAmount">{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
              <Bitcoin className="h-4 w-4" />
            </span>
            <Input
              id="editBtcAmount"
              placeholder={displayUnit === 'SATS' ? "0" : "0,00000000"}
              value={btcAmount}
              onChange={(e) => setBtcAmount(e.target.value)}
              className="pl-8 rounded-xl"
              type="text"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-1.5 mt-4">
        <div className="flex justify-between">
          <Label htmlFor="editExchangeRate">Cotação no momento da compra</Label>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={useCurrentRate} 
            className="h-6 text-xs"
          >
            Usar cotação atual
          </Button>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
            {currency === 'USD' ? '$' : 'R$'}
          </span>
          <Input
            id="editExchangeRate"
            placeholder="0,00"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            className="pl-8 rounded-xl"
            type="text"
            required
          />
        </div>
      </div>
      
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="editOrigin">Origem do Aporte</Label>
        <OriginSelector
          selectedOrigin={origin}
          onChange={setOrigin}
          buttonType="button"
        />
      </div>
      
      <div className="flex gap-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="flex-1 rounded-xl"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-bitcoin hover:bg-bitcoin/90 rounded-xl py-3 px-4"
        >
          Atualizar
        </Button>
      </div>
    </form>
  );
};

export default EntryEditForm;
