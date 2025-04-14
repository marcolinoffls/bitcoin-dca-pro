export interface BitcoinEntry {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: 'BRL' | 'USD';
  origin: Origin;
  registrationSource?: RegistrationSource;
}

export interface CurrentRate {
  usd: number;
  brl: number;
  timestamp: Date;
}

/**
 * Interface para representar a variação de preço do Bitcoin em diferentes períodos
 */
export interface PriceVariation {
  day: number;       // Variação nas últimas 24 horas
  week: number;      // Variação nos últimos 7 dias
  month: number;     // Variação nos últimos 30 dias
  year: number;      // Variação no ano atual
  timestamp: Date;   // Data/hora da última atualização
}

// Definição dos tipos de origem de aporte
export type Origin = "corretora" | "p2p";
export type RegistrationSource = "manual" | "planilha";
