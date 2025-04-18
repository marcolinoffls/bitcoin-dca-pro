import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
  sortState: SortState;
  onSort: (column: string) => void;
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
  visibleColumns,
}) => {
  // Função para formatar valores em Bitcoin/Satoshis
  const formatBitcoinAmount = (amount: number) => {
    if (displayUnit === 'SATS') {
      const satoshis = amount * 100000000;
      return formatNumber(satoshis, 0);
    }
    return formatNumber(amount, 8);
  };

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (columnId: string) => {
    if (sortState.column !== columnId) return null;

    return sortState.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1 text-bitcoin" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-bitcoin" />
    );
  };

  // Função para verificar visibilidade da coluna
  const isColumnVisible = (columnId: string) => {
    return visibleColumns.find(col => col.id === columnId)?.visible ?? true;
  };

  // Função para converter valores entre moedas
  const convertCurrencyValue = (value: number, fromCurrency: 'BRL' | 'USD') => {
    if (fromCurrency === currencyView) return value;
    
    if (fromCurrency === 'USD' && currencyView === 'BRL') {
      return value * currentRate.brl / currentRate.usd;
    } else {
      return value * currentRate.usd / currentRate.brl;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {isColumnVisible('date') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} cursor-pointer`}
              onClick={() => onSort('date')}
            >
              <div className="flex items-center">
                Data
                {renderSortIcon('date')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('amountInvested') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} cursor-pointer`}
              onClick={() => onSort('amountInvested')}
            >
              <div className="flex items-center">
                Valor Investido
                {renderSortIcon('amountInvested')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('btcAmount') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} cursor-pointer`}
              onClick={() => onSort('btcAmount')}
            >
              <div className="flex items-center">
                {displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}
                {renderSortIcon('btcAmount')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('exchangeRate') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} cursor-pointer`}
              onClick={() => onSort('exchangeRate')}
            >
              <div className="flex items-center">
                Cotação
                {renderSortIcon('exchangeRate')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('percentChange') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} cursor-pointer`}
              onClick={() => onSort('percentChange')}
            >
              <div className="flex items-center">
                Variação
                {renderSortIcon('percentChange')}
              </div>
            </TableHead>
          )}
          
          {isColumnVisible('currentValue') && (
            <TableHead 
              className={`${isMobile ? "text-xs" : ""} cursor-pointer`}
              onClick={() => onSort('currentValue')}
            >
              <div className="flex items-center">
                Valor Atual
                {renderSortIcon('currentValue')}
              </div>
            </TableHead>
          )}
          
          <TableHead className={`text-right ${isMobile ? "text-xs" : ""}`}>
            Ações
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          // Conversão de valores para a moeda de visualização
          const investedValue = convertCurrencyValue(entry.amountInvested, entry.currency);
          const exchangeRateInViewCurrency = convertCurrencyValue(entry.exchangeRate, entry.currency);
          
          // Cálculos de variação e valor atual
          const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
          const percentChange = ((currentRateValue - exchangeRateInViewCurrency) / exchangeRateInViewCurrency) * 100;
          const currentValue = entry.btcAmount * currentRateValue;
          const profit = currentValue - investedValue;
          
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
                  {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(exchangeRateInViewCurrency)}
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
                  <div className={profit > 0 ? 'text-green-500' : 'text-red-500'}>
                    {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(currentValue)}
                    <div className="text-xs text-muted-foreground">
                      {profit > 0 ? '+' : ''}{formatNumber(profit)}
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
          <TableCell className={isMobile ? "text-xs py-2" : ""}>
            TOTAIS
          </TableCell>
          <TableCell className={isMobile ? "text-xs py-2" : ""}>
            {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.totalInvested)}
          </TableCell>
          <TableCell className={isMobile ? "text-xs py-2" : ""}>
            {formatBitcoinAmount(totals.totalBtc)}
          </TableCell>
          <TableCell className={isMobile ? "text-xs py-2" : ""}>
            {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.avgPrice)}
          </TableCell>
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
          <TableCell className={isMobile ? "text-xs py-2" : ""}>
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
  );
};