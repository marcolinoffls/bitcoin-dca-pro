
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
  // Armazenar o valor numérico puro para a cotação
  const [exchangeRate, setExchangeRate] = useState<number>(
    editingEntry ? editingEntry.exchangeRate : 0
  );
  // Armazenar a representação formatada para exibição
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState(
    editingEntry ? formatNumber(editingEntry.exchangeRate) : ''
  );
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(
    editingEntry ? editingEntry.currency : 'BRL'
  );
  const [origin, setOrigin] = useState<'corretora' | 'p2p'>(
    editingEntry?.origin || 'corretora'
  );
  const [date, setDate] = useState<Date>(
    editingEntry ? editingEntry.date : new Date()
  );

  const parseLocalNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    setCurrency(newCurrency);
    
    if (currentRate) {
      // Usar o valor numérico puro
      const newRate = newCurrency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(newRate);
      // Formatar para exibição
      setExchangeRateDisplay(formatCurrency(newRate, newCurrency));
    }
  };

  const handleOriginChange = (newOrigin: 'corretora' | 'p2p') => {
    setOrigin(newOrigin);
  };

  const calculateFromAmount = () => {
    const amount = parseLocalNumber(amountInvested);
    
    if (!isNaN(amount) && exchangeRate > 0) {
      const btc = amount / exchangeRate;
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
    
    if (!isNaN(btc) && exchangeRate > 0) {
      const amount = btc * exchangeRate;
      setAmountInvested(formatNumber(amount));
    }
  };

  // Função para formatar o valor da moeda para exibição
  const formatCurrency = (value: number, currencyType: 'BRL' | 'USD'): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: currencyType === 'USD' ? 'USD' : 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Atualizado para trabalhar com o valor numérico puro e a representação formatada
  const handleExchangeRateChange = (value: string) => {
    setExchangeRateDisplay(value);
    
    // Tentativa de converter para número
    try {
      const numericValue = parseLocalNumber(value);
      if (!isNaN(numericValue)) {
        setExchangeRate(numericValue);
      }
    } catch (e) {
      // Se falhar na conversão, não atualiza o valor numérico
      console.log("Erro ao converter valor:", e);
    }
  };

  const useCurrentRate = () => {
    if (currentRate) {
      // Usar o valor numérico puro
      const rate = currency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(rate);
      // Formatar para exibição
      setExchangeRateDisplay(formatCurrency(rate, currency));
    }
  };

  const reset = () => {
    setAmountInvested('');
    setBtcAmount('');
    setExchangeRate(0);
    setExchangeRateDisplay('');
    setDate(new Date());
    setOrigin('corretora');
  };

  return {
    amountInvested,
    setAmountInvested,
    btcAmount,
    setBtcAmount,
    exchangeRate, // Valor numérico puro
    exchangeRateDisplay, // Valor formatado para exibição
    setExchangeRate, // Método para atualizar o valor numérico
    handleExchangeRateChange, // Método para atualizar o valor formatado
    currency,
    setCurrency,
    origin,
    setOrigin,
    date,
    setDate,
    parseLocalNumber,
    handleCurrencyChange,
    handleOriginChange,
    calculateFromAmount,
    calculateFromBtc,
    useCurrentRate,
    reset
  };
};
