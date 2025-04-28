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
 * Busca o histórico de preços do Bitcoin para diferentes períodos de tempo.
 * Utiliza a API CoinGecko com fallback para CoinMarketCap.
 * 
 * @param range Período desejado ('1D', '7D', '1M', '1Y', 'ALL')
 * @returns Array com os dados de preço formatados para o gráfico
 */
export const fetchBitcoinPriceHistory = async (range: '1D' | '7D' | '1M' | '1Y' | 'ALL') => {
  try {
    // Mapeia os períodos para os parâmetros aceitos pela API CoinGecko
    const daysMap = {
      '1D': 1,
      '7D': 7,
      '1M': 30,
      '1Y': 365,
      'ALL': 'max'
    };
    
    const days = daysMap[range]; 
    
    // Configura o intervalo adequado para cada período
    let interval = 'hourly';
    if (range === '1Y' || range === 'ALL') {
      interval = 'daily';
    } else if (range === '1M') {
      interval = 'daily';
    }
    
    // Faz a chamada para a API do CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=${interval}`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.prices || !Array.isArray(data.prices)) {
      console.error("CoinGecko API returned unexpected data structure:", data);
      throw new Error("Invalid data structure received from CoinGecko");
    }
    
    // Formata os dados para o formato esperado pelo gráfico
    const formattedData = data.prices.map(([timestamp, price]) => {
      const date = new Date(timestamp);
      
      // Formata o rótulo de tempo de acordo com o período
      let timeLabel;
      if (range === '1D') {
        timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else if (range === '7D') {
        timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else if (range === '1M') {
        timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else {
        timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      }
      
      return {
        time: timeLabel,
        price: parseFloat(price.toFixed(2)), // Limita a 2 casas decimais para melhor exibição
      };
    });
    
    return formattedData;
  } catch (error) {
    console.error("Error fetching from CoinGecko:", error);
    
    try {
      // Fallback para CoinMarketCap se CoinGecko falhar
      const coinMarketCapApiKey = import.meta.env.VITE_CMC_API_KEY;
      
      if (!coinMarketCapApiKey) {
        console.error("CoinMarketCap API key não definida!");
      }
      
      // Como a API do CoinMarketCap é limitada em sua versão gratuita,
      // e não permite buscar históricos detalhados sem assinatura,
      // retornamos dados baseados nos valores atuais
      
      // Busca dados atuais do Bitcoin
      const response = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD",
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
      
      // Como alternativa, geramos dados simulados baseados no preço atual
      const currentPrice = data.data.BTC.quote.USD.price;
      
      // Gera pontos de dados realistas baseados no preço atual
      const simulatedData = [];
      const now = new Date();
      
      // Número de pontos para cada período
      const pointsCount = range === '1D' ? 24 : range === '7D' ? 7 : range === '1M' ? 30 : range === '1Y' ? 12 : 5;
      
      // Variação máxima para simulação (%)
      const maxVariation = range === '1D' ? 2 : range === '7D' ? 8 : range === '1M' ? 15 : range === '1Y' ? 50 : 200;
      
      for (let i = 0; i < pointsCount; i++) {
        const simulatedDate = new Date(now);
        
        // Ajusta a data para o período
        if (range === '1D') {
          simulatedDate.setHours(now.getHours() - (pointsCount - i));
          
          // Gera um preço simulado com pequenas variações
          const variation = (Math.random() * maxVariation) * (Math.random() > 0.5 ? 1 : -1);
          const simulatedPrice = currentPrice * (1 + (variation / 100));
          
          simulatedData.push({
            time: simulatedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            price: parseFloat(simulatedPrice.toFixed(2))
          });
        } else if (range === '7D') {
          simulatedDate.setDate(now.getDate() - (pointsCount - i));
          
          const variation = (Math.random() * maxVariation) * (Math.random() > 0.5 ? 1 : -1);
          const simulatedPrice = currentPrice * (1 + (variation / 100));
          
          simulatedData.push({
            time: simulatedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            price: parseFloat(simulatedPrice.toFixed(2))
          });
        } else if (range === '1M') {
          simulatedDate.setDate(now.getDate() - ((pointsCount - i) * (30 / pointsCount)));
          
          const variation = (Math.random() * maxVariation) * (Math.random() > 0.5 ? 1 : -1);
          const simulatedPrice = currentPrice * (1 + (variation / 100));
          
          simulatedData.push({
            time: simulatedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            price: parseFloat(simulatedPrice.toFixed(2))
          });
        } else {
          // Para 1Y e ALL
          simulatedDate.setMonth(now.getMonth() - ((pointsCount - i) * (range === '1Y' ? 1 : 12)));
          
          const variation = (Math.random() * maxVariation) * (Math.random() > 0.5 ? 1 : -1);
          const simulatedPrice = currentPrice * (1 + (variation / 100));
          
          simulatedData.push({
            time: simulatedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            price: parseFloat(simulatedPrice.toFixed(2))
          });
        }
      }
      
      // Adiciona o último ponto com o preço atual
      simulatedData.push({
        time: range === '1D' ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
              now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        price: parseFloat(currentPrice.toFixed(2))
      });
      
      return simulatedData;
    } catch (fallbackError) {
      console.error("Erro no fallback para CoinMarketCap:", fallbackError);
      
      // Em último caso, retorna um conjunto mínimo de dados de exemplo para não quebrar o gráfico
      return [
        { time: "Erro", price: 0 }
      ];
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
