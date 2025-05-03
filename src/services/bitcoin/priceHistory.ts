/**
 * Serviço para buscar histórico de preços do Bitcoin
 *
 * Estratégia:
 * - Curto prazo (1D, 7D, 1M): usa tabela `btc_intraday_prices`
 * - Longo prazo (1Y, ALL): usa tabela `btc_prices`
 * 
 * Os preços são retornados com base na moeda selecionada (USD ou BRL).
 */

import { supabase } from "@/integrations/supabase/client";

// Tipo do ponto no gráfico
export interface PriceHistoryPoint {
  time: string;   // label no gráfico (data/hora formatada)
  price: number;  // valor do preço
}

/**
 * Formata a label de data/hora conforme o período selecionado
 */
function formatLabelFromTimestamp(timestamp: string, range: string): string {
  const date = new Date(timestamp);

  if (range === '1D') {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (range === '7D') {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  } else if (range === '1M') {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }
}

/**
 * Busca o histórico de preços para o gráfico
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL',
  currency: 'USD' | 'BRL' = 'USD'
): Promise<PriceHistoryPoint[]> => {
  console.log(`[fetchBitcoinPriceHistory] Buscando histórico para range=${range}, currency=${currency}`);

  try {
    // Data inicial de filtro
    const startDate = new Date();
    if (range === '1D') startDate.setDate(startDate.getDate() - 1);
    else if (range === '7D') startDate.setDate(startDate.getDate() - 7);
    else if (range === '1M') startDate.setDate(startDate.getDate() - 30);
    else if (range === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);

    const startDateISO = startDate.toISOString();

    // --- LONGO PRAZO: tabela btc_prices ---
    if (range === '1Y' || range === 'ALL') {
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price, price_brl')
        .order('timestamp', { ascending: true });

      if (range === '1Y') {
        query = query.gte('timestamp', startDateISO);
      }

      const { data, error } = await query;

      if (error) throw new Error(`Erro Supabase (btc_prices): ${error.message}`);
      if (!data || data.length === 0) throw new Error('Sem dados históricos (btc_prices)');

      return data.map(row => {
        const price = currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;
        return {
          time: formatLabelFromTimestamp(row.timestamp, range),
          price: parseFloat(price.toFixed(2))
        };
      });
    }

    // --- CURTO PRAZO: tabela btc_intraday_prices ---
    const { data, error } = await supabase
      .from('btc_intraday_prices')
      .select('timestamp, price, price_brl')
      .gte('timestamp', startDateISO)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(`Erro Supabase (btc_intraday_prices): ${error.message}`);
    if (!data || data.length === 0) throw new Error('Sem dados recentes (btc_intraday_prices)');

    // Aplica filtro por intervalo:
    const filteredData = data.filter(row => {
      const date = new Date(row.timestamp);
      const minutes = date.getMinutes();
      const hours = date.getHours();

      if (range === '1D') return minutes % 15 === 0;              // Cada 15 minutos
      if (range === '7D') return hours % 6 === 0 && minutes === 0; // a cada 6h
      if (range === '1M') return hours === 0 && minutes === 0;    // Meia-noite (diário)
      return true;
    });

    return filteredData.map(row => {
      const price = currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;
      return {
        time: formatLabelFromTimestamp(row.timestamp, range),
        price: parseFloat(price.toFixed(2))
      };
    });

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }
};
