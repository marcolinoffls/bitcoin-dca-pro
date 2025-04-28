
/**
 * Serviço para buscar variações de preço do Bitcoin
 */
import { PriceVariation } from '@/types';

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
        throw new Error("Invalid data structure received from CoinMarketCap");
      }

      return {
        day: 0,
        week: 0,
        month: 0,
        year: 0,
        timestamp: new Date(data.data.BTC.last_updated)
      };
    } catch (fallbackError) {
      console.error("Error fetching from CoinMarketCap:", fallbackError);
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
