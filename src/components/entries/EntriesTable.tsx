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
import { cn } from '@/lib/utils';

interface EntriesTableProps {
  entries: BitcoinEntry[];
  currencyView: 'BRL' | 'USD';
  currentRate: { usd: number; brl: number; timestamp: Date };
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
  // Verifica se uma coluna está visível
  const isColumnVisible = (columnId: string) => {
    const column = visibleColumns.find(col => col.id === columnId);
    return column?.visible ?? false;
  };

  // Formata o valor de bitcoin de acordo com a unidade selecionada (BTC ou SATS)
  const formatBitcoinAmount = (amount: number) => {
    if (displayUnit === 'SATS') {
      return formatNumber(amount * 100000000); // Converter para satoshis
    }
    return formatNumber(amount, 8); // BTC com 8 casas decimais
  };

  // Renderiza o ícone de ordenação
  const renderSortIcon = (column: string) => {
    if (sortState?.column !== column) return null;
    
    return sortState.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  /**
   * Retorna classes CSS para animação de colunas
   * @param columnId ID da coluna
   * @returns Classes CSS para animação
   */
  const getColumnClasses = (columnId: string) => {
    const isVisible = isColumnVisible(columnId);
    return cn(
      "transition-all duration-300 ease-in-out",
      {
        "opacity-100 max-w-[1000px]": isVisible,
        "opacity-0 max-w-0 overflow-hidden p-0 m-0": !isVisible
      }
    );
  };

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className={cn(
                `${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`,
                getColumnClasses('date')
              )}
              onClick={() => onSort && onSort('date')}
            >
              <div className="flex items-center">
                Data
                {renderSortIcon('date')}
              </div>
            </TableHead>
            
            <TableHead 
              className={cn(
                `${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`,
                getColumnClasses('amountInvested')
              )}
              onClick={() => onSort && onSort('amountInvested')}
            >
              <div className="flex items-center">
                Valor Investido
                {renderSortIcon('amountInvested')}
              </div>
            </TableHead>
            
            <TableHead 
              className={cn(
                `${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`,
                getColumnClasses('btcAmount')
              )}
              onClick={() => onSort && onSort('btcAmount')}
            >
              <div className="flex items-center">
                {displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}
                {renderSortIcon('btcAmount')}
              </div>
            </TableHead>
            
            <TableHead 
              className={cn(
                `${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`,
                getColumnClasses('exchangeRate')
              )}
              onClick={() => onSort && onSort('exchangeRate')}
            >
              <div className="flex items-center">
                Cotação
                {renderSortIcon('exchangeRate')}
              </div>
            </TableHead>
            
            <TableHead 
              className={cn(
                `${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`,
                getColumnClasses('percentChange')
              )}
              onClick={() => onSort && onSort('percentChange')}
            >
              <div className="flex items-center">
                Variação
                {renderSortIcon('percentChange')}
              </div>
            </TableHead>
            
            <TableHead 
              className={cn(
                `${isMobile ? "text-xs" : ""} ${onSort ? 'cursor-pointer' : ''}`,
                getColumnClasses('currentValue')
              )}
              onClick={() => onSort && onSort('currentValue')}
            >
              <div className="flex items-center">
                Valor Atual
                {renderSortIcon('currentValue')}
              </div>
            </TableHead>
            
            <TableHead className={`text-right ${isMobile ? "text-xs" : ""}`}>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            // Usar o valor apropriado baseado na moeda de visualização
            let investedValue = currencyView === 'USD' && entry.valorUsd 
              ? entry.valorUsd 
              : entry.amountInvested;
            
            // Usar a cotação apropriada baseada na moeda de visualização
            let entryRateInViewCurrency = currencyView === 'USD'
              ? (entry.valorUsd && entry.btcAmount) 
                ? entry.valorUsd / entry.btcAmount 
                : entry.exchangeRate
              : entry.exchangeRate;
            
            // Calcular a variação percentual usando a cotação atual
            const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
            const percentChange = ((currentRateValue - entryRateInViewCurrency) / entryRateInViewCurrency) * 100;
            
            // Calcular o valor atual
            const currentValue = entry.btcAmount * currentRateValue;
            
            return (
              <TableRow key={entry.id}>
                <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('date'))}>
                  {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                  {entry.registrationSource === 'planilha' && (
                    <span className="ml-1 text-xs text-yellow-600">●</span>
                  )}
                </TableCell>
                
                <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('amountInvested'))}>
                  {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(investedValue)}
                </TableCell>
                
                <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('btcAmount'))}>
                  {formatBitcoinAmount(entry.btcAmount)}
                </TableCell>
                
                <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('exchangeRate'))}>
                  {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(entryRateInViewCurrency)}
                </TableCell>
                
                <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('percentChange'))}>
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
                
                <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('currentValue'))}>
                  <div className={percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                    {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(currentValue)}
                    <div className="text-xs text-muted-foreground">
                      {percentChange > 0 ? '+' : ''}{formatNumber(currentValue - investedValue)}
                    </div>
                  </div>
                </TableCell>
                
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
            <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('date'))}>
              TOTAIS
            </TableCell>
            
            <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('amountInvested'))}>
              {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.totalInvested)}
            </TableCell>
            
            <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('btcAmount'))}>
              {formatBitcoinAmount(totals.totalBtc)}
            </TableCell>
            
            <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('exchangeRate'))}>
              {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.avgPrice)}
            </TableCell>
            
            <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('percentChange'))}>
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
            
            <TableCell className={cn(isMobile ? "text-xs py-2" : "", getColumnClasses('currentValue'))}>
              <div className={totals.percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.currentValue)}
                <div className="text-xs text-muted-foreground">
                  {totals.percentChange > 0 ? '+' : ''}{formatNumber(totals.currentValue - totals.totalInvested)}
                </div>
              </div>
            </TableCell>
            
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
