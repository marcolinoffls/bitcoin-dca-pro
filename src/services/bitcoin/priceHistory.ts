
/**
 * Serviço para buscar histórico de preços do Bitcoin
 *
 * Este módulo contém funções para obter o histórico
 * de preços do Bitcoin em diferentes intervalos de tempo,
 * através do Supabase utilizando as tabelas btc_intraday_prices (períodos curtos)
 * e btc_prices (períodos longos).
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
 * Formata a label de data/hora baseada no timestamp e no período selecionado
 * 
 * @param timestamp String de data/hora em formato ISO
 * @param range Período selecionado ('1D', '7D', '1M', '1Y', 'ALL')
 * @returns String formatada para exibição no gráfico
 */
function formatLabelFromTimestamp(timestamp: string, range: string): string {
  const date = new Date(timestamp);
  
  if (range === '1D') {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } else if (range === '7D' || range === '1M') {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } else if (range === '1Y') {
    return date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
  } else {
    // ALL
    return date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
  }
}

/**
 * Busca o histórico de preços do Bitcoin para diferentes períodos de tempo.
 * 
 * Estratégia de dados:
 * - Para períodos recentes ('1D', '7D', '1M'): Consulta tabela btc_intraday_prices
 * - Para períodos longos ('1Y', 'ALL'): Consulta tabela btc_prices
 *
 * @param range Período desejado ('1D', '7D', '1M', '1Y', 'ALL')
 * @param currency Moeda para retornar os valores ('USD' ou 'BRL')
 * @returns Lista de pontos [{ time, price }]
 */
export const fetchBitcoinPriceHistory = async (
  range: '1D' | '7D' | '1M' | '1Y' | 'ALL',
  currency: 'USD' | 'BRL' = 'USD' // Padrão é USD se não for especificado
): Promise<PriceHistoryPoint[]> => {
  console.log(`[fetchBitcoinPriceHistory] Buscando histórico para range=${range}, currency=${currency}`);
  
  try {
    // Calcula a data de início com base no período solicitado
    const startDate = new Date();
    
    // Determina quantos dias subtrair baseado no período
    if (range === '1D') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (range === '7D') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '1M') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === '1Y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    // Para 'ALL', não precisamos filtrar por data
    
    // Converte para formato ISO para usar na consulta
    const startDateISO = startDate.toISOString();
    
    if (range === '1Y' || range === 'ALL') {
      // 1. Consultar tabela Supabase 'btc_prices' para períodos longos
      console.log(`Buscando dados históricos (${range}) da tabela btc_prices desde ${range === '1Y' ? startDateISO : 'o início'}`);
      
      // Inicia a consulta básica
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price')
        .order('timestamp', { ascending: true });
      
      // Se for 1Y, adiciona filtro de data
      if (range === '1Y') {
        query = query.gte('timestamp', startDateISO);
      }
      
      // Executa a consulta
      const { data, error } = await query;
      
      if (error) {
        console.error("Erro ao buscar dados do Supabase (btc_prices):", error);
        throw new Error('Erro ao buscar dados do Supabase');
      }
      
      if (!data || data.length === 0) {
        console.warn("Nenhum dado encontrado na tabela btc_prices para", range);
        throw new Error('Nenhum dado encontrado na tabela btc_prices');
      }

      console.log(`Recebidos ${data.length} registros da tabela btc_prices`);
      
      // Converte os dados para o formato esperado pelo gráfico
      // Se a moeda for BRL e temos o campo price_brl, usamos ele
      return data.map(row => {
        // Determina qual campo de preço usar baseado na moeda selecionada
        let price = row.price || 0;
        
        // Se existir preço em BRL na tabela e a moeda selecionada for BRL
        if (currency === 'BRL' && row.price_brl !== undefined && row.price_brl !== null) {
          price = row.price_brl;
        }
        
        return {
          time: formatLabelFromTimestamp(row.timestamp, range),
          price: parseFloat((price).toFixed(2))
        };
      });
    } else {
      // 2. Consultar tabela Supabase 'btc_intraday_prices' para dados recentes (1D, 7D, 1M)
      console.log(`Buscando dados recentes (${range}) da tabela btc_intraday_prices desde ${startDateISO}`);
      
      const { data, error } = await supabase
        .from('btc_intraday_prices')
        .select('timestamp, price, price_brl')
        .gte('timestamp', startDateISO)
        .order('timestamp', { ascending: true });
      
      if (error) {
        console.error("Erro ao buscar dados do Supabase (btc_intraday_prices):", error);
        throw new Error(`Erro ao consultar tabela btc_intraday_prices: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.warn("Nenhum dado encontrado na tabela btc_intraday_prices para", range);
        throw new Error('Nenhum dado encontrado na tabela btc_intraday_prices');
      }

      console.log(`Recebidos ${data.length} pontos da tabela btc_intraday_prices`);
      
      // Converte os dados para o formato esperado pelo gráfico
      return data.map(row => {
        // Determina qual campo de preço usar baseado na moeda selecionada
        let price = row.price || 0;
        
        // Se existir preço em BRL na tabela e a moeda selecionada for BRL
        if (currency === 'BRL' && row.price_brl !== undefined && row.price_brl !== null) {
          price = row.price_brl;
        }
        
        return {
          time: formatLabelFromTimestamp(row.timestamp, range),
          price: parseFloat((price).toFixed(2))
        };
      });
    }
  } catch (error) {
    console.error("Falha ao buscar histórico de preços:", error);
    
    // Retorna array vazio em caso de erro para evitar quebra do aplicativo
    return [];
  }
};
