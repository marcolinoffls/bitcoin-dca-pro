/**
 * Serviço responsável por buscar o histórico de preços do Bitcoin
 * Ordem de tentativa das APIs:
 * 1. CoinGecko (principal)
 * 2. CoinMarketCap (primeiro fallback)
 * 3. CoinStats (segundo fallback)
 * 4. Dados simulados (último recurso)
 */
import { TimeRange, PriceHistoryPoint } from './types';

/**
 * Mapeia os períodos do nosso app para os períodos aceitos pela CoinStats
 */
const coinStatsPeriodsMap: Record<TimeRange, string> = {
  '1D': '24h',
  '7D': '7d',
  '1M': '30d',
  '1Y': '1y',
  'ALL': 'all'
};

/**
 * Tenta buscar dados do histórico via CoinStats
 * @param range Período desejado (1D, 7D, etc)
 * @returns Array de pontos formatados ou null em caso de erro
 */
async function fetchFromCoinStats(range: TimeRange): Promise<PriceHistoryPoint[] | null> {
  try {
    const period = coinStatsPeriodsMap[range];
    const apiKey = import.meta.env.VITE_COINSTATS_API_KEY;
    
    if (!apiKey) {
      console.error('CoinStats API key não encontrada');
      return null;
    }

    const response = await fetch(
      `https://api.coinstats.app/public/v1/charts?period=${period}&coinId=bitcoin`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-KEY': apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`CoinStats respondeu com status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data?.chart)) {
      throw new Error('Estrutura de dados inválida da CoinStats');
    }

    // Formata os dados no padrão esperado pelo gráfico
    return data.chart.map(([timestamp, price]) => {
      const date = new Date(timestamp * 1000); // CoinStats usa timestamp em segundos
      
      let timeLabel;
      if (range === '1D') {
        timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else if (range === '7D' || range === '1M') {
        timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else {
        timeLabel = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
      }
      
      return {
        time: timeLabel,
        price: parseFloat(price.toFixed(2)),
      };
    });
  } catch (error) {
    console.error('Erro ao buscar dados da CoinStats:', error);
    return null;
  }
}

/**
 * Gera pontos simulados para o gráfico quando todas as APIs falham
 */
const generateSimulatedPoints = (
  range: TimeRange,
  currentPrice: number,
  now: Date
): PriceHistoryPoint[] => {
  // Define quantos pontos gerar baseado no período
  const pointsCount = {
    '1D': 24,       // 24 pontos para 1 dia
    '7D': 7,        // 7 pontos para 7 dias
    '1M': 30,       // 30 pontos para 1 mês
    '1Y': 12,       // 12 pontos para 1 ano
    'ALL': 10,      // 10 pontos para histórico completo
  }[range];
  
  const points: PriceHistoryPoint[] = [];
  
  for (let i = 0; i < pointsCount; i++) {
    const randomVariation = 0.9 + Math.random() * 0.2;
    const simulatedPrice = currentPrice * randomVariation;
    const simulatedDate = new Date(now);
    
    if (range === '1D') {
      simulatedDate.setHours(now.getHours() - (pointsCount - i));
    } else if (range === '7D') {
      simulatedDate.setDate(now.getDate() - (pointsCount - i));
    } else if (range === '1M') {
      simulatedDate.setDate(now.getDate() - (pointsCount - i));
    } else if (range === '1Y') {
      simulatedDate.setMonth(now.getMonth() - (pointsCount - i));
    } else {
      simulatedDate.setFullYear(now.getFullYear() - (pointsCount - i));
    }
    
    let timeLabel;
    if (range === '1D') {
      timeLabel = simulatedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D' || range === '1M') {
      timeLabel = simulatedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      timeLabel = simulatedDate.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
    }
    
    points.push({
      time: timeLabel,
      price: parseFloat(simulatedPrice.toFixed(2)),
    });
  }
  
  return points;
};

/**
 * Função auxiliar que tenta fazer uma requisição sem especificar o intervalo
 */
async function fetchWithoutInterval(days: number | "max"): Promise<PriceHistoryPoint[]> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data?.prices || !Array.isArray(data.prices)) {
      throw new Error("Estrutura de dados inválida da CoinGecko");
    }
    
    let periodType: TimeRange;
    if (days === 1) {
      periodType = '1D';
    } else if (typeof days === 'number' && days <= 7) {
      periodType = '7D';
    } else if (typeof days === 'number' && days <= 30) {
      periodType = '1M';
    } else if (typeof days === 'number' && days <= 365) {
      periodType = '1Y';
    } else {
      periodType = 'ALL';
    }
    
    return data.prices.map(([timestamp, price]: [number, number]) => {
      const date = new Date(timestamp);
      
      let timeLabel;
      if (periodType === '1D') {
        timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else if (periodType === '7D' || periodType === '1M') {
        timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else {
        timeLabel = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
      }
      
      return {
        time: timeLabel,
        price: parseFloat(price.toFixed(2)),
      };
    });
  } catch (error) {
    throw error; // Propaga o erro para ser tratado na função principal
  }
}

/**
 * Função principal que busca o histórico de preços do Bitcoin
 * Tenta diferentes APIs em sequência e possui fallback para dados simulados
 */
export const fetchBitcoinPriceHistory = async (range: TimeRange): Promise<PriceHistoryPoint[]> => {
  try {
    console.log(`Buscando histórico do Bitcoin (período: ${range})`);
    
    // 1. Primeira tentativa: CoinGecko com intervalo específico
    try {
      const daysMap = {
        '1D': 1,
        '7D': 7,
        '1M': 30,
        '1Y': 365,
        'ALL': 'max'
      };
      
      const days = daysMap[range];
      let interval;
      
      // Define o intervalo baseado no período
      if (range === '1D') {
        interval = 'minutely';
      } else if (range === '7D' || range === '1M') {
        interval = 'hourly';
      } else {
        interval = 'daily';
      }
      
      console.log(`Tentando CoinGecko (days=${days}, interval=${interval})`);
      
      const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}${interval ? `&interval=${interval}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data?.prices && Array.isArray(data.prices)) {
          console.log(`Sucesso! CoinGecko retornou ${data.prices.length} pontos`);
          
          return data.prices.map(([timestamp, price]: [number, number]) => {
            const date = new Date(timestamp);
            
            let timeLabel;
            if (range === '1D') {
              timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            } else if (range === '7D' || range === '1M') {
              timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            } else {
              timeLabel = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
            }
            
            return {
              time: timeLabel,
              price: parseFloat(price.toFixed(2)),
            };
          });
        }
      }
      
      // Se chegou aqui, algo deu errado com o intervalo específico
      const errorData = await response.json();
      console.log('CoinGecko respondeu com erro:', errorData);
      
      if (errorData?.status?.error_message?.includes("interval=")) {
        console.log("Tentando novamente sem especificar intervalo");
        return await fetchWithoutInterval(days);
      }
      
      throw new Error(`CoinGecko falhou: ${response.status}`);
    } catch (geckoError) {
      console.error("Falha completa na CoinGecko:", geckoError);
      throw geckoError; // Propaga para próximo fallback
    }
  } catch (error) {
    console.error("CoinGecko falhou, tentando CoinMarketCap...");
    
    // 2. Segunda tentativa: CoinMarketCap (preço atual + simulação)
    try {
      const coinMarketCapApiKey = import.meta.env.VITE_CMC_API_KEY;
      
      if (!coinMarketCapApiKey) {
        throw new Error("CoinMarketCap API key não encontrada");
      }
      
      const response = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC&convert=USD",
        {
          headers: {
            'X-CMC_PRO_API_KEY': coinMarketCapApiKey,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`CoinMarketCap falhou: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data?.data?.BTC?.quote?.USD) {
        throw new Error("Dados inválidos da CoinMarketCap");
      }
      
      const currentPrice = data.data.BTC.quote.USD.price;
      
      // 3. Terceira tentativa: CoinStats
      console.log("CoinMarketCap obteve apenas preço atual, tentando CoinStats...");
      const coinStatsData = await fetchFromCoinStats(range);
      
      if (coinStatsData) {
        console.log("Sucesso! Usando dados da CoinStats");
        return coinStatsData;
      }
      
      // 4. Último recurso: Gerar dados simulados
      console.log("Todas as APIs falharam, gerando dados simulados...");
      return generateSimulatedPoints(range, currentPrice, new Date());
      
    } catch (finalError) {
      console.error("Todas as tentativas falharam:", finalError);
      return [{ time: "Erro na API", price: 0 }];
    }
  }
};
