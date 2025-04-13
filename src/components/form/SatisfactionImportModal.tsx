
/**
 * Componente: SatisfactionImportModal
 * 
 * Função: Modal para importação de dados de transações do Satisfaction P2P
 * - Extrai automaticamente valores da mensagem colada
 * - Preenche o formulário principal com os dados extraídos
 * 
 * Uso: Chamado pelo EntryForm quando o usuário clica em "Importar do Satisfaction (P2P)"
 */
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatNumber } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [noDateWarning, setNoDateWarning] = useState(false);
  const { toast } = useToast();

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
      const extractedData = extractDataFromMessage(importText);
      
      if (!extractedData) {
        // Se não conseguiu extrair nenhum dado, mostrar mensagem de erro
        toast({
          title: "Não foi possível extrair os dados",
          description: "Verifique se a mensagem está no formato correto e tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      // Verifica se a data foi encontrada
      if (!extractedData.date) {
        // Se não encontrou data, mostra aviso e não fecha o modal automaticamente
        setNoDateWarning(true);
        
        // Adiciona a data atual como fallback
        extractedData.date = new Date();
      } else {
        // Se encontrou a data, não precisa mostrar aviso
        setNoDateWarning(false);
      }
      
      // Mostrar quais dados foram extraídos
      const extractedFields = [];
      if (extractedData.exchangeRate) extractedFields.push("cotação");
      if (extractedData.amountInvested) extractedFields.push("valor");
      if (extractedData.btcAmount) extractedFields.push("quantidade de Bitcoin");
      if (extractedData.date) extractedFields.push("data");
      
      // Enviar dados extraídos para o componente pai
      if (onDataExtracted) {
        onDataExtracted(extractedData);
      }
      
      // Se não tiver aviso de data, fecha o modal automaticamente
      if (!noDateWarning) {
        // Exibir mensagem de sucesso
        toast({
          title: "Dados importados com sucesso",
          description: `Foram extraídos: ${extractedFields.join(", ")}.`,
          variant: "success"
        });
        
        // Limpar o campo e fechar o modal
        setImportText('');
        onClose();
      }
    } catch (error) {
      console.error("Erro ao processar mensagem do Satisfaction:", error);
      
      toast({
        title: "Erro ao processar a mensagem",
        description: "Ocorreu um erro ao tentar extrair os dados. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Quando o modal é fechado, limpa o aviso de data e o texto
  const handleClose = () => {
    setNoDateWarning(false);
    setImportText('');
    onClose();
  };

  const exampleMessage = `Expira em: 13/04/25 às 09:02:57
Cotação BTC/BRL: R$506.358
Fonte: Sideswap
Valor: R$ 100,00
Taxa Fixa: R$ 2,00
Taxa Percentual: 2%
Você Recebe: 18.959 sats`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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

          {/* Aviso quando data não foi encontrada */}
          {noDateWarning && (
            <Alert variant="warning" className="mt-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700">
                Nenhuma data foi identificada na mensagem. Preenchemos com a data de hoje. Por favor, revise antes de confirmar.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
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
