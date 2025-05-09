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

// Tipo que representa cada ponto no gráfico de preço
export interface PriceHistoryPoint {
  time: string;   // Label formatado para o eixo X
  price: number;  // Preço convertido
}

/**
 * Formata a label (rótulo) do gráfico conforme o range selecionado
 */
function formatLabelFromTimestamp(timestamp: string, range: string): string {
  const date = new Date(timestamp);

  // Para 1D e 7D, mostrar data + hora
  if (range === '1D' || range === '7D') {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }) + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Para demais períodos, só a data
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

/**
 * Função principal que busca o histórico de preço do Bitcoin
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM',
  currency: 'USD' | 'BRL' = 'USD',
  startDate?: Date,
  endDate?: Date
): Promise<PriceHistoryPoint[]> => {
  try {
    // Calcula a data de início com base no range selecionado
    const startDateCalc = new Date();
    if (range === '1D') startDateCalc.setDate(startDateCalc.getDate() - 1);
    else if (range === '7D') startDateCalc.setDate(startDateCalc.getDate() - 7);
    else if (range === '1M') startDateCalc.setDate(startDateCalc.getDate() - 30);
    else if (range === '3M') startDateCalc.setDate(startDateCalc.getDate() - 90);
    else if (range === 'YTD') {
      startDateCalc.setMonth(0);
      startDateCalc.setDate(1);
    }
    else if (range === '1Y') startDateCalc.setFullYear(startDateCalc.getFullYear() - 1);

    // Usa as datas personalizadas no caso de CUSTOM
    const useStartDate = range === 'CUSTOM' && startDate ? startDate : startDateCalc;
    let finalEndDate = range === 'CUSTOM' && endDate ? endDate : new Date(); // Agora = hoje
    finalEndDate = new Date(); // ← garante que traga até agora, não só até 23:59

    // ISO strings para o Supabase
    const startDateISO = useStartDate.toISOString();
    const endDateISO = finalEndDate.toISOString();

    // Diferença em dias
    const diffTime = Math.abs(finalEndDate.getTime() - useStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Usa tabela longa se o período for 1Y+, YTD, ALL ou diff > 120 dias
    const useLongTermTable = ['1Y', 'YTD', 'ALL'].includes(range) || diffDays > 120;

    // ----------------------------------------
    // 🔹 TABELA btc_prices (dados diários longos)
    // ----------------------------------------
    if (useLongTermTable) {
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price, price_brl')
        .order('timestamp', { ascending: true });

      if (range !== 'ALL') {
        query = query
          .gte('timestamp', startDateISO)
          .lte('timestamp', endDateISO);
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

    // ----------------------------------------
    // 🔹 TABELA btc_intraday_prices (dados curtos)
    // ----------------------------------------
    const { data, error } = await supabase
      .from('btc_intraday_prices')
      .select('timestamp, price, price_brl')
      .gte('timestamp', startDateISO)
      .lte('timestamp', endDateISO)
      .order('timestamp', { ascending: true });

    if (error) throw new Error(`Erro Supabase (btc_intraday_prices): ${error.message}`);
    if (!data) return [];

    // ----------------------------------------
    // 🔹 GRANULARIDADE personalizada
    // ----------------------------------------
    let filteredData = data;

    if (diffDays <= 1) {
      // 🔸 1D → 5 em 5 minutos
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        return date.getMinutes() % 5 === 0;
      });
    } else if (diffDays <= 7) {
      // 🔸 7D → 1 ponto por hora
      const seenHours = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.toDateString()}-${date.getHours()}`;
        if (seenHours.has(key)) return false;
        seenHours.add(key);
        return true;
      });
    } else {
      // 🔸 1M, 3M → 1 ponto por dia (último conhecido)
      const seenDays = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (seenDays.has(key)) return false;
        seenDays.add(key);
        return true;
      });
    }

    // Ajusta o tipo de formatação para o label
    const formatRangeType = range === 'CUSTOM'
      ? (diffDays > 30 ? '1Y' : diffDays > 7 ? '1M' : diffDays > 1 ? '7D' : '1D')
      : range;

    return filteredData.map(row => {
      const price = currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;
      return {
        time: formatLabelFromTimestamp(row.timestamp, formatRangeType),
        price: parseFloat(price.toFixed(2)),
      };
    });

  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    return [];
  }
};
