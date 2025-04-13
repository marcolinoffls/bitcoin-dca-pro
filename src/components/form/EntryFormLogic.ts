import { useState, useEffect } from 'react';

/**
 * Hook que centraliza toda a lógica do formulário de aporte
 * 
 * - Controla estados de valores, data, cotação
 * - Realiza cálculos automáticos
 * - Gerencia validações e formatações
 * 
 * Este hook é usado tanto por EntryForm quanto EntryEditForm
 */
export const useEntryFormLogic = (
  editingEntry?: {
    id: string;
    date: Date;
    amountInvested: number;
    btcAmount: number;
    exchangeRate: number;
    currency: 'BRL' | 'USD';
    origin?: 'corretora' | 'p2p' | 'planilha';
  },
  currentRate?: { usd: number; brl: number },
  displayUnit: 'BTC' | 'SATS' = 'BTC'
) => {
  // State para valores do formulário
  const [amountInvested, setAmountInvested] = useState<string>(
    editingEntry ? formatValor(editingEntry.amountInvested) : ""
  );
  
  // Quantidade de BTC (ou SATS) ajustada com base na unidade
  const [btcAmount, setBtcAmount] = useState<string>(() => {
    if (!editingEntry) return "";
    
    // Se estiver em SATS, converter de BTC para SATS
    const amount = displayUnit === 'SATS' 
      ? editingEntry.btcAmount * 100000000 
      : editingEntry.btcAmount;
      
    return formatValor(amount);
  });
  
  // Taxa de câmbio/cotação do Bitcoin
  const [exchangeRate, setExchangeRate] = useState<number>(
    editingEntry ? editingEntry.exchangeRate : 
    currentRate ? (currentRate.brl || 0) : 0
  );
  
  // Valor formatado para exibição da taxa
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState<string>(
    editingEntry ? formatValor(editingEntry.exchangeRate) : 
    currentRate ? formatValor(currentRate.brl || 0) : ""
  );
  
  // Moeda selecionada (BRL ou USD)
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(
    editingEntry ? editingEntry.currency : 'BRL'
  );
  
  // Origem do aporte (Corretora, P2P ou Planilha)
  const [origin, setOrigin] = useState<'corretora' | 'p2p' | 'planilha'>(
    editingEntry && editingEntry.origin ? editingEntry.origin : 'corretora'
  );
  
  // Data do aporte
  const [date, setDate] = useState<Date>(
    editingEntry ? new Date(editingEntry.date) : new Date()
  );

  // Atualiza a cotação quando a moeda muda
  useEffect(() => {
    if (!currentRate) return;
    
    const newRate = currency === 'BRL' ? currentRate.brl : currentRate.usd;
    if (newRate) {
      setExchangeRate(newRate);
      setExchangeRateDisplay(formatValor(newRate));
    }
  }, [currency, currentRate]);

  // Função para formatar valores
  const formatValor = (valor: number): string => {
    return valor.toString().replace(".", ",");
  };

  // Função para converter strings com vírgula para números
  const parseLocalNumber = (valorString: string): number => {
    const normalizedValue = valorString.replace(",", ".");
    return parseFloat(normalizedValue);
  };

  // Atualiza a cotação manualmente
  const handleExchangeRateChange = (value: string) => {
    setExchangeRateDisplay(value);
    const parsed = parseLocalNumber(value);
    if (!isNaN(parsed)) {
      setExchangeRate(parsed);
    }
  };

  // Muda a moeda selecionada
  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    if (newCurrency === currency) return;
    
    setCurrency(newCurrency);
    
    // Atualizar a cotação com base na nova moeda
    if (currentRate) {
      const newRate = newCurrency === 'BRL' ? currentRate.brl : currentRate.usd;
      setExchangeRate(newRate);
      setExchangeRateDisplay(formatValor(newRate));
    }
  };

  // Muda a origem do aporte
  const handleOriginChange = (newOrigin: 'corretora' | 'p2p' | 'planilha') => {
    setOrigin(newOrigin);
  };

  // Calcula quantidade de BTC com base no valor investido
  const calculateFromAmount = () => {
    const valorInvestido = parseLocalNumber(amountInvested);
    if (isNaN(valorInvestido) || valorInvestido <= 0 || exchangeRate <= 0) {
      return;
    }

    // Calcular quantidade de BTC
    let btcValue = valorInvestido / exchangeRate;
    
    // Se a exibição for em SATS, converter para SATS
    if (displayUnit === 'SATS') {
      btcValue = btcValue * 100000000;
    }
    
    setBtcAmount(formatValor(btcValue));
  };

  // Calcula valor investido com base na quantidade de BTC
  const calculateFromBtc = () => {
    let btcValue = parseLocalNumber(btcAmount);
    if (isNaN(btcValue) || btcValue <= 0 || exchangeRate <= 0) {
      return;
    }

    // Se a exibição for em SATS, converter para BTC
    if (displayUnit === 'SATS') {
      btcValue = btcValue / 100000000;
    }
    
    // Calcular valor investido
    const valorCalculado = btcValue * exchangeRate;
    setAmountInvested(formatValor(valorCalculado));
  };

  // Limpa o formulário
  const reset = () => {
    setAmountInvested("");
    setBtcAmount("");
    setExchangeRate(currentRate ? (currency === 'BRL' ? currentRate.brl : currentRate.usd) : 0);
    setExchangeRateDisplay(currentRate ? formatValor(currency === 'BRL' ? currentRate.brl : currentRate.usd) : "");
    setCurrency('BRL');
    setOrigin('corretora');
    setDate(new Date());
  };

  return {
    amountInvested,
    setAmountInvested,
    btcAmount,
    setBtcAmount,
    exchangeRate,
    exchangeRateDisplay,
    handleExchangeRateChange,
    currency,
    setCurrency,
    origin,
    setOrigin,
    date,
    setDate,
    formatValor,
    parseLocalNumber,
    handleCurrencyChange,
    handleOriginChange,
    calculateFromAmount,
    calculateFromBtc,
    reset
  };
};
