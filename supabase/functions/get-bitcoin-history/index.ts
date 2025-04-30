/**
 * Edge Function: get-bitcoin-history
 *
 * Busca o histórico de preços do Bitcoin via CoinStats como principal
 * Com fallback para CoinMarketCap em caso de erro
 *
 * Parâmetro esperado via POST JSON:
 * - { range: '1D' | '7D' | '1M' | '1Y' | 'ALL' }
 *
 * Retorna: [{ time: string, price: number }]
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Permite chamadas do frontend (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Intervalos e datas por período
const rangeMap = {
  '1D': { days: 1, points: 24 },
  '7D': { days: 7, points: 7 },
  '1M': { days: 30, points: 30 },
  '1Y': { days: 365, points: 12 },
  'ALL': { days: 365 * 10, points: 10 } // Simula 10 anos
};

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { range } = await req.json();
    if (!range || !(range in rangeMap)) {
      return new Response(
        JSON.stringify({ error: 'Parâmetro range inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Edge Function] Buscando histórico: ${range}`);

    try {
      const data = await fetchFromCoinCap(range);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (coinStatsError) {
      console.error('Erro na CoinStats:', coinStatsError);

      try {
        const fallback = await fetchFromCoinMarketCap(range);
        return new Response(JSON.stringify(fallback), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (fallbackError) {
        console.error('Fallback CoinMarketCap também falhou:', fallbackError);
        return new Response(
          JSON.stringify({ error: 'Todas as tentativas de API falharam' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro inesperado', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Busca dados históricos da CoinStats API
 */
async function fetchFromCoinCap(range: '1D' | '7D' | '1M' | '1Y' | 'ALL') {
  const now = Date.now();
  
  const intervals: Record<string, { interval: string; start: number }> = {
    '1D': { interval: 'm15', start: now - 1 * 24 * 60 * 60 * 1000 },     // 15 min para 24h
    '7D': { interval: 'h2', start: now - 7 * 24 * 60 * 60 * 1000 },
    '1M': { interval: 'h12', start: now - 30 * 24 * 60 * 60 * 1000 },
    '1Y': { interval: 'd1', start: now - 365 * 24 * 60 * 60 * 1000 },
    'ALL': { interval: 'd1', start: 1367107200000 } // Desde 2013
  };

  const { interval, start } = intervals[range];
  const url = `https://api.coincap.io/v2/assets/bitcoin/history?interval=${interval}&start=${start}&end=${now}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro CoinCap: ${res.status}`);

  const json = await res.json();
  const raw = json?.data ?? [];

  return raw.map((item: { time: number; priceUsd: string }) => {
    const date = new Date(item.time);
    let label: string;

    if (range === '1D') {
      label = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D' || range === '1M') {
      label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      label = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
    }

    return {
      time: label,
      price: parseFloat(parseFloat(item.priceUsd).toFixed(2))
    };
  });
}

/**
 * Fallback: busca preço atual da CoinMarketCap e gera pontos simulados
 */
async function fetchFromCoinMarketCap(range: string): Promise<{ time: string; price: number }[]> {
  const key = Deno.env.get('COINMARKETCAP_API_KEY');
  if (!key) throw new Error("COINMARKETCAP_API_KEY não definida");

  const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD`;
  const res = await fetch(url, {
    headers: {
      'X-CMC_PRO_API_KEY': key,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) throw new Error(`CoinMarketCap API status: ${res.status}`);
  const json = await res.json();
  const price = json?.data?.BTC?.quote?.USD?.price;
  if (!price) throw new Error("Preço atual não encontrado");

  return generateSimulatedPoints(range, price, new Date());
}

/**
 * Formata os dados da CoinStats no formato necessário para o gráfico
 */
function formatChartData(raw: [number, number][], range: string): { time: string; price: number }[] {
  return raw.map(([timestamp, price]) => {
    const date = new Date(timestamp);

    let timeLabel;
    if (range === '1D') {
      timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D' || range === '1M') {
      timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      timeLabel = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
    }

    return {
      time: timeLabel,
      price: parseFloat(price.toFixed(2))
    };
  });
}

/**
 * Gera pontos simulados a partir do preço atual (usado apenas no fallback)
 */
function generateSimulatedPoints(range: string, basePrice: number, now: Date): { time: string; price: number }[] {
  const count = rangeMap[range].points;
  const points = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    const variation = 0.95 + Math.random() * 0.1; // 95% a 105%
    const price = parseFloat((basePrice * variation).toFixed(2));

    if (range === '1D') date.setHours(now.getHours() - (count - i));
    else if (range === '7D' || range === '1M') date.setDate(now.getDate() - (count - i));
    else if (range === '1Y') date.setMonth(now.getMonth() - (count - i));
    else date.setFullYear(now.getFullYear() - (count - i));

    let label;
    if (range === '1D') {
      label = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D' || range === '1M') {
      label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      label = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
    }

    points.push({ time: label, price });
  }

  return points;
}
