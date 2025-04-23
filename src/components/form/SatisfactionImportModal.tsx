
/**
 * Componente: SatisfactionImportModal
 * 
 * Função: Modal para importação de dados de transações do Satisfaction P2P
 * - Extrai automaticamente valores da mensagem colada
 * - Preenche o formulário principal com os dados extraídos
 * 
 * Uso: Chamado pelo EntryForm quando o usuário clica em "Importar do Satisfaction (P2P)"
 */
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface SatisfactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted?: (data: {
    exchangeRate?: number;
    amountInvested?: number;
    btcAmount?: number;
    date?: Date;
  }) => void;
}

/**
 * Extrai valores numéricos de strings formatadas como moeda
 * Ex: "R$ 100,00" -> 100.00
 */
const extractNumberFromCurrency = (text: string): number | null => {
  // Remove R$, espaços e converte vírgula para ponto
  if (!text) return null;
  
  const numericValue = text.replace(/[^\d,]/g, '').replace(',', '.');
  const parsedValue = parseFloat(numericValue);
  
  return isNaN(parsedValue) ? null : parsedValue;
};

/**
 * Extrai o valor em sats da mensagem e converte para BTC
 * Ex: "18.959 sats" -> 0.00018959
 */
const extractBitcoinFromSats = (text: string): number | null => {
  if (!text) return null;
  
  // Busca um número seguido de "sats" ou similar
  const satMatch = text.match(/(\d+[\.,]?\d*)\s*(?:sats|satoshis)/i);
  if (!satMatch) return null;
  
  // Converte o valor encontrado para número (limpando pontos de milhares)
  const satValue = parseFloat(satMatch[1].replace(/\./g, '').replace(',', '.'));
  if (isNaN(satValue)) return null;
  
  // Converte sats para BTC
  return satValue / 100000000;
};

/**
 * Extrai a data da mensagem do Satisfaction
 * Procura padrões como "Expira em: 13/04/25 às 09:02:57"
 * @param message Mensagem completa do Satisfaction
 * @returns Data encontrada ou null se não encontrar
 */
const extractDateFromMessage = (message: string): Date | null => {
  if (!message) return null;
  
  // Procura padrão "Expira em: DD/MM/YY às HH:MM:SS"
  const expireMatch = message.match(/Expira\s+em\s*:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (expireMatch) {
    try {
      // Quebra a data em partes (dia, mês, ano)
      const dateParts = expireMatch[1].split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Meses em JS são 0-indexed
        
        // Trata o ano com 2 ou 4 dígitos
        let year = parseInt(dateParts[2]);
        if (year < 100) {
          // Se o ano tem 2 dígitos, assumimos 20XX
          year += 2000;
        }
        
        const date = new Date(year, month, day);
        
        // Verifica se a data é válida
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      console.error("Erro ao converter data:", error);
      return null;
    }
  }
  
  return null;
};

const SatisfactionImportModal: React.FC<SatisfactionImportModalProps> = ({ 
  isOpen, 
  onClose,
  onDataExtracted 
}) => {
  const [importText, setImportText] = useState('');
  const [showNoDateDialog, setShowNoDateDialog] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    exchangeRate?: number;
    amountInvested?: number;
    btcAmount?: number;
    date?: Date;
  } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Função para fazer scroll suave quando o textarea receber foco no mobile
   * Assegura que o campo fique visível acima do teclado virtual
   */
  const handleTextareaFocus = () => {
    if (isMobile && textareaRef.current) {
      // Primeiro damos um pequeno tempo para o teclado aparecer
      setTimeout(() => {
        if (textareaRef.current) {
          // Rola a tela para mostrar o textarea
          textareaRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
          
          // Adiciona um pouco de margem adicional para evitar que o topo da tela corte o textarea
          window.scrollBy(0, -100);
        }
      }, 300);
    }
  };

  /**
   * Extrai os dados da mensagem do Satisfaction
   * Retorna um objeto com os valores encontrados ou null se não conseguir extrair
   */
  const extractDataFromMessage = (message: string): {
    exchangeRate?: number;
    amountInvested?: number;
    btcAmount?: number;
    date?: Date;
  } | null => {
    if (!message.trim()) return null;
    
    // Extrair a cotação BTC/BRL
    let exchangeRate: number | null = null;
    const cotacaoMatch = message.match(/Cotação\s+BTC\/BRL\s*:\s*R\$\s*([0-9.,]+)/i);
    if (cotacaoMatch) {
      exchangeRate = extractNumberFromCurrency(cotacaoMatch[1]);
    }
    
    // Extrair o valor investido
    let amountInvested: number | null = null;
    
    // Tentar padrão "Valor: R$ X"
    const valorMatch = message.match(/Valor\s*:\s*R\$\s*([0-9.,]+)/i);
    if (valorMatch) {
      amountInvested = extractNumberFromCurrency(valorMatch[0]);
    }
    
    // Se não encontrou, tentar padrão "Montante: R$ X"
    if (!amountInvested) {
      const montanteMatch = message.match(/Montante\s*:\s*R\$\s*([0-9.,]+)/i);
      if (montanteMatch) {
        amountInvested = extractNumberFromCurrency(montanteMatch[0]);
      }
    }
    
    // Extrair a quantidade de Bitcoin (em sats)
    let btcAmount: number | null = null;
    
    // Tentar padrão "Você Recebe: X sats"
    const recebeMatch = message.match(/(?:Você\s+Recebe|irá\s+receber)\s*:\s*([0-9.,]+\s*sats)/i);
    if (recebeMatch) {
      btcAmount = extractBitcoinFromSats(recebeMatch[0]);
    }
    
    // Extrair a data da mensagem
    const date = extractDateFromMessage(message);
    
    // Verificar se encontrou pelo menos alguns dos valores
    if (!exchangeRate && !amountInvested && !btcAmount) {
      return null;
    }
    
    return {
      exchangeRate,
      amountInvested,
      btcAmount,
      date
    };
  };

  const handleImport = () => {
    try {
      // Extrair os dados da mensagem
      const data = extractDataFromMessage(importText);
      
      if (!data) {
        // Se não conseguiu extrair nenhum dado, mostrar mensagem de erro
        toast({
          title: "Não foi possível extrair os dados",
          description: "Verifique se a mensagem está no formato correto e tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      // Verifica se a data foi encontrada
      if (!data.date) {
        // Se não encontrou data, armazena os dados para usar depois e mostra o diálogo de confirmação
        setExtractedData(data);
        setShowNoDateDialog(true);
        return;
      }
      
      // Mostrar quais dados foram extraídos
      const extractedFields = [];
      if (data.exchangeRate) extractedFields.push("cotação");
      if (data.amountInvested) extractedFields.push("valor");
      if (data.btcAmount) extractedFields.push("quantidade de Bitcoin");
      if (data.date) extractedFields.push("data");
      
      // Enviar dados extraídos para o componente pai
      if (onDataExtracted) {
        onDataExtracted(data);
      }
      
      // Exibir mensagem de sucesso
      toast({
        title: "Dados importados com sucesso",
        description: `Foram extraídos: ${extractedFields.join(", ")}.`,
        variant: "success"
      });
      
      // Limpar o campo e fechar o modal
      setImportText('');
      onClose();
    } catch (error) {
      console.error("Erro ao processar mensagem do Satisfaction:", error);
      
      toast({
        title: "Erro ao processar a mensagem",
        description: "Ocorreu um erro ao tentar extrair os dados. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Quando o modal é fechado, limpa os estados
  const handleClose = () => {
    setImportText('');
    setShowNoDateDialog(false);
    setExtractedData(null);
    onClose();
  };

  // Continua a importação mesmo sem data detectada
  const handleContinueWithoutDate = () => {
    if (extractedData && onDataExtracted) {
      // Adiciona a data atual como fallback
      const dataWithCurrentDate = {
        ...extractedData,
        date: new Date()
      };
      
      // Envia para o componente pai
      onDataExtracted(dataWithCurrentDate);
      
      // Exibe toast informando sobre a data não identificada
      toast({
        title: "Dados importados com data atual",
        description: "Os dados foram importados e a data foi preenchida com o dia de hoje.",
        variant: "success"
      });
      
      // Limpa e fecha tudo
      setImportText('');
      setShowNoDateDialog(false);
      setExtractedData(null);
      onClose();
    }
  };

  const exampleMessage = `Expira em: 13/04/25 às 09:02:57
Cotação BTC/BRL: R$506.358
Fonte: Sideswap
Valor: R$ 100,00
Taxa Fixa: R$ 2,00
Taxa Percentual: 2%
Você Recebe: 18.959 sats`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Importar do Satsfaction (P2P)</DialogTitle>
            <DialogDescription>
              Cole a mensagem de confirmação recebida do Satsfaction P2P abaixo.
            </DialogDescription>
            <Alert variant="default" className="mt-4 bg-yellow-50 border-yellow-300 text-yellow-800 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                O <strong>Bitcoin DCA PRO</strong> não possui qualquer ligação com a plataforma <strong>Satsfaction</strong>.
                Esta funcionalidade existe apenas para facilitar a importação de dados a partir de mensagens recebidas por usuários.
              </AlertDescription>
            </Alert>
                      
          </DialogHeader>

          <div className="py-4">
            <Textarea
              ref={textareaRef}
              placeholder={exampleMessage}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              onFocus={handleTextareaFocus}
              className="min-h-[150px] rounded-md placeholder:whitespace-pre-line placeholder:text-muted-foreground placeholder:opacity-60 text-foreground text-base"
              style={{ fontSize: '16px' }} // Evita zoom no mobile
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              className="bg-bitcoin hover:bg-bitcoin/90 w-full sm:w-auto"
              disabled={!importText.trim()}
            >
              Importar Aporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para quando a data não é encontrada */}
      <AlertDialog open={showNoDateDialog} onOpenChange={setShowNoDateDialog}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Data do aporte não identificada</AlertDialogTitle>
            <AlertDialogDescription>
              Preenchemos a data com o dia de hoje. Por favor, confirme se deseja continuar ou volte para ajustar a data manualmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowNoDateDialog(false)} className="w-full sm:w-auto">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleContinueWithoutDate}
              className="bg-bitcoin hover:bg-bitcoin/90 w-full sm:w-auto"
            >
              Continuar assim mesmo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SatisfactionImportModal;
