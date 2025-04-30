
/**
 * Serviço para buscar histórico de preços do Bitcoin
 *
 * Este módulo contém funções para obter o histórico
 * de preços do Bitcoin em diferentes intervalos de tempo,
 * através da Supabase Edge Function ou fallback para CoinCap/CoinMarketCap.
 *
 * Usado principalmente em:
 * - PriceChart.tsx
 */

import { supabase } from "@/integrations/supabase/client";

// Tipo para os pontos retornados no histórico
export interface PriceHistoryPoint {
  time: string;
  price: number;
}

/**
 * Busca o histórico de preços do Bitcoin para diferentes períodos de tempo.
 * Tenta primeiro via Supabase Edge Function, com fallback para CoinCap e CoinMarketCap.
 *
 * @param range Período desejado ('1D', '7D', '1M', '1Y', 'ALL')
 * @returns Lista de pontos [{ time, price }]
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL'
): Promise<PriceHistoryPoint[]> => {
  console.log(`[fetchBitcoinPriceHistory] Chamando função Edge com range=${range}`);
  const { data, error } = await supabase.functions.invoke("get-bitcoin-history", {
    body: { range }
  });

  if (error) {
    console.error("Erro na função Edge:", error);
    throw new Error("Erro ao buscar dados do histórico");
  }

  if (!Array.isArray(data)) {
    console.error("Formato inválido da resposta da Edge Function:", data);
    throw new Error("Dados inválidos recebidos da função Edge");
  }

  console.log("Dados da Edge Function:", data.slice(0, 5)); // debug dos 5 primeiros
  return data;
};

/**
 * Fallback: Busca histórico diretamente da CoinCap API
 */
async function fetchDirectFromCoinCap(
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL'
): Promise<PriceHistoryPoint[]> {
  const apiKey = import.meta.env.VITE_COINCAP_API_KEY;
  if (!apiKey) throw new Error("VITE_COINCAP_API_KEY não definida no .env");

  const now = Date.now();
  const intervals: Record<string, { interval: string; start: number }> = {
    '1D': { interval: 'm5', start: now - 1 * 86400000 },
    '7D': { interval: 'h2', start: now - 7 * 86400000 },
    '1M': { interval: 'h12', start: now - 30 * 86400000 },
    '1Y': { interval: 'd1', start: now - 365 * 86400000 },
    'ALL': { interval: 'd1', start: 1367107200000 }
  };

  const { interval, start } = intervals[range];
  const url = `https://api.coincap.io/v2/assets/bitcoin/history?interval=${interval}&start=${start}&end=${now}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro CoinCap (${response.status}): ${error}`);
  }

  const json = await response.json();
  const rawPoints = json?.data ?? [];

  return rawPoints.map((item: { time: number; priceUsd: string }) => {
    const date = new Date(item.time);
    let timeLabel: string;

    if (range === '1D') {
      timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D' || range === '1M') {
      timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      timeLabel = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
    }

    return {
      time: timeLabel,
      price: parseFloat(parseFloat(item.priceUsd).toFixed(2))
    };
  });
}

/**
 * Fallback final: CoinMarketCap
 * Retorna pontos simulados baseados no preço atual
 */
async function fetchFromCoinMarketCapFallback(
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL'
): Promise<PriceHistoryPoint[]> {
  try {
    const apiKey = import.meta.env.VITE_CMC_API_KEY;
    if (!apiKey) throw new Error("VITE_CMC_API_KEY não definida");

    const res = await fetch(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD",
      {
        headers: {
          "X-CMC_PRO_API_KEY": apiKey
        }
      }
    );

    if (!res.ok) throw new Error(`CoinMarketCap status: ${res.status}`);
    const data = await res.json();

    const currentPrice = data?.data?.BTC?.quote?.USD?.price;
    if (!currentPrice) throw new Error("Resposta inesperada da CoinMarketCap");

    return generateSimulatedPoints(range, currentPrice, new Date());
  } catch (error) {
    console.error("Falha total ao buscar dados:", error);
    return [{ time: "Erro", price: 0 }];
  }
}

/**
 * Gera dados simulados caso nenhuma API funcione
 */
function generateSimulatedPoints(
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL',
  currentPrice: number,
  now: Date
): PriceHistoryPoint[] {
  const count = {
    '1D': 24,
    '7D': 7,
    '1M': 30,
    '1Y': 12,
    'ALL': 10
  }[range] || 10; // Valor padrão para garantir um valor válido

  const points: PriceHistoryPoint[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    const variation = 0.9 + Math.random() * 0.2;
    const price = parseFloat((currentPrice * variation).toFixed(2));

    if (range === '1D') {
      date.setHours(now.getHours() - (count - i));
    } else if (range === '7D' || range === '1M') {
      date.setDate(now.getDate() - (count - i));
    } else if (range === '1Y') {
      date.setMonth(now.getMonth() - (count - i));
    } else {
      date.setFullYear(now.getFullYear() - (count - i));
    }

    let timeLabel;
    if (range === '1D') {
      timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D' || range === '1M') {
      timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      timeLabel = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
    }

    points.push({ time: timeLabel, price });
  }

  return points;
}
