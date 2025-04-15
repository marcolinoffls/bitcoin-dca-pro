
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileUp, AlertCircle } from 'lucide-react';
import { importCSV } from '@/services/csvImportService';
import { useToast } from '@/hooks/use-toast';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal para importação de aportes via arquivo CSV
 */
const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validação do tipo de arquivo
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos .csv",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await importCSV(file);
      toast({
        title: "Sucesso!",
        description: "Aportes importados com sucesso",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro ao importar",
        description: error instanceof Error ? error.message : "Erro ao processar arquivo",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar aportes via CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV com seus aportes para importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileUp className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Arraste ou selecione seu arquivo CSV
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O arquivo deve conter as colunas: data, valor, bitcoin
                <br />
                Opcionais: cotacao, origem
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isLoading}
              className="relative"
              onClick={() => document.getElementById('csvFile')?.click()}
            >
              {isLoading ? 'Importando...' : 'Selecionar arquivo'}
            </Button>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex items-start gap-2 rounded-md bg-muted p-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Certifique-se que seu arquivo CSV:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Tem cabeçalhos nas colunas</li>
                <li>Usa vírgula (,) como separador</li>
                <li>Datas estão no formato YYYY-MM-DD</li>
                <li>Valores numéricos usam ponto (.) como separador decimal</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvModal;
