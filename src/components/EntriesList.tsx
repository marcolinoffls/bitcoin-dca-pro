
import React, { useState } from 'react';
import { Pen, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from '@/hooks/use-mobile';
import EntryEditForm from '@/components/EntryEditForm';
import { BitcoinEntry, CurrentRate } from '@/types';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface EntriesListProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit?: 'BTC' | 'SATS';
}

const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  currentRate,
  onDelete,
  onEdit,
  selectedCurrency,
  displayUnit = 'BTC'
}) => {
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<BitcoinEntry | null>(null);
  const isMobile = useIsMobile();

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
        <h3 className="text-lg font-medium">Sem registros</h3>
        <p className="mt-2 text-muted-foreground">
          Você ainda não registrou nenhum aporte de Bitcoin.
        </p>
      </div>
    );
  }

  const handleEditClick = (entry: BitcoinEntry) => {
    setEntryToEdit(entry);
    setIsEditSheetOpen(true);
    onEdit(entry.id);
  };

  const closeEditSheet = () => {
    setIsEditSheetOpen(false);
    setEntryToEdit(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <Table>
        <TableCaption>Lista de aportes de Bitcoin</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</TableHead>
            <TableHead className="text-right">Cotação</TableHead>
            <TableHead className="text-right">Variação</TableHead>
            <TableHead className="text-right">Valor atual</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            // Determine rate for current currency
            const rateNow = selectedCurrency === 'USD' ? currentRate.usd : currentRate.brl;
            // Convert if needed for cross-currency calculations
            const entryRateInSelectedCurrency = 
              entry.currency === selectedCurrency 
                ? entry.exchangeRate 
                : entry.currency === 'USD' 
                  ? entry.exchangeRate * currentRate.brl / currentRate.usd 
                  : entry.exchangeRate * currentRate.usd / currentRate.brl;
                  
            // Calculate variation percentage
            const variationPercent = ((rateNow / entryRateInSelectedCurrency) - 1) * 100;
            
            // Calculate current value
            const currentValue = entry.btcAmount * rateNow;

            return (
              <TableRow key={entry.id}>
                <TableCell>
                  {new Date(entry.date).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(entry.amountInvested, entry.currency)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {displayUnit === 'SATS' 
                    ? formatNumber(entry.btcAmount * 100000000, 0)
                    : formatNumber(entry.btcAmount, 8)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(entry.exchangeRate, entry.currency)}
                </TableCell>
                <TableCell className={`text-right ${variationPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {variationPercent >= 0 ? '+' : ''}{formatNumber(variationPercent, 2)}%
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(currentValue, selectedCurrency)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditClick(entry)}
                      className="h-8 w-8"
                    >
                      <Pen className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <AlertDialog open={isDeleteDialogOpen && entryToDelete === entry.id} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEntryToDelete(entry.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setEntryToDelete(null)}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              if (entryToDelete) {
                                onDelete(entryToDelete);
                                setEntryToDelete(null);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Edit Entry Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={(open) => !open && closeEditSheet()}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <div className="px-1 py-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Pen className="h-5 w-5" /> Editar Aporte
            </h2>
            {entryToEdit ? (
              <EntryEditForm 
                entry={entryToEdit} 
                currentRate={currentRate} 
                onClose={closeEditSheet}
                displayUnit={displayUnit}
              />
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EntriesList;
