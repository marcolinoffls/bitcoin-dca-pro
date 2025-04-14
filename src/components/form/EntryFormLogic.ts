
/**
 * Hook: useEntryFormLogic
 *
 * Função:
 * Controla todos os estados e cálculos usados no formulário de registro/edição de aportes.
 *
 * Onde é usado:
 * - Em `EntryForm.tsx` (formulário principal da aplicação)
 *
 * Integrações:
 * - Controla unidade BTC/SATS
 * - Conecta com cotação atual (passada por props)
 * - Permite edição ou criação de aporte
 * 
 * Atualização:
 * - Convertido valores string para number para manipulação mais segura
 * - Mantido formato de exibição para o usuário com strings formatadas
 * - Adicionada função setExchangeRate para permitir definir a taxa diretamente
 */

import { useCallback, useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';

type Currency = 'BRL' | 'USD';
type DisplayUnit = 'BTC' | 'SATS';
type Origin = 'corretora' | 'p2p';

interface CurrentRate {
  usd: number;
  brl: number;
}

interface EditingEntry {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: Currency;
  origin?: Origin;
}

/**
 * Valida os dados do formulário e retorna os valores numéricos
 * Se algum valor for inválido, lança um erro
 */
export const validateForm = (
  amountInvested: string,
  btcAmount: string,
  exchangeRate: string
) => {
  // Converter os valores para números
  const numericAmount = parseFloat(amountInvested.replace(/\./g, '').replace(',', '.'));
  const numericBtcAmount = parseFloat(btcAmount.replace(/\./g, '').replace(',', '.'));
  const numericExchangeRate = parseFloat(exchangeRate.replace(/\./g, '').replace(',', '.'));
  
  // Validar o valor investido
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('O valor investido deve ser um número positivo');
  }
  
  // Validar a quantidade de Bitcoin
  if (isNaN(numericBtcAmount) || numericBtcAmount <= 0) {
    throw new Error('A quantidade de Bitcoin deve ser um número positivo');
  }
  
  // Validar a cotação
  if (isNaN(numericExchangeRate) || numericExchangeRate <= 0) {
    throw new Error('A cotação deve ser um número positivo');
  }
  
  return {
    numericAmount,
    numericBtcAmount,
    numericExchangeRate
  };
};

/**
 * Calcula a cotação com base no valor e quantidade de Bitcoin
 */
export const calculateExchangeRate = (
  amountInvested: string,
  btcAmount: string
) => {
  if (!amountInvested || !btcAmount) {
    return { calculatedRate: null };
  }
  
  try {
    const numericAmount = parseFloat(amountInvested.replace(/\./g, '').replace(',', '.'));
    const numericBtcAmount = parseFloat(btcAmount.replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(numericAmount) || isNaN(numericBtcAmount) || numericBtcAmount === 0) {
      return { calculatedRate: null };
    }
    
    const rate = numericAmount / numericBtcAmount;
    return { calculatedRate: formatNumber(rate, 2) };
  } catch (error) {
    console.error('Erro ao calcular cotação:', error);
    return { calculatedRate: null };
  }
};

export const useEntryFormLogic = (
  editingEntry?: EditingEntry,
  currentRate?: CurrentRate,
  displayUnit: DisplayUnit = 'BTC'
) => {
  // Estados principais do formulário - display strings para UI e valores numéricos para cálculos
  const [amountInvested, setAmountInvested] = useState<string>('');     // valor em real/dólar como string formatada
  const [btcAmount, setBtcAmount] = useState<string>('');               // valor em BTC ou SATS como string formatada
  const [exchangeRate, setExchangeRate] = useState<number>(0);          // número puro para cálculos
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState<string>(''); // string formatada para exibição
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [origin, setOrigin] = useState<Origin>('corretora');
  const [date, setDate] = useState<Date>(new Date());

  /**
   * Converte string de moeda local (ex: 1.000,50) para número real (ex: 1000.50)
   */
  const parseLocalNumber = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  /**
   * Formata número em string de moeda com separadores locais
   */
  const formatCurrency = (value: number, type: Currency): string => {
    if (isNaN(value) || value === undefined) return '';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: type,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  /**
   * Quando estamos editando um aporte, preenche os valores iniciais
   */
  useEffect(() => {
    if (editingEntry) {
      const { amountInvested, btcAmount, exchangeRate, currency, origin, date } = editingEntry;

      setAmountInvested(formatNumber(amountInvested));
      setBtcAmount(
        displayUnit === 'SATS'
          ? formatNumber(btcAmount * 100000000, 0)
          : formatNumber(btcAmount, 8)
      );
      setExchangeRate(exchangeRate);
      setExchangeRateDisplay(formatNumber(exchangeRate));
      setCurrency(currency);
      setOrigin(origin || 'corretora');
      setDate(date);
    }
  }, [editingEntry, displayUnit]);

  /**
   * Atualiza o valor da moeda e ressincroniza cotação
   */
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);

    if (currentRate) {
      const newRate = newCurrency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(newRate);
      setExchangeRateDisplay(formatNumber(newRate));
    }
  };

  /**
   * Atualiza o valor da cotação manualmente
   */
  const handleExchangeRateChange = (displayValue: string) => {
    setExchangeRateDisplay(displayValue);
    const parsed = parseLocalNumber(displayValue);
    if (!isNaN(parsed)) {
      setExchangeRate(parsed);
    }
  };

  /**
   * Calcula manualmente o valor em BTC ou SATS com base no valor investido
   * Esta função agora só é chamada quando o usuário clica no botão de calcular,
   * e não mais automaticamente quando o valor investido é alterado
   */
  const calculateFromAmount = () => {
    const parsedAmount = parseLocalNumber(amountInvested);
    if (isNaN(parsedAmount) || exchangeRate <= 0) return;

    const btc = parsedAmount / exchangeRate;

    setBtcAmount(
      displayUnit === 'SATS'
        ? formatNumber(btc * 100000000, 0)
        : formatNumber(btc, 8)
    );
  };

  /**
   * Calcula manualmente o valor em BRL/USD com base na quantidade de BTC/SATS
   * Esta função agora só é chamada quando o usuário clica no botão de calcular,
   * e não mais automaticamente quando a quantidade de BTC/SATS é alterada
   */
  const calculateFromBtc = () => {
    const parsedBtc = parseLocalNumber(btcAmount);
    if (isNaN(parsedBtc) || exchangeRate <= 0) return;

    const btc = displayUnit === 'SATS' ? parsedBtc / 100000000 : parsedBtc;
    const invested = btc * exchangeRate;

    setAmountInvested(formatNumber(invested));
  };

  /**
   * Restaura todos os campos para o estado inicial
   */
  const reset = useCallback(() => {
    setAmountInvested('');
    setBtcAmount('');
    setExchangeRate(0);
    setExchangeRateDisplay('');
    setCurrency('BRL');
    setOrigin('corretora');
    setDate(new Date());
  }, []);

  return {
    amountInvested,
    setAmountInvested,
    btcAmount,
    setBtcAmount,
    exchangeRate,
    exchangeRateDisplay,
    setExchangeRateDisplay,
    setExchangeRate,
    currency,
    origin,
    date,
    setDate,
    parseLocalNumber,
    handleCurrencyChange,
    handleExchangeRateChange,
    calculateFromAmount,
    calculateFromBtc,
    handleOriginChange: setOrigin,
    reset
  };
};
