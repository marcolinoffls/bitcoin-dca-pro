/**
 * Serviço para buscar histórico de preços do Bitcoin
 *
 * Estratégia:
 * - Curto prazo (1D, 7D, 1M, 3M): usa tabela `btc_intraday_prices`
 * - Longo prazo (1Y, YTD, ALL ou >120 dias): usa tabela `btc_prices`
 *
 * Os preços são retornados com base na moeda selecionada (USD ou BRL).
 */

import { supabase } from "@/integrations/supabase/client";

// Representa um ponto de dado no gráfico
export interface PriceHistoryPoint {
  time: string;  // Label formatada para o eixo X
  price: number; // Preço numérico
}

/**
 * Formata timestamp com base no range selecionado
 */
function formatLabelFromTimestamp(timestamp: string, range: string): string {
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  if (range === '1D' || range === '7D') {
    const formattedTime = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${formattedDate} ${formattedTime}`;
  }

  return formattedDate;
}

/**
 * Busca histórico de preços com base no range, moeda e (opcionalmente) datas personalizadas
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM',
  currency: 'USD' | 'BRL' = 'USD',
  startDate?: Date,
  endDate?: Date
): Promise<PriceHistoryPoint[]> => {
  try {
    const now = new Date();
    const start = new Date(now); // base para cálculo

    switch (range) {
      case '1D': start.setDate(start.getDate() - 1); break;
      case '7D': start.setDate(start.getDate() - 7); break;
      case '1M': start.setDate(start.getDate() - 30); break;
      case '3M': start.setDate(start.getDate() - 90); break;
      case 'YTD': start.setMonth(0); start.setDate(1); break;
      case '1Y': start.setFullYear(start.getFullYear() - 1); break;
    }

    const finalStart = range === 'CUSTOM' && startDate ? startDate : start;
    const finalEnd = range === 'CUSTOM' && endDate ? endDate : now;
    finalEnd.setHours(23, 59, 59, 999); // pega até o fim do dia atual

    const startISO = finalStart.toISOString();
    const endISO = finalEnd.toISOString();

    const diffDays = Math.ceil(
      Math.abs(finalEnd.getTime() - finalStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const useLongTermTable = ['1Y', 'YTD', 'ALL'].includes(range) || diffDays > 120;

    // ----------------------------
    // LONGO PRAZO → btc_prices
    // ----------------------------
    if (useLongTermTable) {
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price, price_brl')
        .order('timestamp', { ascending: true });

      if (range !== 'ALL') {
        query = query.gte('timestamp', startISO).lte('timestamp', endISO);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      if (!data) return [];

      return data.map(row => {
        const price = currency === 'BRL' ? row.price_brl ?? row.price : row.price;
        return {
          time: formatLabelFromTimestamp(row.timestamp, range),
          price: parseFloat(price.toFixed(2))
        };
      });
    }

    // ----------------------------
    // CURTO PRAZO → btc_intraday_prices
    // ----------------------------
    const { data, error } = await supabase
      .from('btc_intraday_prices')
      .select('timestamp, price, price_brl')
      .gte('timestamp', startISO)
      .lte('timestamp', endISO)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(error.message);
    if (!data) return [];

    // Granularidade
    let filteredData = data;

    if (diffDays <= 1) {
      // 1D → a cada 5 minutos
      filteredData = data.filter(row => {
        const d = new Date(row.timestamp);
        return d.getMinutes() % 5 === 0;
      });
    } else if (diffDays <= 7) {
      // 7D → a cada 1 hora
      const seenHours = new Set<string>();
      filteredData = data.filter(row => {
        const d = new Date(row.timestamp);
        const key = `${d.toDateString()}-${d.getHours()}`;
        if (seenHours.has(key)) return false;
        seenHours.add(key);
        return true;
      });
    } else {
      // 1M e 3M → um ponto por dia (05:55)
      const seenDays = new Set<string>();
      filteredData = data.filter(row => {
        const d = new Date(row.timestamp);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (seenDays.has(key)) return false;
        seenDays.add(key);
        return d.getHours() === 5 && d.getMinutes() === 55;
      });
    }

    const rangeForLabel = range === 'CUSTOM'
      ? diffDays > 30 ? '1Y' : diffDays > 7 ? '1M' : diffDays > 1 ? '7D' : '1D'
      : range;

    return filteredData.map(row => {
      const price = currency === 'BRL' ? row.price_brl ?? row.price : row.price;
      return {
        time: formatLabelFromTimestamp(row.timestamp, rangeForLabel),
        price: parseFloat(price.toFixed(2))
      };
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de preço:', error);
    return [];
  }
};

