
/**
 * Hook para gerenciar o estado e a lógica do chat com a IA
 * Responsável por:
 * - Manter histórico de mensagens
 * - Comunicar com a API do n8n via webhook autenticado com JWT
 * - Gerenciar estados de loading, erro e token de autenticação
 * - Sanitizar input do usuário para segurança
 * - Gerenciar chat_id persistente para agrupamento de conversas
 */
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  content: string;
  isAi: boolean;
}

interface ChatToken {
  token: string;
  chatId: string;     // ID persistente do chat (diferente do user.id)
  expiresAt: number;  // timestamp em milissegundos
}

export function useChatAi() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatToken, setChatToken] = useState<ChatToken | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Sanitiza o input do usuário para evitar injeção de código malicioso
   * Remove tags HTML e caracteres especiais potencialmente perigosos
   * 
   * @param input - Texto bruto fornecido pelo usuário
   * @returns Texto sanitizado seguro para processamento
   */
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/<[^>]*>?/gm, '') // remove tags HTML
      .replace(/[`"$<>;]/g, '')   // remove caracteres potencialmente perigosos
      .trim();
  };

  /**
   * Verifica se o token atual é válido ou se está expirado
   * Retorna true se o token for válido e false se estiver expirado ou não existir
   */
  const isTokenValid = (): boolean => {
    if (!chatToken) return false;
    
    // Verificar se o token expirou (com margem de segurança de 30 segundos)
    const nowWithMargin = Date.now() + 30000; // atual + 30 segundos
    return chatToken.expiresAt > nowWithMargin;
  };

  /**
   * Obtém um novo token JWT de chat da Edge Function do Supabase
   * Este token será usado para autenticar requisições ao webhook do n8n
   * e inclui um chat_id persistente para rastreamento das conversas
   */
  const fetchChatToken = async (): Promise<ChatToken | null> => {
    try {
      setIsTokenLoading(true);
  
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Sessão de usuário não encontrada');
      }
  
      const edgeFunctionUrl = 'https://wccbdayxpucptynpxhew.supabase.co/functions/v1/generate-chat-token';
  
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Resposta da Edge Function:', response.status, errorData);
        throw new Error(`Erro ao obter token: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
  
      const newToken: ChatToken = {
        token: data.token,
        chatId: data.chatId,
        expiresAt: Date.now() + (5 * 60 * 1000),
      };
  
      console.log('✅ Token JWT recebido com chat_id:', newToken.chatId);
  
      // ✅ Salva no estado
      setChatToken(newToken);
  
      return newToken;
  
    } catch (error) {
      console.error('Erro ao obter token de chat:', error);
      toast({
        title: "Erro de autenticação",
        description: "Falha ao autenticar o chat. Tente novamente em instantes.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsTokenLoading(false);
    }
  };
  

  /**
   * Função para enviar mensagem do usuário para o webhook do n8n
   * Gerencia a obtenção do token JWT se necessário e inclui autenticação
   * 
   * @param userMessage - Mensagem enviada pelo usuário
   */
  const sendMessage = async (userMessage: string) => {
    try {
      setIsLoading(true);
      
      // Sanitiza a mensagem do usuário para segurança
      const sanitizedMessage = sanitizeInput(userMessage);
      
      // Adiciona mensagem do usuário ao histórico
      setMessages(prev => [...prev, { content: userMessage, isAi: false }]);

      // Verifica se precisa obter um novo token JWT
      if (!isTokenValid()) {
        const newToken = await fetchChatToken();
        if (!newToken) {
          throw new Error('Falha ao obter token de autenticação');
        }
      
        // Atualize as variáveis locais após fetch
        chatToken = newToken;
      }

      // ✅ Garante que o token está atualizado após possível atualização
      const jwt = chatToken?.token;
      const chatId = chatToken?.chatId;
      
      if (!jwt || !chatId) {
        throw new Error('Token ou chatId ausente após fetch');
      }

      // Prepara o contexto do prompt para evitar injeção de comandos
      const promptContext = {
        message: sanitizedMessage,
        role: "user",
        chat_id: chatToken?.chatId, // Envia o chat_id persistente
        timestamp: new Date().toISOString()
      };

      // Chamada ao webhook do n8n com autenticação JWT
      const response = await fetch('https://workflows.marcolinofernades.site/webhook-test/satsflow-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chatToken?.token}`,
        },
        body: JSON.stringify(promptContext),
      });

      if (!response.ok) {
        throw new Error(`Erro na comunicação: ${response.status} ${response.statusText}`);
      }

      // Processa a resposta do webhook
      const data = await response.json();
      
      // Extrai a mensagem da resposta - assumindo que o webhook retorna um objeto com campo "message"
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
      
      // Adiciona mensagem de erro ao chat
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
    isLoading: isLoading || isTokenLoading, // Loading é true se estiver carregando mensagem ou token
    sendMessage,
    chatId: chatToken?.chatId // Expõe o chat_id para uso externo se necessário
  };
}
