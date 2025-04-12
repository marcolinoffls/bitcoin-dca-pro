
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatNumber } from '@/lib/utils';
import { Bitcoin, LogOut, ChartBar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import EntryEditForm from '@/components/EntryEditForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { DeleteEntry } from '@/components/DeleteEntry';

const Index = () => {
  const { user, signOut } = useAuth();
  const { 
    entries, 
    currentRate, 
    isLoading, 
    editingEntry, 
    addEntry, 
    editEntry, 
    cancelEdit, 
    deleteEntry 
  } = useBitcoinEntries();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleEditEntry = (id: string) => {
    editEntry(id);
    setIsDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    cancelEdit();
    setIsDialogOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    setSelectedEntryId(id);
  };

  const confirmDeleteEntry = () => {
    if (selectedEntryId) {
      deleteEntry(selectedEntryId);
      setSelectedEntryId(null);
    }
  };

  const cancelDeleteEntry = () => {
    setSelectedEntryId(null);
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Bitcoin className="h-7 w-7 text-bitcoin mr-2" />
          <span>Bitcoin DCA Pro</span>
        </h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={() => navigate('/statistics')}
            className="flex items-center gap-2 rounded-xl"
          >
            <ChartBar className="h-4 w-4" />
            <span>Estatísticas</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EntryForm
            onAddEntry={addEntry}
            currentRate={currentRate}
            editingEntry={editingEntry}
            onCancelEdit={cancelEdit}
          />
        </div>
        <div className="lg:col-span-1">
          <Table className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <TableCaption>Histórico de Aportes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Bitcoin</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-4">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center p-4">
                    Nenhum aporte registrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-right">
                      {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.currency === 'USD' ? '$' : 'R$'} {formatNumber(entry.amountInvested)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatNumber(entry.btcAmount, 8)} BTC
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditEntry(entry.id)}
                          className="rounded-full"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="rounded-full"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Total de Aportes: {entries.length}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Aporte</DialogTitle>
            <DialogDescription>
              Edite os detalhes do seu aporte de Bitcoin.
            </DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <EntryEditForm
              entry={editingEntry}
              currentRate={currentRate}
              onClose={handleCloseEditDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteEntry
        isOpen={selectedEntryId !== null}
        onConfirm={confirmDeleteEntry}
        onCancel={cancelDeleteEntry}
      />
    </div>
  );
};

export default Index;
