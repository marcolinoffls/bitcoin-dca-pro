
// Importa os tipos do Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Configuração da API da CoinMarketCap
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/fear-greed/stats';

// Handler principal da Edge Function
serve(async (req) => {
  try {
    // Obtém a API key dos secrets do projeto
    const apiKey = Deno.env.get('COINMARKETCAP_API_KEY')
    
    if (!apiKey) {
      throw new Error('API Key da CoinMarketCap não configurada')
    }

    // Faz a requisição para a API da CoinMarketCap
    const response = await fetch(CMC_API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`)
    }

    const data = await response.json()

    // Retorna os dados processados
    return new Response(
      JSON.stringify(data),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Erro:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
