
/**
 * Serviço para buscar histórico de preços do Bitcoin
 *
 * Este módulo contém funções para obter o histórico
 * de preços do Bitcoin em diferentes intervalos de tempo,
 * através do Supabase (períodos longos) ou webhook n8n (períodos recentes).
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
 * - Para períodos longos ('1Y', 'ALL'): Usa a tabela btc_prices do Supabase
 * - Para períodos recentes ('1D', '7D', '1M'): Usa webhook do n8n para dados dinâmicos
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
    if (range === '1Y' || range === 'ALL') {
      // 1. Consultar tabela Supabase 'btc_prices' para períodos longos
      console.log(`Buscando dados do Supabase para ${range}`);
      
      let query = supabase
        .from('btc_prices')
        .select('timestamp, price')
        .order('timestamp', { ascending: true });
      
      // Filtrar por período se for 1Y
      if (range === '1Y') {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        query = query.gte('timestamp', oneYearAgo.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erro ao buscar dados do Supabase:", error);
        throw new Error('Erro ao buscar dados do Supabase');
      }
      
      if (!data || data.length === 0) {
        console.warn("Nenhum dado encontrado no Supabase para", range);
        throw new Error('Nenhum dado encontrado no Supabase');
      }

      console.log(`Recebidos ${data.length} registros do Supabase`);
      
      return data.map(row => ({
        time: formatLabelFromTimestamp(row.timestamp, range),
        price: parseFloat((row.price || 0).toFixed(2))
      }));
    } else {
      // 2. Consultar Webhook dinâmico para dados recentes (1D, 7D, 1M)
      // Agora enviando também o parâmetro currency para o webhook
      console.log(`Consultando webhook para dados recentes: ${range} em ${currency}`);
      const url = `https://workflows.marcolinofernades.site/webhook-test/bitcoin-precos?range=${range}&currency=${currency}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Erro na resposta do webhook: ${res.status} ${res.statusText}`);
        throw new Error(`Erro ao consultar Webhook (${res.status})`);
      }
      
      const data = await res.json();
      console.log(`Recebidos ${data.length} pontos do webhook`);
      
      // Garante que os dados estejam no formato correto
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error("Falha ao buscar histórico de preços:", error);
    
    // Retorna array vazio em caso de erro para evitar quebra do aplicativo
    return [];
  }
};
