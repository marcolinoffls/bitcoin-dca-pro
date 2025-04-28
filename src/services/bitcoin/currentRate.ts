
/**
 * Serviço para buscar a cotação atual do Bitcoin
 */
import { CurrentRate } from '@/types';

export const fetchCurrentBitcoinRate = async (): Promise<CurrentRate> => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_last_updated_at=true"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.bitcoin || typeof data.bitcoin.usd !== 'number' || typeof data.bitcoin.brl !== 'number') {
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
        throw new Error(`CoinMarketCap API responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.data || !data.data.BTC || !data.data.BTC.quote) {
        throw new Error("Invalid data structure received from CoinMarketCap");
      }

      return {
        usd: data.data.BTC.quote.USD.price,
        brl: data.data.BTC.quote.BRL.price,
        timestamp: new Date(data.data.BTC.last_updated)
      };
    } catch (fallbackError) {
      console.error("Error fetching from CoinMarketCap:", fallbackError);
      return {
        usd: 0,
        brl: 0,
        timestamp: new Date()
      };
    }
  }
};
