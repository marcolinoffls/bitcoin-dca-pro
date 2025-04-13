
/**
 * Componente: SatisfactionImportModal
 * 
 * Função: Modal para importação de dados de transações do Satisfaction P2P
 * - Exibe uma área de texto para colar os dados da transação P2P
 * - Tem um botão para processar a importação (ainda sem lógica)
 * 
 * Uso: Chamado pelo EntryForm quando o usuário clica em "Importar do Satisfaction (P2P)"
 */
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
    // Aqui futuramente será implementada a lógica para extrair os dados da mensagem
    // e preencher o formulário de aporte

    // Por enquanto, apenas exibe um toast de sucesso
    toast({
      title: "Dados importados com sucesso",
      description: "Os dados do Satisfaction foram processados.",
      variant: "success"
    });

    // Limpar o campo e fechar o modal
    setImportText('');
    onClose();
  };

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
            placeholder="Expira em: 13/04/25 às 09:02:57&#10;Cotação BTC/BRL: R$506.358 | Fonte: Sideswap&#10;Valor: R$ 100,00&#10;Taxa Fixa: R$ 2,00&#10;Taxa Percentual: 2%&#10;Você Recebe: 18.959 sats"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="min-h-[150px]"
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
