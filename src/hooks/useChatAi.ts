
/**
 * Hook para gerenciar o estado e a lógica do chat com a IA
 * Responsável por:
 * - Manter histórico de mensagens
 * - Comunicar com a API do n8n via webhook autenticado
 * - Gerenciar estados de loading, erro e token de autenticação
 * - Sanitizar input do usuário para segurança
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
  expiresAt: number; // timestamp em milissegundos
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
   * Obtém um novo token de chat da Edge Function do Supabase
   * Este token será usado para autenticar requisições ao webhook do n8n
   */
  const fetchChatToken = async (): Promise<boolean> => {
    try {
      setIsTokenLoading(true);

      // Obtém a sessão atual do usuário para extrair o token de autenticação
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error('Sessão de usuário não encontrada');
      }

      // URL da Edge Function do Supabase que gera o token de chat
      const edgeFunctionUrl = 'https://wccbdayxpucptynpxhew.functions.supabase.co/generate-chat-token';
      
      // Chamada para a Edge Function usando o token de autenticação do Supabase
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

      // Extrai o token e define quando ele expira (5 minutos a partir de agora)
      const data = await response.json();
      const token: string = data.token;
      
      // Armazena o token com sua data de expiração (5 minutos)
      setChatToken({
        token,
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutos em milissegundos
      });
      
      console.log('✅ Token de chat recebido da Edge Function:', token); 
      
      return true;
    } catch (error) {
      console.error('Erro ao obter token de chat:', error);
      
      toast({
        title: "Erro de autenticação",
        description: "Falha ao autenticar o chat. Tente novamente em instantes.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsTokenLoading(false);
    }
  };

  /**
   * Função para enviar mensagem do usuário para o webhook do n8n
   * Gerencia a obtenção do token se necessário e inclui autenticação
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

      // Verifica se precisa obter um novo token
      if (!isTokenValid()) {
        const tokenSuccess = await fetchChatToken();
        if (!tokenSuccess) {
          throw new Error('Falha ao obter token de autenticação');
        }
      }
      
      // Prepara o contexto do prompt para evitar injeção de comandos
      const promptContext = {
        message: sanitizedMessage,
        role: "user",
        timestamp: new Date().toISOString()
      };

      // Chamada ao webhook do n8n com autenticação
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
  };
}
