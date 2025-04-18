
/**
 * Componente que agrupa os modais de edição e exclusão de aportes
 */
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EntryEditForm from '@/components/EntryEditForm';
import { BitcoinEntry, CurrentRate } from '@/types';

interface EntryModalsProps {
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedEntry: BitcoinEntry | null;
  currentRate: CurrentRate;
  displayUnit: 'BTC' | 'SATS';
  onEditClose: () => void;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
  setIsEditDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
}

const EntryModals: React.FC<EntryModalsProps> = ({
  isEditDialogOpen,
  isDeleteDialogOpen,
  selectedEntry,
  currentRate,
  displayUnit,
  onEditClose,
  onDeleteClose,
  onDeleteConfirm,
  setIsEditDialogOpen,
  setIsDeleteDialogOpen,
}) => {
  return (
    <>
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          onEditClose();
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
              onClose={onEditClose}
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
              onClick={onDeleteClose}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={onDeleteConfirm}
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

export default EntryModals;
