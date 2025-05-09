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

  // Para todos os períodos, usamos o mesmo formato base dd/MM/yy
  const dateFormatBase = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  // Para períodos de 1D e 7D, incluímos também a hora e minuto
  if (range === '1D' || range === '7D') {
    const timeFormat = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateFormatBase} ${timeFormat}`;
  }

  // Para todos os outros períodos (1M, 3M, YTD, 1Y, ALL, CUSTOM), retornamos apenas a data
  return dateFormatBase;
}

/**
 * Busca dados históricos de preço do Bitcoin com base no range e moeda
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM',
  currency: 'USD' | 'BRL' = 'USD',
  startDate?: Date,
  endDate?: Date
): Promise<PriceHistoryPoint[]> => {
  try {
    const startDateCalc = new Date();
  
    if (range === '1D') startDateCalc.setDate(startDateCalc.getDate() - 1);
    else if (range === '7D') startDateCalc.setDate(startDateCalc.getDate() - 7);
    else if (range === '1M') startDateCalc.setDate(startDateCalc.getDate() - 30);
    else if (range === '3M') startDateCalc.setDate(startDateCalc.getDate() - 90);
    else if (range === 'YTD') {
      startDateCalc.setMonth(0); // Janeiro
      startDateCalc.setDate(1);  // Dia 1
    }
    else if (range === '1Y') startDateCalc.setFullYear(startDateCalc.getFullYear() - 1);
  
    // Use as datas personalizadas se o range for CUSTOM
    const useStartDate = range === 'CUSTOM' && startDate ? startDate : startDateCalc;
    const useEndDate = range === 'CUSTOM' && endDate ? endDate : new Date();
    
    // Certifica-se de que as datas estão em ordem cronológica correta
    const finalStartDate = useStartDate > useEndDate ? useEndDate : useStartDate;
    const finalEndDate = useEndDate;
    
    const startDateISO = finalStartDate.toISOString(); // Formato usado pelo Supabase
    const endDateISO = finalEndDate.toISOString();

    // Calcula a diferença em dias entre as datas
    const diffTime = Math.abs(finalEndDate.getTime() - finalStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Decide qual tabela usar com base no período
    // Para períodos longos ou busca de mais de 120 dias, usa btc_prices
    const useLongTermTable = ['1Y', 'YTD', 'ALL'].includes(range) || diffDays > 120;

    if (useLongTermTable) {
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price, price_brl')
        .order('timestamp', { ascending: true });
  
      // Aplica filtro de data exceto para "ALL"
      if (range !== 'ALL') {
        query = query
          .gte('timestamp', startDateISO)
          .lte('timestamp', endDateISO);
      }
  
      const { data, error } = await query;
      if (error) throw new Error(`Erro Supabase (btc_prices): ${error.message}`);
      if (!data) return [];
  
      // Mapeia os dados com labels formatados
      const formattedData = data.map(row => {
        const price = currency === 'BRL' && row.price_brl != null ? row.price_brl : row.price;
        return {
          time: formatLabelFromTimestamp(row.timestamp, range === 'CUSTOM' ? (diffDays > 365 ? 'ALL' : '1Y') : range),
          price: parseFloat(price.toFixed(2)),
        };
      });
      
      return formattedData;
    }

    // Para períodos curtos, usa a tabela de preços intradiários
    const { data, error } = await supabase
      .from('btc_intraday_prices')
      .select('timestamp, price, price_brl')
      .gte('timestamp', startDateISO)
      .lte('timestamp', endDateISO)
      .order('timestamp', { ascending: true });
  
    if (error) throw new Error(`Erro Supabase (btc_intraday_prices): ${error.message}`);
    if (!data) return [];
  
    // Filtra os dados por granularidade com base no período
    let filteredData = data;
    
    // Determina a granularidade com base no tamanho do período
    if (diffDays <= 1) {
      // Um ponto a cada 15 minutos para períodos de até 1 dia
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        return date.getMinutes() % 15 === 0;
      });
    }
    else if (diffDays <= 7) {
      // Um ponto por hora para períodos de até 7 dias
      const seenHours = new Set<string>();
      filteredData = data.filter(row => {
        const date = new Date(row.timestamp);
        const key = `${date.toDateString()}-${date.getHours()}`;
        if (seenHours.has(key)) return false;
        seenHours.add(key);
        return true;
      });
    }
    else {
      // Um ponto por dia para períodos maiores
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
