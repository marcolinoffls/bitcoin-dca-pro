
import { useState } from 'react';
import { formatNumber } from '@/lib/utils';

export const useEntryFormLogic = (
  editingEntry: any,
  currentRate: { usd: number; brl: number },
  displayUnit: 'BTC' | 'SATS'
) => {
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

  const reset = () => {
    setAmountInvested('');
    setBtcAmount('');
    setExchangeRate('');
    setDate(new Date());
  };

  return {
    amountInvested,
    setAmountInvested,
    btcAmount,
    setBtcAmount,
    exchangeRate,
    setExchangeRate,
    currency,
    setCurrency,
    date,
    setDate,
    parseLocalNumber,
    handleCurrencyChange,
    calculateFromAmount,
    calculateFromBtc,
    useCurrentRate,
    reset
  };
};
