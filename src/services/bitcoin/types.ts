
/**
 * Tipos específicos para o serviço de Bitcoin
 */
import { BitcoinEntry, CurrentRate, PriceVariation } from '@/types';

// Períodos de tempo disponíveis para o gráfico
export type TimeRange = '1D' | '7D' | '1M' | '1Y' | 'ALL';

// Formato dos dados para o gráfico
export interface PriceHistoryPoint {
  time: string;
  price: number;
}
