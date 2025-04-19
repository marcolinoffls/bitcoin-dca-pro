
export interface CurrentRate {
  usd: number;
  brl: number;
  timestamp: Date;
}

export type Origin = "planilha" | "corretora" | "p2p" | "exchange";

export interface BitcoinEntry {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: "BRL" | "USD";
  origin?: Origin;
  registrationSource?: "manual" | "planilha";
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

// Interface para mapear com as colunas da tabela de aportes no Supabase
export interface AporteDB {
  id?: string;
  user_id: string;
  data_aporte: string;
  valor_investido: number;
  bitcoin: number;
  cotacao: number;
  moeda: 'BRL' | 'USD';
  cotacao_moeda: 'BRL' | 'USD';
  origem_aporte: Origin;
  origem_registro: "manual" | "planilha";
  created_at?: string;
}

// Interface para dados importados de CSV
export interface CsvAporte {
  date: string;
  amount: number;
  btc: number;
  rate: number;
  origin: Origin;
}
