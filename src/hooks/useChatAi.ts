/**
 * Hook para gerenciar o estado e a lógica do chat com a IA
 *
 * Responsável por:
 * ✅ Manter histórico de mensagens
 * ✅ Comunicar com a API do n8n via webhook autenticado com JWT
 * ✅ Gerenciar estados de loading, erro e token de autenticação
 * ✅ Sanitizar input do usuário para segurança
 * ✅ Gerenciar chat_id persistente para agrupamento de conversas
 */

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  content: string;
  isAi: boolean;
}

interface ChatToken {
  token: string;
  chatId: string;
  expiresAt: number;
}

export function useChatAi() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatToken, setChatToken] = useState<ChatToken | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Sanitiza o input do usuário para evitar XSS/injeção
   */
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/<[^>]*>?/gm, '') // remove tags HTML
      .replace(/[`"$<>;]/g, '')  // remove caracteres perigosos
      .trim();
  };

  /**
   * Verifica se o token atual é válido
   */
  const isTokenValid = (): boolean => {
    if (!chatToken) return false;
    const nowWithMargin = Date.now() + 30_000; // 30s de margem
    return chatToken.expiresAt > nowWithMargin;
  };

  /**
   * Obtém um novo token JWT da Edge Function Supabase
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
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na chamada da Edge Function:', errorText);
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const newToken: ChatToken = {
        token: data.token,
        chatId: data.chatId,
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 min
      };

      setChatToken(newToken);
      console.log('✅ Novo token JWT salvo com chatId:', newToken.chatId);
      return newToken;

    } catch (error) {
      console.error('Erro ao buscar token de chat:', error);
      toast({
        title: 'Erro de autenticação',
        description: 'Falha ao autenticar o chat. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsTokenLoading(false);
    }
  };

  /**
   * Envia mensagem para o webhook com JWT
   */
  const sendMessage = async (userMessage: string) => {
    try {
      setIsLoading(true);

      const sanitizedMessage = sanitizeInput(userMessage);
      setMessages(prev => [...prev, { content: userMessage, isAi: false }]);

      // Token local
      let jwt = chatToken?.token;
      let chatId = chatToken?.chatId;
      
      if (!isTokenValid()) {
        const newToken = await fetchChatToken();
        if (!newToken) {
          throw new Error('Falha ao obter token de autenticação');
        }
      
        jwt = newToken.token;
        chatId = newToken.chatId;
      }
      if (!jwt || !chatId) {
        throw new Error('Token ou chatId ausente após tentativa de renovação');
      }

      const payload = {
        message: sanitizedMessage,
        role: 'user',
        chat_id: chatId,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('https://workflows.marcolinofernades.site/webhook-test/satsflow-ai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptContext),
          message: sanitizedMessage,
          role: "user",
          chat_id: chatId,
          timestamp: new Date().toISOString()
        }),

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Webhook retornou erro ${response.status}: ${responseText}`);
      }

      const data = await response.json();
      const aiReply = data.message || data.response || data.text || JSON.stringify(data);

      setMessages(prev => [...prev, { content: aiReply, isAi: true }]);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro na comunicação',
        description: 'Não foi possível obter resposta da IA.',
        variant: 'destructive',
      });
      setMessages(prev => [...prev, {
        content: 'Desculpe, tivemos um problema de comunicação. Tente novamente em instantes.',
        isAi: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading: isLoading || isTokenLoading,
    sendMessage,
    chatId: chatToken?.chatId,
  };
}
