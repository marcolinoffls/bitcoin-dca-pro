
/**
 * Edge Function: generate-chat-token
 * 
 * Gera um token de autenticação para o chat com IA.
 * Este token é usado para autenticar requisições ao webhook do n8n.
 * 
 * O usuário deve estar autenticado para acessar esta função.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

// Configuração de cabeçalhos CORS para a Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usar service_role_key para garantir acesso autorizado
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

    // Gera um token UUID v4 para uso no chat
    // Em produção, considere usar JWTs com prazo de validade definido
    const chatToken = uuidv4();

    // Registra o acesso (opcional)
    console.log(`Token de chat gerado para usuário: ${user.id}`);

    // Retorna o token para o cliente
    return new Response(
      JSON.stringify({ 
        token: chatToken,
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
    console.error('Erro ao gerar token de chat:', error);

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
