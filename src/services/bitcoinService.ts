
import { BitcoinEntry, CurrentRate } from "@/types";

/**
 * Funções para buscar a cotação atual
 * Responsável por fazer a requisição à API do CoinGecko e retornar os dados formatados
 */
export const fetchCurrentBitcoinRate = async (): Promise<CurrentRate> => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_last_updated_at=true"
    );
    const data = await response.json();
    
    return {
      usd: data.bitcoin.usd,
      brl: data.bitcoin.brl,
      timestamp: new Date(data.bitcoin.last_updated_at * 1000)
    };
  } catch (error) {
    console.error("Error fetching Bitcoin rates:", error);
    // Retorna valores padrão em caso de erro
    return {
      usd: 0,
      brl: 0,
      timestamp: new Date()
    };
  }
};

/**
 * Calcula o total de Bitcoin em todos os aportes
 * @param entries Lista de aportes
 * @returns Soma total de Bitcoin
 */
export const calculateTotalBitcoin = (entries: BitcoinEntry[]): number => {
  return entries.reduce((total, entry) => total + entry.btcAmount, 0);
};

/**
 * Calcula o total investido em todos os aportes na moeda selecionada
 * @param entries Lista de aportes
 * @param selectedCurrency Moeda selecionada ('BRL' ou 'USD')
 * @param conversionRate Taxa de conversão entre BRL e USD
 * @returns Soma total do valor investido
 */
export const calculateTotalInvested = (
  entries: BitcoinEntry[],
  selectedCurrency: 'BRL' | 'USD',
  conversionRate: number
): number => {
  return entries.reduce((total, entry) => {
    // Se a moeda do aporte for diferente da selecionada, fazemos a conversão
    if (entry.currency !== selectedCurrency) {
      return total + (entry.currency === 'USD' 
        ? entry.amountInvested * (1 / conversionRate) 
        : entry.amountInvested * conversionRate);
    }
    return total + entry.amountInvested;
  }, 0);
};

/**
 * Calcula a variação percentual entre duas taxas
 * @param buyRate Taxa de compra
 * @param currentRate Taxa atual
 * @returns Percentual de variação
 */
export const calculatePercentageChange = (buyRate: number, currentRate: number): number => {
  return ((currentRate - buyRate) / buyRate) * 100;
};

/**
 * Calcula o preço médio de compra ponderado pelo valor investido
 * 
 * A fórmula aplicada é:
 * (cotacao₁ × valorInvestido₁ + cotacao₂ × valorInvestido₂ + ...) / (valorInvestido₁ + valorInvestido₂ + ...)
 * 
 * Esta média reflete o preço médio pago por 1 BTC considerando todos os aportes realizados no período.
 * 
 * @param entries Lista de aportes
 * @param period Período para filtrar os aportes ('month', 'year' ou 'all')
 * @returns Preço médio ponderado
 */
export const calculateAverageByPeriod = (
  entries: BitcoinEntry[],
  period: 'month' | 'year' | 'all'
): number => {
  if (entries.length === 0) return 0;

  const now = new Date();
  let filteredEntries = entries;

  if (period === 'month') {
    filteredEntries = entries.filter(
      (entry) => 
        entry.date.getMonth() === now.getMonth() && 
        entry.date.getFullYear() === now.getFullYear()
    );
  } else if (period === 'year') {
    filteredEntries = entries.filter(
      (entry) => entry.date.getFullYear() === now.getFullYear()
    );
  }

  if (filteredEntries.length === 0) return 0;

  // Calcula a média ponderada das cotações pelo valor investido
  let totalInvested = 0;
  let weightedExchangeRateSum = 0;

  filteredEntries.forEach(entry => {
    totalInvested += entry.amountInvested;
    // Multiplicamos a cotação pelo valor investido para o cálculo ponderado
    weightedExchangeRateSum += entry.exchangeRate * entry.amountInvested;
  });

  // Retorna a média ponderada
  return totalInvested > 0 ? weightedExchangeRateSum / totalInvested : 0;
};
