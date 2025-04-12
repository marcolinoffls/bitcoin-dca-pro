
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DatePickerField from '@/components/form/DatePickerField';
import CurrencyField from '@/components/form/CurrencyField';
import AmountField from '@/components/form/AmountField';
import BtcAmountField from '@/components/form/BtcAmountField';
import ExchangeRateField from '@/components/form/ExchangeRateField';
import OriginSelector from '@/components/form/OriginSelector';
import FormActions from '@/components/form/FormActions';
import { useEntryFormLogic } from '@/components/form/EntryFormLogic';

interface EntryFormProps {
  onAddEntry: (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p'
  ) => void;
  currentRate: { usd: number; brl: number };
  editingEntry?: {
    id: string;
    date: Date;
    amountInvested: number;
    btcAmount: number;
    exchangeRate: number;
    currency: 'BRL' | 'USD';
    origin?: 'corretora' | 'p2p';
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
  const isMobile = useIsMobile();
  const {
    amountInvested,
    setAmountInvested,
    btcAmount,
    setBtcAmount,
    exchangeRate,
    exchangeRateDisplay,
    handleExchangeRateChange,
    currency,
    origin,
    date,
    setDate,
    parseLocalNumber,
    handleCurrencyChange,
    handleOriginChange,
    calculateFromAmount,
    calculateFromBtc,
    useCurrentRate,
    reset
  } = useEntryFormLogic(editingEntry, currentRate, displayUnit);

  const resetForm = () => {
    reset();
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedAmount = parseLocalNumber(amountInvested);
    let parsedBtc = parseLocalNumber(btcAmount);
    
    if (displayUnit === 'SATS') {
      parsedBtc = parsedBtc / 100000000;
    }
    
    // Usar diretamente o valor numérico da cotação
    const parsedRate = exchangeRate;
    
    if (isNaN(parsedAmount) || isNaN(parsedBtc) || isNaN(parsedRate) || parsedRate === 0) {
      return;
    }
    
    onAddEntry(parsedAmount, parsedBtc, parsedRate, currency, date, origin);
    
    resetForm();
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className={`${isMobile ? "pb-2" : "pb-3"}`}>
        <CardTitle className={`${isMobile ? "text-lg" : "text-xl"} flex items-center gap-2`}>
          <Bitcoin className={`${isMobile ? "h-5 w-5" : "h-6 w-6"} text-bitcoin`} />
          {editingEntry ? 'Editar Aporte' : 'Registrar Novo Aporte'}
        </CardTitle>
      </CardHeader>
      <CardContent className={isMobile ? "pb-3" : ""}>
        <form onSubmit={handleSubmit} className={`space-y-${isMobile ? "3" : "4"}`}>
          <DatePickerField 
            date={date} 
            onDateChange={setDate} 
          />
          
          <CurrencyField 
            currency={currency} 
            onCurrencyChange={handleCurrencyChange} 
          />
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AmountField 
              currency={currency} 
              amount={amountInvested} 
              onAmountChange={setAmountInvested} 
            />
            
            <BtcAmountField 
              btcAmount={btcAmount} 
              onBtcAmountChange={setBtcAmount} 
              displayUnit={displayUnit} 
            />
          </div>
          
          <ExchangeRateField 
            currency={currency} 
            exchangeRate={exchangeRate}
            displayValue={exchangeRateDisplay}
            onExchangeRateChange={handleExchangeRateChange} 
            onUseCurrentRate={useCurrentRate} 
          />
          
          <OriginSelector
            origin={origin}
            onOriginChange={handleOriginChange}
          />
          
          <FormActions 
            isEditing={!!editingEntry} 
            displayUnit={displayUnit} 
            onCalculateFromAmount={calculateFromAmount} 
            onCalculateFromBtc={calculateFromBtc} 
            onReset={resetForm} 
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default EntryForm;
