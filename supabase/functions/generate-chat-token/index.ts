/**
 * Edge Function: generate-chat-token
 *
 * Gera um token JWT assinado para autenticar o chat com IA.
 * O token inclui:
 * - user.id (no campo "sub" → subject)
 * - chat_id único e persistente por usuário
 *
 * O objetivo é permitir:
 * - Autenticação segura no webhook n8n
 * - Rastreabilidade de conversas por chat_id
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { create, getNumericDate, Header, Payload } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";

// CORS Headers (libera acesso ao frontend)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chave usada para assinar o JWT
// Ideal: configure como segredo no painel do Supabase
const JWT_SECRET = Deno.env.get("JWT_SECRET");
if (!JWT_SECRET) throw new Error("JWT_SECRET não definido");
// Função principal da Edge Function
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Autenticação: extrai token do cabeçalho
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuthToken = authHeader.split(" ")[1];

    // 2. Conecta ao Supabase com privilégios administrativos
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // 3. Verifica qual usuário está logado
    const { data: { user }, error: userError } = await supabase.auth.getUser(supabaseAuthToken);

    if (userError || !user) {
      console.error("Erro ao verificar usuário:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado", details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Verifica ou cria um chat_id persistente para esse usuário
    let chatId: string;

    const { data: existingChatId, error: chatIdError } = await supabase
      .from("user_chat_ids")
      .select("chat_id")
      .eq("user_id", user.id)
      .single();

    if (chatIdError || !existingChatId) {
      const newChatId = uuidv4();
      const { error: insertError } = await supabase
        .from("user_chat_ids")
        .insert({ user_id: user.id, chat_id: newChatId });

      if (insertError) {
        throw new Error("Erro ao salvar novo chat_id no banco");
      }

      chatId = newChatId;
    } else {
      chatId = existingChatId.chat_id;
    }

    // 5. Cria o token JWT assinado
    const header: Header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload: Payload = {
      sub: user.id,
      chat_id: chatId,
      iat: getNumericDate(0),        // Emitido agora
      exp: getNumericDate(60 * 5),   // Expira em 5 minutos
    };

    const jwtToken = await create(header, payload, JWT_SECRET);

    // 6. Retorna o token assinado + chat_id
    return new Response(
      JSON.stringify({
        token: jwtToken,
        chatId: chatId,
        userId: user.id,
        expiresIn: 300, // em segundos
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("Erro ao gerar token JWT de chat:", err);
    return new Response(
      JSON.stringify({ error: "Falha ao gerar token de chat", details: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
