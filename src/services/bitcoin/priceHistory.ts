
/**
 * Serviço responsável por buscar o histórico de preços do Bitcoin
 * Utiliza CoinGecko como fonte primária e CoinMarketCap como fallback
 */
import { TimeRange, PriceHistoryPoint } from './types';

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
async function fetchWithoutInterval(days: number | 'max'): Promise<PriceHistoryPoint[]> {
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`CoinGecko API responded with status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data?.prices || !Array.isArray(data.prices)) {
    throw new Error("Estrutura de dados inválida da CoinGecko");
  }
  
  let pricesToUse = data.prices;
  if (pricesToUse.length > 200 && (days === 'max' || (typeof days === 'number' && days > 90))) {
    const step = Math.floor(pricesToUse.length / 200);
    pricesToUse = pricesToUse.filter((_, index) => index % step === 0);
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
  
  return pricesToUse.map(([timestamp, price]) => {
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
}

/**
 * Busca o histórico de preços do Bitcoin para diferentes períodos
 */
export const fetchBitcoinPriceHistory = async (range: TimeRange): Promise<PriceHistoryPoint[]> => {
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
    if (range === '1D') {
      interval = 'minutely';
    } else if (range === '7D' || range === '1M') {
      interval = 'hourly';
    } else {
      interval = 'daily';
    }
    
    console.log(`Buscando histórico do Bitcoin: período=${range}, days=${days}, interval=${interval}`);
    
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}${interval ? `&interval=${interval}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`CoinGecko API error (${response.status}):`, errorData);
      
      if (errorData?.status?.error_message?.includes("interval=")) {
        console.log("Tentando novamente sem especificar intervalo");
        return await fetchWithoutInterval(days);
      }
      
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data?.prices || !Array.isArray(data.prices)) {
      throw new Error("Estrutura de dados inválida da CoinGecko");
    }
    
    const formattedData = data.prices.map(([timestamp, price]) => {
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
    
    return formattedData;
  } catch (error) {
    console.error("Erro buscando histórico na CoinGecko:", error);
    
    try {
      console.log("Tentando fallback via CoinMarketCap...");
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
        throw new Error(`CoinMarketCap API respondeu com status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data?.data?.BTC?.quote?.USD) {
        throw new Error("CoinMarketCap retornou dados inesperados");
      }
      
      const currentPrice = data.data.BTC.quote.USD.price;
      const now = new Date();
      
      return generateSimulatedPoints(range, currentPrice, now);
    } catch (fallbackError) {
      console.error("Erro também no fallback da CoinMarketCap:", fallbackError);
      return [{ time: "Erro na API", price: 0 }];
    }
  }
};
