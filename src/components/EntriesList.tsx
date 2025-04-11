
import React, { useState } from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculatePercentageChange } from '@/services/bitcoinService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Trash2, Edit } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import EntryEditForm from '@/components/EntryEditForm';
import { useIsMobile } from '@/hooks/use-mobile';

interface EntriesListProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
}

const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  currentRate,
  onDelete,
  onEdit,
  selectedCurrency,
  displayUnit,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const handleEditClick = (id: string) => {
    setSelectedEntryId(id);
    onEdit(id);
    setIsEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
  };

  if (entries.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Aportes Registrados</CardTitle>
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

  const selectedEntry = selectedEntryId 
    ? entries.find(entry => entry.id === selectedEntryId) 
    : null;

  const formatBitcoinAmount = (amount: number) => {
    if (displayUnit === 'SATS') {
      // Convert to satoshis (1 BTC = 100,000,000 satoshis)
      const satoshis = amount * 100000000;
      return formatNumber(satoshis, 0);
    }
    return formatNumber(amount, 8);
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Aportes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                  
                  // Calculate current value based on BTC amount and current rate
                  const currentValue = entry.btcAmount * currentRateValue;
                  const investedValue = 
                    entry.currency === selectedCurrency
                      ? entry.amountInvested 
                      : entry.currency === 'USD'
                        ? entry.amountInvested * (currentRate.brl / currentRate.usd)
                        : entry.amountInvested / (currentRate.brl / currentRate.usd);
                  
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className={isMobile ? "text-xs py-2" : ""}>
                        {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className={isMobile ? "text-xs py-2" : ""}>
                        {entry.currency === 'USD' ? '$' : 'R$'} {formatNumber(entry.amountInvested)}
                      </TableCell>
                      <TableCell className={isMobile ? "text-xs py-2" : ""}>
                        {formatBitcoinAmount(entry.btcAmount)}
                      </TableCell>
                      <TableCell className={isMobile ? "text-xs py-2" : ""}>
                        {entry.currency === 'USD' ? '$' : 'R$'} {formatNumber(entry.exchangeRate)}
                      </TableCell>
                      <TableCell className={isMobile ? "text-xs py-2" : ""}>
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
                            {formatNumber(percentChange)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={isMobile ? "text-xs py-2" : ""}>
                        <div className={percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                          {selectedCurrency === 'USD' ? '$' : 'R$'} {formatNumber(currentValue)}
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
                            onClick={() => onDelete(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aporte</DialogTitle>
            <DialogDescription>
              Modifique os dados do seu aporte e clique em atualizar para salvar.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <EntryEditForm
              entry={selectedEntry}
              currentRate={currentRate}
              onClose={handleEditClose}
              displayUnit={displayUnit}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EntriesList;
