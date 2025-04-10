
import React from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculatePercentageChange } from '@/services/bitcoinService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Trash2 } from 'lucide-react';

interface EntriesListProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  onDelete: (id: string) => void;
  selectedCurrency: 'BRL' | 'USD';
}

const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  currentRate,
  onDelete,
  selectedCurrency,
}) => {
  if (entries.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Aportes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            Você ainda não registrou nenhum aporte de Bitcoin.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ordenar os aportes por data (mais recente primeiro)
  const sortedEntries = [...entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Aportes Registrados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor Investido</TableHead>
                <TableHead>Bitcoin</TableHead>
                <TableHead>Cotação</TableHead>
                <TableHead>Variação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map((entry) => {
                const currentRateValue = selectedCurrency === 'USD' ? currentRate.usd : currentRate.brl;
                const entryRateInSelectedCurrency = 
                  entry.currency === selectedCurrency 
                    ? entry.exchangeRate
                    : entry.currency === 'USD'
                      ? entry.exchangeRate * (currentRate.brl / currentRate.usd)
                      : entry.exchangeRate / (currentRate.brl / currentRate.usd);
                
                const percentChange = calculatePercentageChange(
                  entryRateInSelectedCurrency,
                  currentRateValue
                );
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {entry.currency === 'USD' ? '$' : 'R$'} {entry.amountInvested.toFixed(2)}
                    </TableCell>
                    <TableCell>{entry.btcAmount.toFixed(8)}</TableCell>
                    <TableCell>
                      {entry.currency === 'USD' ? '$' : 'R$'} {entry.exchangeRate.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {percentChange > 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                        )}
                        <span
                          className={
                            percentChange > 0 ? 'text-green-500' : 'text-red-500'
                          }
                        >
                          {percentChange.toFixed(2)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntriesList;
