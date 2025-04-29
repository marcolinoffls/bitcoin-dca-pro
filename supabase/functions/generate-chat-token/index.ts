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
// ATENÇÃO: configure como variável de ambiente secreta no painel do Supabase
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "default_insecure_dev_key_DO_NOT_USE_IN_PROD";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Verifica header de autorização
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuthToken = authHeader.split(" ")[1];

    // 2. Conexão com Supabase com privilégios de serviço
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

    // 3. Autenticação do usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser(supabaseAuthToken);
    if (userError || !user) {
      console.error("Erro ao verificar usuário:", userError);
      return new Response(JSON.stringify({
        error: "Usuário não autenticado",
        details: userError?.message,
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verifica ou cria chat_id persistente
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
        console.error("Erro ao criar novo chat_id:", insertError);
        throw new Error("Erro ao salvar novo chat_id no banco");
      }

      chatId = newChatId;
    } else {
      chatId = existingChatId.chat_id;
    }

    // 5. Monta header + payload do JWT
    const header: Header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload: Payload = {
      sub: user.id,
      chat_id: chatId,
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 5), // 5 minutos
    };

    // 6. Converte string para chave HMAC segura
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    // 7. Gera JWT
    const jwtToken = await create(header, payload, cryptoKey);

    // 8. Retorna token e metadados
    return new Response(JSON.stringify({
      token: jwtToken,
      chatId: chatId,
      userId: user.id,
      expiresIn: 300, // segundos
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Erro ao gerar token JWT de chat:", err);
    return new Response(JSON.stringify({
      error: "Falha ao gerar token de chat",
      details: err.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
