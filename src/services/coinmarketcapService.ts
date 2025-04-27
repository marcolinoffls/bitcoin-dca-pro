
/**
 * Serviço para interagir com a API da CoinMarketCap
 * Centraliza todas as chamadas relacionadas à API
 */
import { supabase } from '@/integrations/supabase/client';

// Interface para a resposta da API do Fear & Greed Index
interface FearGreedResponse {
  data: {
    value: number;
    value_classification: string;
    timestamp: string;
  }[];
}

/**
 * Busca o Fear & Greed Index atual do Bitcoin
 * Utiliza a API da CoinMarketCap de forma segura através do Supabase
 */
export const fetchFearGreedIndex = async () => {
  try {
    // Busca os dados da API da CoinMarketCap via Supabase Edge Function
    const { data: response, error } = await supabase.functions.invoke<FearGreedResponse>(
      'fetch-fear-greed',
      {
        body: { },
      }
    );

    if (error) {
      console.error('Erro ao buscar Fear & Greed Index:', error);
      throw error;
    }

    if (!response || !response.data || response.data.length === 0) {
      throw new Error('Dados inválidos recebidos da API');
    }

    const fearGreedData = response.data[0];

    return {
      value: fearGreedData.value,
      valueText: fearGreedData.value_classification,
      timestamp: fearGreedData.timestamp
    };
  } catch (error) {
    console.error('Erro ao processar dados do Fear & Greed Index:', error);
    throw error;
  }
};
