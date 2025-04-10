
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import CurrencySelector from '@/components/CurrencySelector';
import { Bitcoin, CalendarIcon, CalendarCheck, Check } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';

interface EntryEditFormProps {
  entry: BitcoinEntry;
  currentRate: CurrentRate;
  onClose: () => void;
}

const EntryEditForm: React.FC<EntryEditFormProps> = ({ 
  entry, 
  currentRate, 
  onClose 
}) => {
  const { addEntry } = useBitcoinEntries();
  
  const [amountInvested, setAmountInvested] = useState(
    formatNumber(entry.amountInvested)
  );
  const [btcAmount, setBtcAmount] = useState(
    formatNumber(entry.btcAmount, 8)
  );
  const [exchangeRate, setExchangeRate] = useState(
    formatNumber(entry.exchangeRate)
  );
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(entry.currency);
  const [date, setDate] = useState<Date>(entry.date);
  const [tempDate, setTempDate] = useState<Date>(date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);

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
    
    const parsedAmount = parseLocalNumber(amountInvested);
    const parsedBtc = parseLocalNumber(btcAmount);
    const parsedRate = parseLocalNumber(exchangeRate);
    
    if (isNaN(parsedAmount) || isNaN(parsedBtc) || isNaN(parsedRate)) {
      return;
    }
    
    // Use the existing entry.id so it updates instead of creating new
    addEntry(parsedAmount, parsedBtc, parsedRate, currency, date);
    
    onClose();
  };

  const calculateFromAmount = () => {
    const amount = parseLocalNumber(amountInvested);
    const rate = parseLocalNumber(exchangeRate);
    
    if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
      const btc = amount / rate;
      setBtcAmount(formatNumber(btc, 8));
    }
  };

  const calculateFromBtc = () => {
    const btc = parseLocalNumber(btcAmount);
    const rate = parseLocalNumber(exchangeRate);
    
    if (!isNaN(btc) && !isNaN(rate)) {
      const amount = btc * rate;
      setAmountInvested(formatNumber(amount));
    }
  };

  const useCurrentRate = () => {
    if (currentRate) {
      const rate = currency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(formatNumber(rate));
    }
  };

  const setToday = () => {
    setTempDate(new Date());
    confirmDateSelection();
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
                />
                <div className="flex justify-end mt-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsCalendarOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={confirmDateSelection}
                    className="bg-bitcoin hover:bg-bitcoin-dark"
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
          <Label htmlFor="editBtcAmount">Quantidade de Bitcoin</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
              <Bitcoin className="h-4 w-4" />
            </span>
            <Input
              id="editBtcAmount"
              placeholder="0,00000000"
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
      
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={calculateFromAmount}
        >
          Calcular BTC
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
