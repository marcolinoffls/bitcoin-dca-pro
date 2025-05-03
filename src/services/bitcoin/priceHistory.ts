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

// Tipo que representa cada ponto no gráfico de preço
export interface PriceHistoryPoint {
  time: string;   // Rótulo formatado para o eixo X
  price: number;  // Preço convertido e formatado
}
/**
 * Formata a label do gráfico de acordo com o período selecionado
 */
function formatLabelFromTimestamp(timestamp: string, range: string): string {
  const date = new Date(timestamp);

  // Exibe hora e minuto (ex: "14:30")
  if (range === '1D') {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Exibe data + hora (ex: "03/05 18:00")
  if (range === '7D') {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Exibe data (ex: "05/05") para períodos de 1 mês, 3 meses e YTD
  if (range === '1M' || range === '3M' || range === 'YTD') {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  // Exibe mês/ano (ex: "05/24") no gráfico de 1 ano
  if (range === '1Y') {
    return date.toLocaleDateString('pt-BR', {
      month: '2-digit',
      year: '2-digit',
    });
  }

  // Exibe data completa (ex: "05/05/2021") no gráfico ALL
  return date.toLocaleDateString('pt-BR', {
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Busca dados históricos de preço do Bitcoin com base no range e moeda
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL',
  currency: 'USD' | 'BRL' = 'USD'
): Promise<PriceHistoryPoint[]> => {
  try {
    const startDate = new Date();
  
    if (range === '1D') startDate.setDate(startDate.getDate() - 1);
    else if (range === '7D') startDate.setDate(startDate.getDate() - 7);
    else if (range === '1M') startDate.setDate(startDate.getDate() - 30);
    else if (range === '3M') startDate.setDate(startDate.getDate() - 90);
    else if (range === 'YTD') {
      startDate.setMonth(0); // Janeiro
      startDate.setDate(1);  // Dia 1
    }
    else if (range === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);
  
    const startDateISO = startDate.toISOString(); // Formato usado pelo Supabase

    // Longo prazo: tabela `btc_prices`
    if (['1Y', 'YTD', 'ALL'].includes(range)) {
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price, price_brl')
        .order('timestamp', { ascending: true });
  
      // Aplica filtro de data exceto para "ALL"
      if (range !== 'ALL') {
        query = query.gte('timestamp', startDateISO);
      }
  
      const { data, error } = await query;
      if (error) throw new Error(`Erro Supabase (btc_prices): ${error.message}`);
      if (!data) return [];
  
      // Mapeia os dados com labels formatados
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
      // Um ponto a cada 15 minutos
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        return date.getMinutes() % 15 === 0;
      });
    }
  
    else if (range === '7D') {
      // Um ponto por hora (remove duplicatas)
      const seenHours = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.toDateString()}-${date.getHours()}`;
        if (seenHours.has(key)) return false;
        seenHours.add(key);
        return true;
      });
    }
  
    else if (range === '1M') {
      // Apenas dados diários às 05:55 (ajustado para base de dados CoinStats)
      const seenDays = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (seenDays.has(key)) return false;
        seenDays.add(key);
        return date.getHours() === 5 && date.getMinutes() === 55;
      });
    }
    else if (range === '3M') {
      const seenDays = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (seenDays.has(key)) return false;
        seenDays.add(key);
        return date.getHours() === 5 && date.getMinutes() === 55;
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
