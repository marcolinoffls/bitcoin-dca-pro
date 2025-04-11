
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import CurrencySelector from '@/components/CurrencySelector';
import { Bitcoin, CalendarIcon, CalendarCheck, Check, Calculator } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [date, setDate] = useState<Date>(entry.date);
  const [tempDate, setTempDate] = useState<Date>(entry.date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Track if component is mounted to prevent state updates after unmounting
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Função para converter string com vírgula para número
  const parseLocalNumber = (value: string): number => {
    return parseFloat(value.replace(',', '.'));
  };

  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    setCurrency(newCurrency);
    
    // Atualizar a taxa de câmbio com base na moeda selecionada
    if (currentRate) {
      setExchangeRate(
        formatNumber(newCurrency === 'USD' ? currentRate.usd : currentRate.brl)
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedAmount = parseLocalNumber(amountInvested);
    let parsedBtc = parseLocalNumber(btcAmount);
    
    // Convert from satoshis to BTC if necessary
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
    
    // Find and update entry directly in localStorage to avoid the issue with the hook
    const savedEntries = localStorage.getItem('bitcoin-entries');
    if (savedEntries) {
      try {
        const entries = JSON.parse(savedEntries);
        const updatedEntries = entries.map((savedEntry: any) => {
          if (savedEntry.id === entry.id) {
            return {
              ...savedEntry,
              amountInvested: parsedAmount,
              btcAmount: parsedBtc,
              exchangeRate: parsedRate,
              currency,
              date: date.toISOString() // Use the selected date
            };
          }
          return savedEntry;
        });
        
        localStorage.setItem('bitcoin-entries', JSON.stringify(updatedEntries));
        
        // Reload the page to refresh the data
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
    }
    
    onClose();
  };

  const calculateFromAmount = () => {
    const amount = parseLocalNumber(amountInvested);
    const rate = parseLocalNumber(exchangeRate);
    
    if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
      const btc = amount / rate;
      if (displayUnit === 'SATS') {
        setBtcAmount(formatNumber(btc * 100000000, 0));
      } else {
        setBtcAmount(formatNumber(btc, 8));
      }
    }
  };

  const calculateFromBtc = () => {
    let btc = parseLocalNumber(btcAmount);
    
    // Convert from satoshis to BTC if necessary
    if (displayUnit === 'SATS') {
      btc = btc / 100000000;
    }
    
    const rate = parseLocalNumber(exchangeRate);
    
    if (!isNaN(btc) && !isNaN(rate)) {
      const amount = btc * rate;
      setAmountInvested(formatNumber(amount));
    }
  };

  const calculateFromExchange = () => {
    const amount = parseLocalNumber(amountInvested);
    let btc = parseLocalNumber(btcAmount);
    
    // Convert from satoshis to BTC if necessary
    if (displayUnit === 'SATS') {
      btc = btc / 100000000;
    }
    
    if (!isNaN(amount) && !isNaN(btc) && btc > 0) {
      const rate = amount / btc;
      setExchangeRate(formatNumber(rate));
    }
  };

  const useCurrentRate = () => {
    if (currentRate) {
      const rate = currency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(formatNumber(rate));
    }
  };

  const setToday = () => {
    const today = new Date();
    setDate(today);
    setTempDate(today);
    setIsCalendarOpen(false);
  };

  const confirmDateSelection = () => {
    setDate(tempDate);
    setIsCalendarOpen(false);
  };

  const handleCalendarToggle = (open: boolean) => {
    setIsCalendarOpen(open);
    if (open) {
      setTempDate(date);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="editPurchaseDate">Data do Aporte</Label>
        <div className="flex gap-2">
          <Popover open={isCalendarOpen} onOpenChange={handleCalendarToggle}>
            <PopoverTrigger asChild>
              <Button
                ref={calendarPopoverRef}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                type="button" // Add type="button" to prevent form submission
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2">
                <Calendar
                  mode="single"
                  selected={tempDate}
                  onSelect={(newDate) => newDate && setTempDate(newDate)}
                  initialFocus
                  defaultMonth={tempDate}
                  locale={ptBR}
                  className="rounded-md border pointer-events-auto"
                />
                <div className="flex justify-end mt-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsCalendarOpen(false)}
                    type="button" // Add type="button" to prevent form submission
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={confirmDateSelection}
                    className="bg-[#F97316] hover:bg-[#E85D04]"
                    type="button" // Add type="button" to prevent form submission
                  >
                    <Check className="h-4 w-4 mr-1" />
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
            className="shrink-0"
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
          buttonType="button" // Add buttonType="button" to prevent form submission
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
              onChange={(e) => setAmountInvested(e.target.value)}
              className="pl-8"
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
              className="pl-8"
              type="text"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-1.5">
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
            className="pl-8"
            type="text"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={calculateFromAmount}
          className="text-xs px-2"
        >
          <Calculator className="h-4 w-4 mr-1" />
          Calcular {displayUnit === 'SATS' ? 'Satoshis' : 'BTC'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={calculateFromBtc}
          className="text-xs px-2"
        >
          <Calculator className="h-4 w-4 mr-1" />
          Calcular Valor
        </Button>
        <Button 
          type="submit" 
          className="bg-bitcoin hover:bg-bitcoin-dark"
        >
          Atualizar
        </Button>
      </div>
    </form>
  );
};

export default EntryEditForm;
