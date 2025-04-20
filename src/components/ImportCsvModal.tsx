
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileUp, AlertCircle, Shield } from 'lucide-react';
import { importCSV, sendSecureCSVToWebhook } from '@/services/csvImportService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateCsvFile } from '@/config/security';
import { Progress } from '@/components/ui/progress';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal para importação de aportes via arquivo CSV com opção de envio seguro para webhook
 */
const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'local' | 'webhook'>('local');
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Função para simular o progresso do upload
  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 100);
    return interval;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Validação do arquivo
    const validation = validateCsvFile(file);
    if (!validation.isValid) {
      toast({
        title: "Arquivo inválido",
        description: validation.errorMessage,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular progresso de upload
      const progressInterval = simulateProgress();

      if (uploadMode === 'local') {
        // Importação local para o Supabase
        const result = await importCSV(file);
        toast({
          title: "Sucesso!",
          description: result.message || "Aportes importados com sucesso",
        });
      } else if (uploadMode === 'webhook' && user) {
        // Envio seguro para webhook externo
        const result = await sendSecureCSVToWebhook(
          file, 
          user.id,
          user.email || 'email-nao-disponivel'
        );
        toast({
          title: "Envio seguro concluído!",
          description: result.message || "Seu arquivo foi enviado de forma segura para processamento externo.",
        });
      }
      
      // Limpa o intervalo do progresso simulado
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro detalhado:', error);
      toast({
        title: "Erro ao processar",
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
          {/* Seletor de modo de upload */}
          <div className="flex space-x-2 rounded-lg border p-2">
            <p className="text-sm">
              <a 
                href="https://docs.google.com/spreadsheets/d/1RAn8MWD7ckz_-c0pjRB36GWtDk_yHcY1vOOXP-sr29o/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-bitcoin text-center hover:text-bitcoin/90 underline"
              >
              Clique aqui para acessar uma planilha de exemplo
              </a>
            </p>            
          </div>

          {/* Descrição do modo selecionado */}
          <div className="text-center px-1 text-sm text-muted-foreground">
            {uploadMode === 'local' ? (
              "Os dados serão importados diretamente para sua conta."
            ) : (
              "O arquivo será enviado de forma segura para processamento externo via webhook."
            )}
          </div>

          {/* Área de drop do arquivo */}
          <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {uploadMode === 'local' ? (
                <FileUp className="h-6 w-6" />
              ) : (
                <Shield className="h-6 w-6" />
              )}
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
              variant="default"  // Usando "default"
              disabled={isLoading}
              className="relative bg-bitcoin hover:bg-bitcoin/90 text-white"
              onClick={() => document.getElementById('csvFile')?.click()}
            >
              {isLoading ? 'Processando...' : 'Selecionar arquivo'}
            </Button>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Barra de progresso */}
          {isLoading && (
            <div className="w-full space-y-2">
              <Progress value={uploadProgress} className="h-2 bg-muted" indicatorClassName="bg-bitcoin"/>
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress < 100 ? 'Processando arquivo...' : 'Concluído!'}
              </p>
            </div>
          )}

          {/* Informações de segurança */}
          <div className="flex items-start gap-2 rounded-md bg-muted p-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Informações de segurança:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Tamanho máximo: 5MB</li>
                <li>Apenas arquivos CSV são permitidos</li>
                <li>Os dados são validados e sanitizados</li>
                {uploadMode === 'webhook' && (
                  <>
                    <li>A transmissão é protegida com assinatura digital</li>
                    <li>Seus dados são enviados com segurança via HTTPS</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvModal;
