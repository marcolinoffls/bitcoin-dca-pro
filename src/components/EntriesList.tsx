import React, { useState } from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculatePercentageChange } from '@/services/bitcoinService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Trash2, Edit, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import EntryEditForm from '@/components/EntryEditForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [viewCurrency, setViewCurrency] = useState<'BRL' | 'USD'>(selectedCurrency);
  const isMobile = useIsMobile();

  const handleEditClick = (id: string) => {
    setSelectedEntryId(id);
    onEdit(id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedEntryId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedEntryId) {
      onDelete(selectedEntryId);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    onEdit('');
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

  const sortedEntries = [...entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const selectedEntry = selectedEntryId 
    ? entries.find(entry => entry.id === selectedEntryId) 
    : null;

  const formatBitcoinAmount = (amount: number) => {
    if (displayUnit === 'SATS') {
      const satoshis = amount * 100000000;
      return formatNumber(satoshis, 0);
    }
    return formatNumber(amount, 8);
  };

  const renderEntriesTable = (currencyView: 'BRL' | 'USD') => {
    return (
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
              const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
              
              let entryRateInViewCurrency = entry.exchangeRate;
              
              if (entry.currency !== currencyView) {
                entryRateInViewCurrency = entry.currency === 'USD' 
                  ? entry.exchangeRate * (currentRate.brl / currentRate.usd) // USD to BRL
                  : entry.exchangeRate / (currentRate.brl / currentRate.usd); // BRL to USD
              }
              
              const percentChange = calculatePercentageChange(
                entryRateInViewCurrency,
                currentRateValue
              );
              
              let investedValue = entry.amountInvested;
              if (entry.currency !== currencyView) {
                investedValue = entry.currency === 'USD'
                  ? entry.amountInvested * (currentRate.brl / currentRate.usd) // USD to BRL
                  : entry.amountInvested / (currentRate.brl / currentRate.usd); // BRL to USD
              }
              
              const currentValue = investedValue * (1 + percentChange / 100);
              
              return (
                <TableRow key={entry.id}>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
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
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Aportes Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="brl" className="w-full" onValueChange={(value) => setViewCurrency(value as 'BRL' | 'USD')}>
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="brl">Exibir em BRL (R$)</TabsTrigger>
              <TabsTrigger value="usd">Exibir em USD ($)</TabsTrigger>
            </TabsList>
            <TabsContent value="brl">
              {renderEntriesTable('BRL')}
            </TabsContent>
            <TabsContent value="usd">
              {renderEntriesTable('USD')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          handleEditClose();
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl px-6">
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
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este aporte? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="flex-1 bg-bitcoin hover:bg-bitcoin/90 text-white rounded-xl"
            >
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EntriesList;
