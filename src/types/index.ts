
export interface BitcoinEntry {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: 'BRL' | 'USD';
  origin?: Origin;
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

// Ajustado para incluir 'exchange' como um tipo válido para compatibilidade com csvImportService
export type Origin = "corretora" | "p2p" | "planilha" | "exchange";
export type RegistrationSource = "manual" | "planilha";

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
  origem_registro: RegistrationSource;
  created_at?: string;
}
