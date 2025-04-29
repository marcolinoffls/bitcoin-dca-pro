
/**
 * Hook para gerenciar o estado e a lógica do chat com a IA
 * Responsável por:
 * - Manter histórico de mensagens
 * - Comunicar com a API do n8n via webhook
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

  /**
   * Função para enviar mensagem do usuário para o webhook do n8n
   * e processar a resposta retornada pela IA
   * 
   * @param userMessage - Mensagem enviada pelo usuário
   */
  const sendMessage = async (userMessage: string) => {
    try {
      setIsLoading(true);
      
      // Adiciona mensagem do usuário ao histórico
      setMessages(prev => [...prev, { content: userMessage, isAi: false }]);

      // Chamada ao webhook do n8n
      const response = await fetch('https://webhooks.marcolinofernades.site/webhook/satsflow-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Erro na comunicação: ${response.status} ${response.statusText}`);
      }

      // Processa a resposta do webhook
      const data = await response.json();
      
      // Extrai a mensagem da resposta - assumindo que o webhook retorna um objeto com campo "message"
      // Se o formato for diferente, ajuste conforme necessário
      const aiResponse = data.message || data.response || data.text || JSON.stringify(data);
      
      // Adiciona resposta da IA ao histórico
      setMessages(prev => [...prev, { content: aiResponse, isAi: true }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Exibe toast com mensagem de erro para o usuário
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível obter resposta da IA. Tente novamente em instantes.",
        variant: "destructive",
      });
      
      // Opcionalmente, adiciona mensagem de erro ao chat
      setMessages(prev => [...prev, { 
        content: "Desculpe, tivemos um problema de comunicação. Tente novamente em alguns instantes.", 
        isAi: true 
      }]);
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
