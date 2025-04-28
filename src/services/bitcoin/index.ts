
/**
 * Arquivo principal que exporta todas as funcionalidades do serviço Bitcoin
 */
export { fetchCurrentBitcoinRate } from './currentRate';
export { fetchBitcoinPriceVariation } from './priceVariation';
export { fetchBitcoinPriceHistory } from './priceHistory';
export {
  calculateTotalBitcoin,
  calculateTotalInvested,
  calculatePercentageChange,
  calculateAverageByPeriod
} from './calculations';
export type { TimeRange, PriceHistoryPoint } from './types';

