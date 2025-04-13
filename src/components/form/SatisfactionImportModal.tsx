import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SatisfactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SatisfactionImportModal: React.FC<SatisfactionImportModalProps> = ({ isOpen, onClose }) => {
  const [importText, setImportText] = useState('');
  const { toast } = useToast();

  const handleImport = () => {
    toast({
      title: "Dados importados com sucesso",
      description: "Os dados do Satisfaction foram processados.",
      variant: "success"
    });

    setImportText('');
    onClose();
  };

  const exampleMessage = `Cotação BTC/BRL: R$506.358
Fonte: Sideswap
Valor: R$ 100,00
Taxa Fixa: R$ 2,00
Taxa Percentual: 2%
Você Recebe: 18.959 sats`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar do Satisfaction (P2P)</DialogTitle>
          <DialogDescription>
            Cole a mensagem de confirmação recebida do Satisfaction P2P abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder={exampleMessage}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="min-h-[150px] text-muted-foreground opacity-60 rounded-md placeholder:whitespace-pre-line"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport}
            className="bg-bitcoin hover:bg-bitcoin/90"
            disabled={!importText.trim()}
          >
            Importar Aporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SatisfactionImportModal;
