
/**
 * Serviço para cálculos relacionados ao Bitcoin
 * 
 * Este módulo contém funções para calcular:
 * - Total de Bitcoin acumulado
 * - Valor total investido
 * - Variação percentual
 * - Preço médio por período
 * 
 * É usado principalmente nos componentes:
 * - StatisticsCards 
 * - AveragePriceCard
 */
import { BitcoinEntry } from "@/types";

/**
 * Calcula o total de Bitcoin acumulado em todos os aportes
 * 
 * @param entries Lista de aportes
 * @returns Quantidade total de Bitcoin
 */
export const calculateTotalBitcoin = (entries: BitcoinEntry[]): number => {
  return entries.reduce((total, entry) => total + entry.btcAmount, 0);
};

/**
 * Calcula o total investido em todos os aportes na moeda selecionada
 * 
 * Faz conversão se necessário (por exemplo BRL para USD).
 * 
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
    // Se a moeda do aporte for diferente da moeda selecionada, realiza conversão
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
 * 
 * Fórmula aplicada:
 * (taxaAtual - taxaCompra) / taxaCompra × 100
 * 
 * Indica se o preço subiu ou caiu desde a compra.
 * 
 * @param buyRate Valor de compra
 * @param currentRate Valor atual
 * @returns Percentual de variação (positivo ou negativo)
 */
export const calculatePercentageChange = (buyRate: number, currentRate: number): number => {
  return ((currentRate - buyRate) / buyRate) * 100;
};

/**
 * Filtra os aportes para excluir entradas do tipo "ajuste"
 * 
 * Os ajustes não devem ser considerados no cálculo do preço médio
 * 
 * @param entries Lista completa de aportes
 * @returns Lista filtrada sem os ajustes
 */
const filterOutAdjustments = (entries: BitcoinEntry[]): BitcoinEntry[] => {
  return entries.filter(entry => entry.origin !== 'ajuste');
};

/**
 * Calcula o preço médio ponderado de compra por valor investido
 * IMPORTANTE: Esta função agora exclui os aportes do tipo "ajuste" no cálculo
 * 
 * Fórmula aplicada:
 * (cotacao₁ × valorInvestido₁ + cotacao₂ × valorInvestido₂ + ...) / (valorInvestido₁ + valorInvestido₂ + ...)
 * 
 * @param entries Lista de aportes
 * @param period Período de filtro ('month', 'year' ou 'all')
 * @returns Preço médio ponderado
 */
export const calculateAverageByPeriod = (
  entries: BitcoinEntry[],
  period: 'month' | 'year' | 'all'
): number => {
  if (entries.length === 0) return 0;

  // Filtragem inicial por período
  const now = new Date();
  let periodFilteredEntries = entries;

  if (period === 'month') {
    periodFilteredEntries = entries.filter(
      (entry) => entry.date.getMonth() === now.getMonth() && entry.date.getFullYear() === now.getFullYear()
    );
  } else if (period === 'year') {
    periodFilteredEntries = entries.filter(
      (entry) => entry.date.getFullYear() === now.getFullYear()
    );
  }

  // Filtra para excluir "ajustes" do cálculo do preço médio
  const filteredEntries = filterOutAdjustments(periodFilteredEntries);

  if (filteredEntries.length === 0) return 0;

  let totalInvested = 0;
  let weightedExchangeRateSum = 0;

  filteredEntries.forEach(entry => {
    totalInvested += entry.amountInvested;
    weightedExchangeRateSum += entry.exchangeRate * entry.amountInvested;
  });

  return totalInvested > 0 ? weightedExchangeRateSum / totalInvested : 0;
};
