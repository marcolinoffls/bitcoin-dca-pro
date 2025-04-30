
/**
 * Serviço para buscar cotação atual do Bitcoin
 * 
 * Este módulo contém funções para obter:
 * - Cotação atual em USD e BRL
 * - Variações de preço em diferentes períodos
 * 
 * É usado principalmente nos componentes:
 * - CurrentRateCard
 * - StatisticsCards
 */
import { CurrentRate, PriceVariation } from "@/types";

/**
 * Função para buscar a cotação atual do Bitcoin.
 * Tenta primeiro pela API da CoinGecko, se falhar tenta a CoinMarketCap.
 * 
 * @returns Cotação atual do Bitcoin em USD e BRL, e timestamp da última atualização.
 */
export const fetchCurrentBitcoinRate = async (): Promise<CurrentRate> => {
  try {
    // Primeiro tenta buscar dados da API CoinGecko
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_last_updated_at=true"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.bitcoin || typeof data.bitcoin.usd !== 'number' || typeof data.bitcoin.brl !== 'number') {
      console.error("CoinGecko API returned unexpected data structure:", data);
      throw new Error("Invalid data structure received from CoinGecko");
    }

    return {
      usd: data.bitcoin.usd,
      brl: data.bitcoin.brl,
      timestamp: new Date(data.bitcoin.last_updated_at * 1000)
    };
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);

    try {
      // Se falhar, tenta buscar na CoinMarketCap
      const coinMarketCapApiKey = import.meta.env.VITE_CMC_API_KEY; // Sua chave deve estar no .env
      const response = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD,BRL",
        {
          headers: {
            'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinMarketCap API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || !data.data.BTC || !data.data.BTC.quote) {
        console.error("CoinMarketCap API returned unexpected data structure:", data);
        throw new Error("Invalid data structure received from CoinMarketCap");
      }

      return {
        usd: data.data.BTC.quote.USD.price,
        brl: data.data.BTC.quote.BRL.price,
        timestamp: new Date(data.data.BTC.last_updated)
      };
    } catch (fallbackError) {
      console.error("Error fetching from CoinMarketCap:", fallbackError);

      // Retorna valores padrão em caso de falha geral
      return {
        usd: 0,
        brl: 0,
        timestamp: new Date()
      };
    }
  }
};

/**
 * Função para buscar as variações de preço do Bitcoin.
 * Tenta primeiro pela API da CoinGecko, se falhar tenta a CoinMarketCap.
 * 
 * @returns Variação percentual para 24h, 7 dias, 30 dias e 1 ano.
 */
export const fetchBitcoinPriceVariation = async (): Promise<PriceVariation> => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.market_data) {
      console.error("CoinGecko API returned unexpected data structure:", data);
      throw new Error("Invalid data structure received from CoinGecko");
    }

    const marketData = data.market_data;

    return {
      day: typeof marketData.price_change_percentage_24h === 'number' ? marketData.price_change_percentage_24h : 0,
      week: typeof marketData.price_change_percentage_7d === 'number' ? marketData.price_change_percentage_7d : 0,
      month: typeof marketData.price_change_percentage_30d === 'number' ? marketData.price_change_percentage_30d : 0,
      year: typeof marketData.price_change_percentage_1y === 'number' ? marketData.price_change_percentage_1y : 0,
      timestamp: new Date()
    };
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);

    try {
      const coinMarketCapApiKey = import.meta.env.VITE_CMC_API_KEY;
      const response = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD,BRL",
        {
          headers: {
            'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinMarketCap API respondeu com status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || !data.data.BTC || !data.data.BTC.quote) {
        console.error("CoinMarketCap API returned unexpected data structure:", data);
        throw new Error("Invalid data structure received from CoinMarketCap");
      }

      return {
        day: 0, // CoinMarketCap Free API não retorna todas essas métricas
        week: 0,
        month: 0,
        year: 0,
        timestamp: new Date(data.data.BTC.last_updated)
      };
    } catch (fallbackError) {
      console.error("Error fetching from CoinMarketCap:", fallbackError);

      // Retorna valores padrão
      return {
        day: 0,
        week: 0,
        month: 0,
        year: 0,
        timestamp: new Date()
      };
    }
  }
};
