
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
 * - Adicionado suporte a cotação opcional, com cálculo automático
 * - Corrigido tratamento da cotação como campo opcional
 * - Melhorada validação do formulário para suportar cotação opcional
 * - Corrigida definição de Origin para incluir valor "ajuste"
 */

import { useCallback, useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { Origin } from '@/types'; // Importação correta do tipo Origin

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
  exchangeRate?: number; // Agora é opcional
  currency: Currency;
  origin?: Origin;
}

export const useEntryFormLogic = (
  editingEntry?: EditingEntry,
  currentRate?: CurrentRate,
  displayUnit: DisplayUnit = 'BTC'
) => {
  // Estados principais do formulário - display strings para UI e valores numéricos para cálculos
  const [amountInvested, setAmountInvested] = useState<string>('');     // valor em real/dólar como string formatada
  const [btcAmount, setBtcAmount] = useState<string>('');               // valor em BTC ou SATS como string formatada
  const [exchangeRate, setExchangeRate] = useState<number | undefined>(undefined); // Agora pode ser undefined para indicar não preenchido
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState<string>(''); // string formatada para exibição
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [origin, setOrigin] = useState<Origin>('corretora');
  const [date, setDate] = useState<Date>(new Date());
  const [isExchangeRateCalculated, setIsExchangeRateCalculated] = useState<boolean>(false);

  /**
   * Converte string de moeda local (ex: 1.000,50) para número real (ex: 1000.50)
   */
  const parseLocalNumber = (value: string): number => {
    if (!value) return 0;
    
    // Remove espaços e caracteres não numéricos, exceto ponto e vírgula
    const cleanValue = value.trim().replace(/[^\d.,]/g, '');
    
    // Se não tem vírgula nem ponto, é um número inteiro
    if (!cleanValue.includes(',') && !cleanValue.includes('.')) {
      return parseInt(cleanValue, 10);
    }
    
    // Converte para o formato com ponto decimal
    return parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
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
      
      // Se exchangeRate for undefined, deixamos os campos vazios
      if (exchangeRate !== undefined) {
        setExchangeRate(exchangeRate);
        setExchangeRateDisplay(formatNumber(exchangeRate));
        setIsExchangeRateCalculated(false);
      } else {
        setExchangeRate(undefined);
        setExchangeRateDisplay('');
        setIsExchangeRateCalculated(true);
      }
      
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
      setIsExchangeRateCalculated(false);
    }
  };

  /**
   * Atualiza o valor da cotação manualmente
   */
  const handleExchangeRateChange = (displayValue: string) => {
    setExchangeRateDisplay(displayValue);
    
    // Se o valor estiver vazio, define a cotação como undefined para indicar que é opcional
    if (!displayValue.trim()) {
      setExchangeRate(undefined);
      setIsExchangeRateCalculated(false);
      return;
    }
    
    const parsed = parseLocalNumber(displayValue);
    if (!isNaN(parsed)) {
      setExchangeRate(parsed);
      setIsExchangeRateCalculated(false);
    }
  };

  /**
   * Calcula manualmente o valor em BTC ou SATS com base no valor investido
   * Esta função agora só é chamada quando o usuário clica no botão de calcular,
   * e não mais automaticamente quando o valor investido é alterado
   */
  const calculateFromAmount = () => {
    const parsedAmount = parseLocalNumber(amountInvested);
    if (isNaN(parsedAmount) || !exchangeRate || exchangeRate <= 0) return;

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
    if (isNaN(parsedBtc) || !exchangeRate || exchangeRate <= 0) return;

    const btc = displayUnit === 'SATS' ? parsedBtc / 100000000 : parsedBtc;
    const invested = btc * exchangeRate;

    setAmountInvested(formatNumber(invested));
  };

  /**
   * Calcula automaticamente a cotação baseada no valor investido e na quantidade de BTC
   * Retorna true se o cálculo foi bem-sucedido, false caso contrário
   */
  const calculateExchangeRate = (): boolean => {
    const parsedAmount = parseLocalNumber(amountInvested);
    const parsedBtc = parseLocalNumber(btcAmount);
    
    // Verificações de segurança
    if (isNaN(parsedAmount) || parsedAmount <= 0) return false;
    
    // Converte SATS para BTC se necessário
    const btc = displayUnit === 'SATS' ? parsedBtc / 100000000 : parsedBtc;
    
    // Evita divisão por zero
    if (isNaN(btc) || btc <= 0) return false;
    
    const calculatedRate = parsedAmount / btc;
    
    // Atualiza os estados
    setExchangeRate(calculatedRate);
    setExchangeRateDisplay(formatNumber(calculatedRate));
    setIsExchangeRateCalculated(true);
    
    return true;
  };

  /**
   * Valida o formulário, verificando se os campos obrigatórios estão preenchidos
   * e se os valores são válidos
   * @returns null se não houver erros, ou uma mensagem de erro
   */
  const validateForm = (): string | null => {
    const parsedAmount = parseLocalNumber(amountInvested);
    const parsedBtc = parseLocalNumber(btcAmount);
    
    // Campos obrigatórios
    if (!amountInvested.trim()) {
      return 'O valor investido é obrigatório';
    }
    
    if (!btcAmount.trim()) {
      return 'A quantidade de Bitcoin é obrigatória';
    }
    
    // Validações numéricas
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return 'O valor investido deve ser um número positivo';
    }
    
    if (isNaN(parsedBtc) || parsedBtc <= 0) {
      return 'A quantidade de Bitcoin deve ser um número positivo';
    }
    
    // Se a cotação foi fornecida, valida
    // Mas se não foi fornecida, deixamos passar (é opcional)
    if (exchangeRateDisplay.trim()) {
      const parsedRate = parseLocalNumber(exchangeRateDisplay);
      if (isNaN(parsedRate) || parsedRate <= 0) {
        return 'A cotação deve ser um número positivo';
      }
    }
    
    return null;
  };

  /**
   * Restaura todos os campos para o estado inicial
   */
  const reset = useCallback(() => {
    setAmountInvested('');
    setBtcAmount('');
    setExchangeRate(undefined); // Agora iniciamos com undefined para indicar campo opcional
    setExchangeRateDisplay('');
    setCurrency('BRL');
    setOrigin('corretora');
    setDate(new Date());
    setIsExchangeRateCalculated(false);
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
    calculateExchangeRate,
    validateForm,
    isExchangeRateCalculated,
    handleOriginChange: setOrigin,
    reset
  };
};
