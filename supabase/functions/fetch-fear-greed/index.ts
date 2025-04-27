
// Importa os tipos do Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Configuração da API da CoinMarketCap
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Headers CORS para permitir requisições do frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handler principal da Edge Function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obtém a API key dos secrets do projeto
    const apiKey = Deno.env.get('COINMARKETCAP_API_KEY')
    
    if (!apiKey) {
      throw new Error('API Key da CoinMarketCap não configurada')
    }

    // Faz a requisição para a API da CoinMarketCap
    const response = await fetch(`${CMC_API_URL}?symbol=BTC&convert=USD`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} - ${await response.text()}`)
    }

    const data = await response.json()

    // Processa os dados para retornar apenas as informações relevantes
    const btcData = data.data.BTC;
    const processedData = {
      value: Math.round(Math.random() * 100), // Simulando valor do Fear & Greed
      value_classification: 'Neutral', // Simulando classificação
      timestamp: new Date().toISOString()
    };

    // Retorna os dados processados
    return new Response(
      JSON.stringify({ data: [processedData] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Erro:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})

