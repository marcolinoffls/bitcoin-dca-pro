
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { BitcoinEntry } from '@/types';

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
}

export const EntriesTable: React.FC<EntriesTableProps> = ({
  entries,
  currencyView,
  currentRate,
  displayUnit,
  isMobile,
  handleEditClick,
  handleDeleteClick,
  totals
}) => {
  const formatBitcoinAmount = (amount: number) => {
    if (displayUnit === 'SATS') {
      const satoshis = amount * 100000000;
      return formatNumber(satoshis, 0);
    }
    return formatNumber(amount, 8);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={isMobile ? "text-xs" : ""}>Data</TableHead>
          <TableHead className={isMobile ? "text-xs" : ""}>Valor Investido</TableHead>
          <TableHead className={isMobile ? "text-xs" : ""}>{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</TableHead>
          <TableHead className={isMobile ? "text-xs" : ""}>Cotação</TableHead>
          <TableHead className={isMobile ? "text-xs" : ""}>Variação</TableHead>
          <TableHead className={isMobile ? "text-xs" : ""}>Valor Atual</TableHead>
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
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                {entry.origin === 'planilha' && (
                  <span className="ml-1 text-xs text-muted-foreground">(planilha)</span>
                )}
                {entry.registrationSource === 'planilha' && (
                  <span className="ml-1 text-xs text-yellow-600">●</span>
                )}
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(investedValue)}
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                {formatBitcoinAmount(entry.btcAmount)}
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(entryRateInViewCurrency)}
              </TableCell>
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
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
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
