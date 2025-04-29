/**
 * Hook para gerenciar o estado e a lógica do chat com a IA
 *
 * Funções:
 * ✅ Manter histórico de mensagens
 * ✅ Comunicar com o n8n via webhook autenticado com JWT
 * ✅ Buscar e validar token JWT via Supabase Edge Function
 * ✅ Prevenir XSS com sanitização de entrada
 * ✅ Lidar com estados de loading e erros
 */

// Importa hooks do React e ferramentas de integração
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast'; // Sistema de notificação
import { supabase } from '@/integrations/supabase/client'; // Instância do Supabase já autenticada

// Interface de mensagem usada no estado
export interface ChatMessage {
  content: string;
  isAi: boolean;
}

// Interface para guardar o token JWT e informações associadas
interface ChatToken {
  token: string;       // JWT assinado com informações de chat_id
  chatId: string;      // ID único e persistente da conversa
  expiresAt: number;   // Timestamp de expiração (em ms)
}

// Hook principal que gerencia toda a lógica do chat com a IA
export function useChatAi() {
  // Estado com histórico de mensagens (AI e usuário)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Estado de carregamento de mensagens
  const [isLoading, setIsLoading] = useState(false);
  // Estado com token de autenticação do chat
  const [chatToken, setChatToken] = useState<ChatToken | null>(null);
  // Estado para sinalizar que estamos buscando novo token
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  // Toast para exibir erros ou mensagens visuais
  const { toast } = useToast();

  // Sanitiza entradas para evitar XSS ou comandos maliciosos
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/<[^>]*>?/gm, '') // remove tags HTML
      .replace(/[`"$<>;]/g, '')  // remove caracteres perigosos
      .trim();
  };

  // Verifica se o token atual está válido (TTL com margem de 30s)
  const isTokenValid = (): boolean => {
    if (!chatToken) return false;
    const nowWithMargin = Date.now() + 30_000;
    return chatToken.expiresAt > nowWithMargin;
  };

  /**
   * 🔐 Busca novo token JWT da edge function protegida do Supabase
   * - Gera um chat_id persistente por usuário
   * - Autentica via access_token do Supabase
   * - Espera uma resposta com token JWT e chatId
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
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro Edge Function:', response.status, errorText);
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Token expira em 5 minutos
      const newToken: ChatToken = {
        token: data.token,
        chatId: data.chatId,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      // Armazena novo token JWT no estado global do hook
      setChatToken(newToken);
      console.log('✅ Novo token JWT salvo com chatId:', newToken.chatId);
      return newToken;
    } catch (error) {
      console.error('❌ Erro ao obter token JWT:', error);
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
   * 📤 Envia mensagem do usuário para o webhook n8n
   * - Verifica e renova token JWT se necessário
   * - Autentica com JWT gerado por Edge Function
   * - Envia mensagem + chatId persistente para rastrear conversas
   */
  const sendMessage = async (userMessage: string) => {
    try {
      setIsLoading(true);

      // Sanitiza input antes de enviar para IA
      const sanitizedMessage = sanitizeInput(userMessage);

      // Adiciona a mensagem do usuário no histórico local
      setMessages(prev => [...prev, { content: userMessage, isAi: false }]);

      let jwt = chatToken?.token || null;
      let chatId = chatToken?.chatId || null;

      // Renova o token JWT se necessário
      if (!isTokenValid()) {
        const newToken = await fetchChatToken();
        if (!newToken) throw new Error('Falha ao renovar token JWT');
        jwt = newToken.token;
        chatId = newToken.chatId;
      }

      // Verifica novamente (fallback defensivo)
      if (!jwt || !chatId) {
        throw new Error('Token ou chatId ausente');
      }

      // Payload que será enviado para o webhook n8n
      const payload = {
        message: sanitizedMessage,
        role: 'user',
        chat_id: chatId,
        timestamp: new Date().toISOString(),
      };

      // Chamada POST para o endpoint do webhook autenticado
      const response = await fetch('https://workflows.marcolinofernades.site/webhook-test/satsflow-ai', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Se erro, loga o body para debugging
      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Webhook retornou erro ${response.status}: ${responseText}`);
      }

      const data = await response.json();

      // Tentativa progressiva de extrair a resposta da IA
      const aiResponse = data.output || data.message || data.response || data.text || JSON.stringify(data);

      // Atualiza histórico de mensagens com a resposta da IA
      setMessages(prev => [...prev, { content: aiResponse, isAi: true }]);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro na comunicação',
        description: 'Não foi possível obter resposta da IA. Tente novamente.',
        variant: 'destructive',
      });
      setMessages(prev => [
        ...prev,
        {
          content: 'Desculpe, tivemos um problema de comunicação. Tente novamente.',
          isAi: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expondo funcionalidades e estado para o componente que usar o hook
  return {
    messages,                        // Histórico da conversa
    isLoading: isLoading || isTokenLoading, // Estado global de loading
    sendMessage,                     // Função para enviar mensagem para a IA
    chatId: chatToken?.chatId,      // chat_id persistente (útil para logs)
  };
}
