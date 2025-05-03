/**
 * Serviço para buscar histórico de preços do Bitcoin
 *
 * Estratégia:
 * - Curto prazo (1D, 7D, 1M): usa tabela `btc_intraday_prices`
 * - Longo prazo (1Y, ALL): usa tabela `btc_prices`
 * 
 * Os preços são retornados com base na moeda selecionada (USD ou BRL).
 */

// Importa o cliente Supabase
import { supabase } from "@/integrations/supabase/client";

// Tipo de dado retornado para o gráfico
export interface PriceHistoryPoint {
  time: string;   // Label do eixo X no gráfico
  price: number;  // Valor do preço
}

/**
 * Formata o rótulo de data/hora para o eixo X do gráfico
 * conforme o intervalo de tempo selecionado
 */
function formatLabelFromTimestamp(timestamp: string, range: string): string {
  const date = new Date(timestamp);

  if (range === '1D') {
    // Exibe apenas hora:minuto
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (range === '7D') {
    // Exibe data + hora
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (range === '1M') {
    // Exibe apenas dia/mês
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  if (range === 'ALL') {
    // Exibe apenas o ano
    return date.getFullYear().toString();
  }

  // Default (1Y)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Busca os dados históricos de preço do Bitcoin com base no intervalo e moeda selecionada
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL',
  currency: 'USD' | 'BRL' = 'USD'
): Promise<PriceHistoryPoint[]> => {
  try {
    // Define a data de início para os filtros (menos em ALL)
    const startDate = new Date();
    if (range === '1D') startDate.setDate(startDate.getDate() - 1);
    else if (range === '7D') startDate.setDate(startDate.getDate() - 7);
    else if (range === '1M') startDate.setDate(startDate.getDate() - 30);
    else if (range === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);

    const startDateISO = startDate.toISOString();

    /**
     * INTERVALOS DE LONGO PRAZO (1Y, ALL) → usa tabela `btc_prices`
     */
    if (range === '1Y' || range === 'ALL') {
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price, price_brl')
        .order('timestamp', { ascending: true });

      // Aplica filtro apenas para 1Y
      if (range === '1Y') {
        query = query.gte('timestamp', startDateISO);
      }

      const { data, error } = await query;
      if (error) throw new Error(`Erro Supabase (btc_prices): ${error.message}`);
      if (!data) return [];

      // Se for ALL, filtra um ponto por mês
      let filteredData = data;
      if (range === 'ALL') {
        const seenMonths = new Set<string>();
        filteredData = data.filter(row => {
          const date = new Date(row.timestamp);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          if (seenMonths.has(key)) return false;
          seenMonths.add(key);
          return true;
        });
      }

      // Formata os dados
      return filteredData.map(row => {
        const price =
          currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;

        return {
          time: formatLabelFromTimestamp(row.timestamp, range),
          price: parseFloat(price.toFixed(2)),
        };
      });
    }

    /**
     * INTERVALOS DE CURTO PRAZO (1D, 7D, 1M) → usa tabela `btc_intraday_prices`
     */
    const { data, error } = await supabase
      .from('btc_intraday_prices')
      .select('timestamp, price, price_brl')
      .gte('timestamp', startDateISO)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(`Erro Supabase (btc_intraday_prices): ${error.message}`);
    if (!data) return [];

    // Aplica granularidade específica por range
    let filteredData = data;

    if (range === '1D') {
      // Exibe um ponto a cada 15 minutos
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        return date.getMinutes() % 15 === 0;
      });
    } else if (range === '7D') {
      // Exibe um ponto por hora (único por hora)
      const seenHours = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        if (seenHours.has(key)) return false;
        seenHours.add(key);
        return true;
      });
    } else if (range === '1M') {
      // Exibe um ponto por dia, apenas se for às 05:55 (ajustável)
      const seenDays = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (seenDays.has(key)) return false;
        seenDays.add(key);
        return date.getHours() === 5 && date.getMinutes() === 55;
      });
    }

    // Formata os dados finais
    return filteredData.map(row => {
      const price =
        currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;

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
