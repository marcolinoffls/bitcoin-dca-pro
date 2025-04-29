
/**
 * Edge Function: generate-chat-token
 * 
 * Gera um token JWT assinado para o chat com IA.
 * Este token inclui um chat_id persistente associado ao usuário
 * para rastreamento e agrupamento de conversas.
 * 
 * O usuário deve estar autenticado para acessar esta função.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { create, verify } from "https://esm.sh/njwt@2.0.0";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

// Configuração de cabeçalhos CORS para a Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chave para assinar JWT (em produção, use uma chave segura armazenada em segredos)
// Idealmente, essa chave deve ser configurada como um segredo do Supabase
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'super_secret_jwt_key_for_satsflow_ai_chat';

serve(async (req) => {
  // Tratamento de requisição OPTIONS (pre-flight CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Extrai o token de autenticação da requisição
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Token JWT da autenticação do Supabase
    const supabaseAuthToken = authHeader.split(' ')[1];

    // Inicializa o cliente Supabase para verificar a identidade do usuário
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { 
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` 
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Verificar autenticação do usuário usando o token recebido
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(supabaseAuthToken);

    if (userError || !user) {
      console.error('Erro ao verificar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado', details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Obtenha ou crie um chat_id persistente para o usuário
    let chatId;
    
    // Primeiro, tente encontrar um registro existente
    const { data: existingChatId, error: chatIdError } = await supabaseAdmin
      .from('user_chat_ids')
      .select('chat_id')
      .eq('user_id', user.id)
      .single();
    
    if (chatIdError || !existingChatId) {
      // Se não existir, crie um novo registro
      const newChatId = uuidv4();
      const { error: insertError } = await supabaseAdmin
        .from('user_chat_ids')
        .insert({ user_id: user.id, chat_id: newChatId });
        
      if (insertError) {
        console.error('Erro ao criar chat_id persistente:', insertError);
        throw new Error('Falha ao criar identificador de chat');
      }
      
      chatId = newChatId;
    } else {
      chatId = existingChatId.chat_id;
    }

    // Cria um JWT com expiração de 5 minutos
    const expirationTime = Math.floor(Date.now() / 1000) + (5 * 60); // 5 minutos em segundos
    
    // Cria o objeto JWT com os claims necessários
    const token = create({
      sub: user.id,         // sujeito do token (user_id para rastreabilidade interna)
      chat_id: chatId,      // identificador persistente do chat deste usuário
      exp: expirationTime,  // expiração do token
      iat: Math.floor(Date.now() / 1000) // issued at (emitido em)
    }, JWT_SECRET);
    
    // Assina o token com o algoritmo HS256
    const jwtToken = token.compact();

    // Registra o acesso (opcional)
    console.log(`Token JWT gerado para usuário: ${user.id} com chat_id: ${chatId}`);

    // Retorna o token para o cliente
    return new Response(
      JSON.stringify({ 
        token: jwtToken,
        chatId: chatId,
        userId: user.id,
        expiresIn: 300 // 5 minutos (segundos)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    // Log do erro para depuração
    console.error('Erro ao gerar token JWT de chat:', error);

    // Retorna erro para o cliente
    return new Response(
      JSON.stringify({ error: 'Falha ao gerar token de chat', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
