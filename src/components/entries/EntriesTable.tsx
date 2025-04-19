
/**
 * Componente que exibe os aportes em formato de tabela
 * com suporte a ordenação e visibilidade de colunas
 */
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Edit, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { BitcoinEntry } from '@/types';
import { ColumnConfig, SortState } from '@/types/table';

interface EntriesTableProps {
  entries: BitcoinEntry[];
  currencyView: 'BRL' | 'USD';
  currentRate: { usd: number; brl: number };
  displayUnit: 'BTC' | 'SATS';
  isMobile: boolean;
  handleEditClick: (id: string) => void;
  handleDeleteClick: (id: string) => void;
  totals: {
    totalInvested: number;
    totalBtc: number;
    avgPrice: number;
    percentChange: number;
    currentValue: number;
  };
  sortState?: SortState;
  onSort?: (column: string) => void;
  visibleColumns: ColumnConfig[];
}

export const EntriesTable: React.FC<EntriesTableProps> = ({
  entries,
  currencyView,
  currentRate,
  displayUnit,
  isMobile,
  handleEditClick,
  handleDeleteClick,
  totals,
  sortState,
  onSort,
  visibleColumns
}) => {
  /**
   * Verifica se uma coluna específica deve ser exibida na tabela
   * @param columnId ID da coluna para verificar
   * @returns true se a coluna deve ser exibida, false caso contrário
   */
  const isColumnVisible = (columnId: string) => {
    const column = visibleColumns.find(col => col.id === columnId);
    return column ? column.visible : true;
  };

  const formatBitcoinAmount = (amount: number) => {
    if (displayUnit === 'SATS') {
      const satoshis = amount * 100000000;
      return formatNumber(satoshis, 0);
    }
    return formatNumber(amount, 8);
  };

  /**
   * Exibe o ícone de ordenação para a coluna
   * @param columnId ID da coluna
   * @returns Componente com o ícone de ordenação
   */
  const renderSortIcon = (columnId: string) => {
    if (!sortState || !onSort) return null;
    
    if (sortState.column === columnId) {
      return sortState.direction === 'asc' 
        ? <ArrowUp className="h-4 w-4 ml-1" /> 
        : <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return null;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {isColumnVisible('date') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`}
              onClick={() => onSort && onSort('date')}
            >
              <div className="flex items-center">
                Data
                {renderSortIcon('date')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('amountInvested') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`}
              onClick={() => onSort && onSort('amountInvested')}
            >
              <div className="flex items-center">
                Valor Investido
                {renderSortIcon('amountInvested')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('btcAmount') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`}
              onClick={() => onSort && onSort('btcAmount')}
            >
              <div className="flex items-center">
                {displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}
                {renderSortIcon('btcAmount')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('exchangeRate') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`}
              onClick={() => onSort && onSort('exchangeRate')}
            >
              <div className="flex items-center">
                Cotação
                {renderSortIcon('exchangeRate')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('percentChange') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`}
              onClick={() => onSort && onSort('percentChange')}
            >
              <div className="flex items-center">
                Variação
                {renderSortIcon('percentChange')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('currentValue') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`}
              onClick={() => onSort && onSort('currentValue')}
            >
              <div className="flex items-center">
                Valor Atual
                {renderSortIcon('currentValue')}
              </div>
            </TableHead>
          )}
          
          <TableHead className={`text-right ${isMobile ? "text-xs" : ""}`}>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
          
          let entryRateInViewCurrency = entry.exchangeRate;
          if (entry.currency !== currencyView) {
            entryRateInViewCurrency = entry.currency === 'USD' 
              ? entry.exchangeRate * (currentRate.brl / currentRate.usd)
              : entry.exchangeRate / (currentRate.brl / currentRate.usd);
          }
          
          const percentChange = ((currentRateValue - entryRateInViewCurrency) / entryRateInViewCurrency) * 100;
          
          let investedValue = entry.amountInvested;
          if (entry.currency !== currencyView) {
            investedValue = entry.currency === 'USD'
              ? entry.amountInvested * (currentRate.brl / currentRate.usd)
              : entry.amountInvested / (currentRate.brl / currentRate.usd);
          }
          
          const currentValue = investedValue * (1 + percentChange / 100);
          
          return (
            <TableRow key={entry.id}>
              {isColumnVisible('date') && (
                <TableCell className={isMobile ? "text-xs py-2" : ""}>
                  {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                  {entry.origin === 'planilha' && (
                    <span className="ml-1 text-xs text-muted-foreground">(planilha)</span>
                  )}
                  {entry.registrationSource === 'planilha' && (
                    <span className="ml-1 text-xs text-yellow-600">●</span>
                  )}
                </TableCell>
              )}
              
              {isColumnVisible('amountInvested') && (
                <TableCell className={isMobile ? "text-xs py-2" : ""}>
                  {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(investedValue)}
                </TableCell>
              )}
              
              {isColumnVisible('btcAmount') && (
                <TableCell className={isMobile ? "text-xs py-2" : ""}>
                  {formatBitcoinAmount(entry.btcAmount)}
                </TableCell>
              )}
              
              {isColumnVisible('exchangeRate') && (
                <TableCell className={isMobile ? "text-xs py-2" : ""}>
                  {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(entryRateInViewCurrency)}
                </TableCell>
              )}
              
              {isColumnVisible('percentChange') && (
                <TableCell className={isMobile ? "text-xs py-2" : ""}>
                  <div className="flex items-center">
                    {percentChange > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                    )}
                    <span className={percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatNumber(percentChange)}%
                    </span>
                  </div>
                </TableCell>
              )}
              
              {isColumnVisible('currentValue') && (
                <TableCell className={isMobile ? "text-xs py-2" : ""}>
                  <div className={percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                    {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(currentValue)}
                    <div className="text-xs text-muted-foreground">
                      {percentChange > 0 ? '+' : ''}{formatNumber(currentValue - investedValue)}
                    </div>
                  </div>
                </TableCell>
              )}
              
              <TableCell className={`text-right ${isMobile ? "text-xs py-2" : ""}`}>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(entry.id)}
                    className="mr-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
        
        {/* Linha de totais */}
        <TableRow className="bg-gray-100/80 font-semibold border-t-2">
          {isColumnVisible('date') && (
            <TableCell className={isMobile ? "text-xs py-2" : ""}>
              TOTAIS
            </TableCell>
          )}
          
          {isColumnVisible('amountInvested') && (
            <TableCell className={isMobile ? "text-xs py-2" : ""}>
              {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.totalInvested)}
            </TableCell>
          )}
          
          {isColumnVisible('btcAmount') && (
            <TableCell className={isMobile ? "text-xs py-2" : ""}>
              {formatBitcoinAmount(totals.totalBtc)}
            </TableCell>
          )}
          
          {isColumnVisible('exchangeRate') && (
            <TableCell className={isMobile ? "text-xs py-2" : ""}>
              {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.avgPrice)}
            </TableCell>
          )}
          
          {isColumnVisible('percentChange') && (
            <TableCell className={isMobile ? "text-xs py-2" : ""}>
              <div className="flex items-center">
                {totals.percentChange > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                )}
                <span className={totals.percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                  {formatNumber(totals.percentChange)}%
                </span>
              </div>
            </TableCell>
          )}
          
          {isColumnVisible('currentValue') && (
            <TableCell className={isMobile ? "text-xs py-2" : ""}>
              <div className={totals.percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.currentValue)}
                <div className="text-xs text-muted-foreground">
                  {totals.percentChange > 0 ? '+' : ''}{formatNumber(totals.currentValue - totals.totalInvested)}
                </div>
              </div>
            </TableCell>
          )}
          
          {/* Célula de ações sempre visível */}
          <TableCell></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
