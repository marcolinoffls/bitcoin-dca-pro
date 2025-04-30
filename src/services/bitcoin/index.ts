
/**
 * Ponto de entrada principal para os serviços relacionados ao Bitcoin
 * 
 * Este arquivo exporta todas as funções dos diferentes módulos
 * para simplificar a importação em outros componentes.
 */

// Serviços de cotação atual
export {
  fetchCurrentBitcoinRate,
  fetchBitcoinPriceVariation
} from './currentRate';

// Serviços de histórico de preços
export {
  fetchBitcoinPriceHistory,
  type PriceHistoryPoint
} from './priceHistory';

// Serviços de cálculos
export {
  calculateTotalBitcoin,
  calculateTotalInvested,
  calculatePercentageChange,
  calculateAverageByPeriod
} from './calculations';
