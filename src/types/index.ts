
/**
 * Interface para cotação atual do Bitcoin
 */
export interface CurrentRate {
  usd: number;
  brl: number;
  timestamp: Date;
}

/**
 * Tipos de origem permitidos para os aportes
 * - "corretora": Compra realizada em exchange centralizada
 * - "p2p": Compra peer-to-peer
 * - "planilha": Aportes importados de planilhas
 * - "ajuste": Ajustes de saldo (saques, taxas, etc)
 */
export type Origin = "corretora" | "p2p" | "planilha" | "ajuste";

/**
 * Interface principal para os registros de aportes no aplicativo
 */
export interface BitcoinEntry {
  id: string;
  date: Date;
  amountInvested: number;       // Valor investido na moeda original (BRL ou USD)
  btcAmount: number;            // Quantidade de Bitcoin
  exchangeRate: number;         // Cotação na moeda original
  currency: "BRL" | "USD";
  origin: Origin;
  registrationSource: "manual" | "planilha";
  valorUsd?: number;           // Valor em USD calculado no momento do registro
  cotacaoUsdBrl?: number;      // Cotação USD/BRL usada na conversão
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

/**
 * Interface para mapear com as colunas da tabela de aportes no Supabase
 * Usada para garantir tipagem correta durante operações com o banco de dados
 */
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
  valor_usd?: number | null;
  cotacao_usd_brl?: number | null;
}

/**
 * Interface para dados de importação CSV
 * Representa o formato intermediário dos dados antes de serem salvos no Supabase
 */
export interface CsvAporte {
  date: string;       // Data no formato string (será convertida)
  amount: number;     // Valor investido
  btc: number;        // Quantidade de Bitcoin
  rate: number;       // Cotação
  origin: Origin;     // Origem do aporte
}

/**
 * Interface para mapeamento dos dados de importação CSV para o BitcoinEntry
 * Usada durante a conversão de dados importados para o formato final
 */
export interface ImportedEntry {
  date: string;                   // Data no formato string
  amount: number;                 // Valor investido
  btc: number;                    // Quantidade de Bitcoin
  price: number;                  // Cotação
  origin: Origin;                 // Origem do aporte
  registrationSource: "planilha"; // Sempre "planilha" para importações
}
