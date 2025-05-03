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

export interface PriceHistoryPoint {
  time: string;   // Label do gráfico
  price: number;  // Preço convertido
}

/**
 * Formata a label do gráfico de acordo com o período selecionado
 */
function formatLabelFromTimestamp(timestamp: string, range: string): string {
  const date = new Date(timestamp);

  if (range === '1D') {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (range === '7D') {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (range === '1M') {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    return date.toLocaleDateString('pt-BR', {
      month: '2-digit',
      year: '2-digit',
    });
  }
}

/**
 * Busca dados históricos de preço do Bitcoin com base no range e moeda
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL',
  currency: 'USD' | 'BRL' = 'USD'
): Promise<PriceHistoryPoint[]> => {
  try {
    const startDate = new Date();
    if (range === '1D') startDate.setDate(startDate.getDate() - 1);
    else if (range === '7D') startDate.setDate(startDate.getDate() - 7);
    else if (range === '1M') startDate.setDate(startDate.getDate() - 30);
    else if (range === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);

    const startDateISO = startDate.toISOString();

    // Longo prazo: tabela `btc_prices`
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
      if (!data) return [];

      return data.map(row => {
        const price = currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;
        return {
          time: formatLabelFromTimestamp(row.timestamp, range),
          price: parseFloat(price.toFixed(2)),
        };
      });
    }

    // Curto prazo: tabela `btc_intraday_prices`
    const { data, error } = await supabase
      .from('btc_intraday_prices')
      .select('timestamp, price, price_brl')
      .gte('timestamp', startDateISO)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(`Erro Supabase (btc_intraday_prices): ${error.message}`);
    if (!data) return [];

    // Filtra os dados por granularidade:
    let filteredData = data;

    if (range === '1D') {
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        return date.getMinutes() % 15 === 0;
      });
    } else if (range === '7D') {
      // Um ponto por hora baseado na hora
      const seenHours = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        if (seenHours.has(key)) return false;
        seenHours.add(key);
        return true;
      });
    } else if (range === '1M') {
      const seenHours = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        if (date.getHours() % 6 !== 0 || date.getMinutes() !== 0) return false;
        if (seenHours.has(key)) return false;
        seenHours.add(key);
        return true;
      });
    }

    return filteredData.map(row => {
      const price = currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;
      return {
        time: formatLabelFromTimestamp(row.timestamp, range),
        price: parseFloat(price.toFixed(2)),
      };
    });

  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    return [];
  }
};
