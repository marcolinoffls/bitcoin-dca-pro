import { BitcoinEntry, CurrentRate, PriceVariation } from "@/types";

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
        throw new Error(`CoinMarketCap API responded with status: ${response.status}`);
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

/**
 * Calcula o total de Bitcoin acumulado em todos os aportes
 * 
 * @param entries Lista de aportes
 * @returns Quantidade total de Bitcoin
 */
export const calculateTotalBitcoin = (entries: BitcoinEntry[]): number => {
  return entries.reduce((total, entry) => total + entry.btcAmount, 0);
};

/**
 * Calcula o total investido em todos os aportes na moeda selecionada
 * 
 * Faz conversão se necessário (por exemplo BRL para USD).
 * 
 * @param entries Lista de aportes
 * @param selectedCurrency Moeda selecionada ('BRL' ou 'USD')
 * @param conversionRate Taxa de conversão entre BRL e USD
 * @returns Soma total do valor investido
 */
export const calculateTotalInvested = (
  entries: BitcoinEntry[],
  selectedCurrency: 'BRL' | 'USD',
  conversionRate: number
): number => {
  return entries.reduce((total, entry) => {
    // Se a moeda do aporte for diferente da moeda selecionada, realiza conversão
    if (entry.currency !== selectedCurrency) {
      return total + (entry.currency === 'USD'
        ? entry.amountInvested * (1 / conversionRate)
        : entry.amountInvested * conversionRate);
    }
    return total + entry.amountInvested;
  }, 0);
};

/**
 * Calcula a variação percentual entre duas taxas
 * 
 * Fórmula aplicada:
 * (taxaAtual - taxaCompra) / taxaCompra × 100
 * 
 * Indica se o preço subiu ou caiu desde a compra.
 * 
 * @param buyRate Valor de compra
 * @param currentRate Valor atual
 * @returns Percentual de variação (positivo ou negativo)
 */
export const calculatePercentageChange = (buyRate: number, currentRate: number): number => {
  return ((currentRate - buyRate) / buyRate) * 100;
};

/**
 * Calcula o preço médio ponderado de compra por valor investido
 * 
 * Fórmula aplicada:
 * (cotacao₁ × valorInvestido₁ + cotacao₂ × valorInvestido₂ + ...) / (valorInvestido₁ + valorInvestido₂ + ...)
 * 
 * @param entries Lista de aportes
 * @param period Período de filtro ('month', 'year' ou 'all')
 * @returns Preço médio ponderado
 */
export const calculateAverageByPeriod = (
  entries: BitcoinEntry[],
  period: 'month' | 'year' | 'all'
): number => {
  if (entries.length === 0) return 0;

  const now = new Date();
  let filteredEntries = entries;

  if (period === 'month') {
    filteredEntries = entries.filter(
      (entry) => entry.date.getMonth() === now.getMonth() && entry.date.getFullYear() === now.getFullYear()
    );
  } else if (period === 'year') {
    filteredEntries = entries.filter(
      (entry) => entry.date.getFullYear() === now.getFullYear()
    );
  }

  if (filteredEntries.length === 0) return 0;

  let totalInvested = 0;
  let weightedExchangeRateSum = 0;

  filteredEntries.forEach(entry => {
    totalInvested += entry.amountInvested;
    weightedExchangeRateSum += entry.exchangeRate * entry.amountInvested;
  });

  return totalInvested > 0 ? weightedExchangeRateSum / totalInvested : 0;
};
