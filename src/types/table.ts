
/**
 * Tipos relacionados à funcionalidade da tabela de aportes
 */

// Colunas disponíveis para ordenação
export type SortableColumn = 
  | 'date'
  | 'amountInvested'
  | 'btcAmount'
  | 'exchangeRate'
  | 'percentChange'
  | 'currentValue';

// Direção da ordenação
export type SortDirection = 'asc' | 'desc';

// Estado de ordenação
export interface SortState {
  column: SortableColumn | null;
  direction: SortDirection;
}

// Definição das colunas disponíveis
export interface ColumnConfig {
  id: SortableColumn;
  label: string;
  visible: boolean;
}

// Configuração padrão de colunas
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'date', label: 'Data', visible: true },
  { id: 'amountInvested', label: 'Valor Investido', visible: true },
  { id: 'btcAmount', label: 'Bitcoin/Satoshis', visible: true },
  { id: 'exchangeRate', label: 'Cotação', visible: true },
  { id: 'percentChange', label: 'Variação', visible: true },
  { id: 'currentValue', label: 'Valor Atual', visible: true }
];

