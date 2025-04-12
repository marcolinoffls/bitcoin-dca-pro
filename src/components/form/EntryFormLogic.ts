
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
 */

import { useCallback, useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';

type Currency = 'BRL' | 'USD';
type DisplayUnit = 'BTC' | 'SATS';

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
  origin?: 'corretora' | 'p2p';
}

export const useEntryFormLogic = (
  editingEntry?: EditingEntry,
  currentRate?: CurrentRate,
  displayUnit: DisplayUnit = 'BTC'
) => {
  // Estados principais do formulário
  const [amountInvested, setAmountInvested] = useState<string>('');     // valor em real/dólar
  const [btcAmount, setBtcAmount] = useState<string>('');               // valor em BTC ou SATS
  const [exchangeRate, setExchangeRate] = useState<number>(0);          // número puro
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState<string>(''); // string formatada
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [origin, setOrigin] = useState<'corretora' | 'p2p'>('corretora');
  const [date, setDate] = useState<Date>(new Date());

  /**
   * Converte string de moeda local (ex: 1.000,50) para número real (ex: 1000.50)
   */
  const parseLocalNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  /**
   * Formata número em string de moeda com separadores locais
   */
  const formatCurrency = (value: number, type: Currency): string => {
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
