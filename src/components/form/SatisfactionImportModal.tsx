
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

interface SatisfactionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted?: (data: {
    exchangeRate?: number;
    amountInvested?: number;
    btcAmount?: number;
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

const SatisfactionImportModal: React.FC<SatisfactionImportModalProps> = ({ 
  isOpen, 
  onClose,
  onDataExtracted 
}) => {
  const [importText, setImportText] = useState('');
  const { toast } = useToast();

  /**
   * Extrai os dados da mensagem do Satisfaction
   * Retorna um objeto com os valores encontrados ou null se não conseguir extrair
   */
  const extractDataFromMessage = (message: string): {
    exchangeRate?: number;
    amountInvested?: number;
    btcAmount?: number;
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
    
    // Verificar se encontrou pelo menos alguns dos valores
    if (!exchangeRate && !amountInvested && !btcAmount) {
      return null;
    }
    
    return {
      exchangeRate,
      amountInvested,
      btcAmount
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
      
      // Mostrar quais dados foram extraídos
      const extractedFields = [];
      if (extractedData.exchangeRate) extractedFields.push("cotação");
      if (extractedData.amountInvested) extractedFields.push("valor");
      if (extractedData.btcAmount) extractedFields.push("quantidade de Bitcoin");
      
      // Enviar dados extraídos para o componente pai
      if (onDataExtracted) {
        onDataExtracted(extractedData);
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
