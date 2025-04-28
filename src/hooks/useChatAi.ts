
/**
 * Hook para gerenciar o estado e a lógica do chat com a IA
 * Responsável por:
 * - Manter histórico de mensagens
 * - Comunicar com a API do n8n
 * - Gerenciar estados de loading e erro
 */
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface ChatMessage {
  content: string;
  isAi: boolean;
}

export function useChatAi() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (userMessage: string) => {
    try {
      setIsLoading(true);
      
      // Adiciona mensagem do usuário ao histórico
      setMessages(prev => [...prev, { content: userMessage, isAi: false }]);

      // TODO: Implementar chamada real à API do n8n
      // Por enquanto, simula uma resposta após 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula resposta da IA
      const aiResponse = "Esta é uma resposta simulada da IA. A integração real com o n8n será implementada em breve.";
      
      setMessages(prev => [...prev, { content: aiResponse, isAi: true }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
  };
}
