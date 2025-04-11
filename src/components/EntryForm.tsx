
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useIsMobile } from '@/hooks/use-mobile';

interface EntryFormProps {
  onAddEntry: (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date
  ) => void;
  currentRate: { usd: number; brl: number };
  editingEntry?: {
    id: string;
    date: Date;
    amountInvested: number;
    btcAmount: number;
    exchangeRate: number;
    currency: 'BRL' | 'USD';
  };
  onCancelEdit?: () => void;
  displayUnit?: 'BTC' | 'SATS';
}

const EntryForm: React.FC<EntryFormProps> = ({ 
  onAddEntry, 
  currentRate, 
  editingEntry, 
  onCancelEdit,
  displayUnit = 'BTC'
}) => {
  const [amountInvested, setAmountInvested] = useState(
    editingEntry ? formatNumber(editingEntry.amountInvested) : ''
  );
  const [btcAmount, setBtcAmount] = useState(
    editingEntry 
      ? (displayUnit === 'SATS' 
          ? formatNumber(editingEntry.btcAmount * 100000000, 0) 
          : formatNumber(editingEntry.btcAmount, 8))
      : ''
  );
  const [exchangeRate, setExchangeRate] = useState(
    editingEntry ? formatNumber(editingEntry.exchangeRate) : ''
  );
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(
    editingEntry ? editingEntry.currency : 'BRL'
  );
  const [date, setDate] = useState<Date>(
    editingEntry ? editingEntry.date : new Date()
  );
  const [tempDate, setTempDate] = useState<Date>(date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

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

  const resetForm = () => {
    setAmountInvested('');
    setBtcAmount('');
    setExchangeRate('');
    setDate(new Date());
    setTempDate(new Date());
    if (onCancelEdit) {
      onCancelEdit();
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
      return;
    }
    
    onAddEntry(parsedAmount, parsedBtc, parsedRate, currency, date);
    
    // Limpar o formulário
    resetForm();
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
      // Quando o calendário abre, inicialize tempDate com a data atual selecionada
      setTempDate(date);
    }
  };

  return (
    <Card>
      <CardHeader className={`${isMobile ? "pb-2" : "pb-3"}`}>
        <CardTitle className={`${isMobile ? "text-lg" : "text-xl"} flex items-center gap-2`}>
          <Bitcoin className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-bitcoin`} />
          {editingEntry ? 'Editar Aporte' : 'Registrar Novo Aporte'}
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? "pb-3" : ""}>
        <form onSubmit={handleSubmit} className={`space-y-${isMobile ? "3" : "4"}`}>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="purchaseDate">Data do Aporte</Label>
            <div className="flex gap-2">
              <Popover open={isCalendarOpen} onOpenChange={handleCalendarToggle}>
                <PopoverTrigger asChild>
                  <Button
                    ref={calendarPopoverRef}
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                      isMobile && "text-sm"
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
                      className="rounded-md border"
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
                size={isMobile ? "sm" : "default"}
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Hoje
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="currency">Moeda</Label>
            <CurrencySelector
              selectedCurrency={currency}
              onChange={handleCurrencyChange}
              buttonType="button" // Add buttonType="button" to prevent form submission
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Valor Investido</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                  {currency === 'USD' ? '$' : 'R$'}
                </span>
                <Input
                  id="amount"
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
              <Label htmlFor="btcAmount">{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                  <Bitcoin className="h-4 w-4" />
                </span>
                <Input
                  id="btcAmount"
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
              <Label htmlFor="exchangeRate">Cotação no momento da compra</Label>
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
                id="exchangeRate"
                placeholder="0,00"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="pl-8"
                type="text"
                required
              />
            </div>
          </div>
          
          <div className={`grid grid-cols-1 gap-2 ${isMobile ? "grid-cols-2" : "md:grid-cols-3"}`}>
            {!editingEntry ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={calculateFromAmount}
                  className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  {isMobile ? "" : "Calcular "}{displayUnit === 'SATS' ? 'Satoshis' : 'BTC'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={calculateFromBtc}
                  className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  {isMobile ? "" : "Calcular "}Valor
                </Button>
                <Button 
                  type="submit" 
                  className={`${isMobile ? "col-span-2" : "col-span-1"} bg-bitcoin hover:bg-bitcoin-dark`}
                >
                  Registrar
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={calculateFromAmount}
                  className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  Calcular {displayUnit === 'SATS' ? 'Satoshis' : 'BTC'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                  className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className={`${isMobile ? "col-span-2" : "col-span-1"} bg-bitcoin hover:bg-bitcoin-dark`}
                >
                  Atualizar
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EntryForm;
