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

/**
 * Busca o histórico de preços do Bitcoin para diferentes períodos de tempo.
 * Usa a CoinGecko com fallback para CoinMarketCap se necessário.
 * 
 * @param range Período selecionado ('1D', '7D', '1M', '1Y', 'ALL')
 * @returns Lista de pontos para o gráfico [{ time, price }]
 */
export const fetchBitcoinPriceHistory = async (range: '1D' | '7D' | '1M' | '1Y' | 'ALL') => {
  try {
    // Definimos o número de dias conforme o período selecionado
    const daysMap = {
      '1D': 1,        // 1 dia
      '7D': 7,        // 7 dias
      '1M': 30,       // 30 dias (aproximadamente 1 mês)
      '1Y': 365,      // 365 dias (1 ano)
      'ALL': 'max'    // Período máximo disponível
    };
    
    // Obtém o valor de dias baseado no período selecionado
    const days = daysMap[range];
    
    // Define o intervalo ideal para cada período:
    // Obs: CoinGecko tem limitações para intervalos específicos na API gratuita
    let interval;
    if (range === '1D') {
      // Para 1 dia, ideal seria minutely, mas pode cair para hourly se API rejeitar
      interval = 'minutely';
    } else if (range === '7D' || range === '1M') {
      // Para 7 dias e 1 mês, usamos hourly
      interval = 'hourly';
    } else {
      // Para 1 ano e ALL, usamos daily
      interval = 'daily';
    }
    
    console.log(`Buscando histórico do Bitcoin: período=${range}, days=${days}, interval=${interval}`);
    
    // Constrói a URL da API CoinGecko com os parâmetros
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}${interval ? `&interval=${interval}` : ''}`;
    
    // Faz a requisição à API
    const response = await fetch(url);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      // Se tiver erro, analisamos o código de status e mensagem
      const errorData = await response.json();
      console.error(`CoinGecko API error (${response.status}):`, errorData);
      
      // Verifica se o erro é específico sobre limitação do plano enterprise
      if (errorData?.status?.error_message?.includes("interval=")) {
        // Se o erro for relacionado ao intervalo, tentamos novamente sem especificar o intervalo
        console.log("Tentando novamente sem especificar intervalo (limitação da API gratuita)");
        return await fetchWithoutInterval(days);
      }
      
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }
    
    // Analisa a resposta como JSON
    const data = await response.json();
    
    // Valida se a estrutura de dados está correta
    if (!data?.prices || !Array.isArray(data.prices)) {
      console.error("CoinGecko retornou dados inesperados:", data);
      throw new Error("Estrutura de dados inválida da CoinGecko");
    }
    
    // Formata os dados para o formato esperado pelo gráfico
    const formattedData = data.prices.map(([timestamp, price]) => {
      const date = new Date(timestamp);
      
      // Formata o rótulo de tempo de acordo com o intervalo selecionado
      let timeLabel;
      if (range === '1D') {
        // Para 1 dia, mostramos o horário (HH:MM)
        timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else if (range === '7D' || range === '1M') {
        // Para 7 dias e 1 mês, mostramos o dia/mês (DD/MM)
        timeLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      } else { 
        // Para 1 ano e ALL, mostramos mês/ano (MM/YY)
        timeLabel = date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
      }
      
      // Retorna o ponto formatado para o gráfico
      return {
        time: timeLabel,
        price: parseFloat(price.toFixed(2)), // Arredonda para 2 casas decimais
      };
    });
    
    console.log(`Dados formatados: ${formattedData.length} pontos para o período ${range}`);
    return formattedData;
  } catch (error) {
    console.error("Erro buscando histórico na CoinGecko:", error);
    
    // FALLBACK: Se falhar, tentamos buscar via CoinMarketCap
    try {
      console.log("Tentando fallback via CoinMarketCap...");
      const coinMarketCapApiKey = import.meta.env.VITE_CMC_API_KEY;
      
      // Verifica se temos uma API key configurada
      if (!coinMarketCapApiKey) {
        console.warn("CoinMarketCap API key não encontrada no ambiente");
        throw new Error("CoinMarketCap API key não encontrada");
      }
      
      // Faz requisição à API da CoinMarketCap para obter pelo menos o preço atual
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
      
      // Valida a estrutura de dados recebida
      if (!data?.data?.BTC?.quote?.USD) {
        throw new Error("CoinMarketCap retornou dados inesperados");
      }
      
      const currentPrice = data.data.BTC.quote.USD.price;
      const now = new Date();
      
      // Com base no período, geramos pontos simulados para não deixar o gráfico vazio
      // Esta é uma solução de emergência quando ambas as APIs falham
      const simulatedPoints = generateSimulatedPoints(range, currentPrice, now);
      
      console.log(`Fallback: gerando ${simulatedPoints.length} pontos simulados baseados no preço atual`);
      return simulatedPoints;
    } catch (fallbackError) {
      console.error("Erro também no fallback da CoinMarketCap:", fallbackError);
      
      // Se tudo falhar, retorna um único ponto com erro para não quebrar o gráfico
      return [{ time: "Erro na API", price: 0 }];
    }
  }
};

/**
 * Função auxiliar que tenta fazer uma requisição sem especificar o intervalo
 * Usada quando a API rejeita intervalos específicos por limitações do plano gratuito
 * 
 * @param days Número de dias ou 'max'
 */
async function fetchWithoutInterval(days: number | 'max') {
  try {
    // Nova tentativa sem especificar intervalo
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data?.prices || !Array.isArray(data.prices)) {
      console.error("CoinGecko retornou dados inesperados:", data);
      throw new Error("Estrutura de dados inválida da CoinGecko");
    }
    
    // Para não sobrecarregar o gráfico, limitamos o número de pontos
    // Se o dataset for muito grande, fazemos uma amostragem
    let pricesToUse = data.prices;
    if (pricesToUse.length > 200 && (days === 'max' || days > 90)) {
      const step = Math.floor(pricesToUse.length / 200);
      pricesToUse = pricesToUse.filter((_, index) => index % step === 0);
      console.log(`Dataset reduzido de ${data.prices.length} para ${pricesToUse.length} pontos`);
    }
    
    // Calcula o período aproximado pelos timestamps para formatar corretamente
    let periodType;
    if (days === 1 || days === '1') {
      periodType = '1D';
    } else if (days <= 7) {
      periodType = '7D';
    } else if (days <= 30) {
      periodType = '1M';
    } else if (days <= 365) {
      periodType = '1Y';
    } else {
      periodType = 'ALL';
    }
    
    // Formatação de acordo com o período identificado
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
  } catch (error) {
    console.error("Erro na tentativa sem especificar intervalo:", error);
    throw error; // Repassa o erro para ser tratado no fallback
  }
}

/**
 * Gera pontos simulados para o gráfico quando todas as APIs falham
 * Cria variação aleatória em torno do preço atual
 * 
 * @param range Período selecionado
 * @param currentPrice Preço atual do Bitcoin
 * @param now Data atual
 */
function generateSimulatedPoints(range: '1D' | '7D' | '1M' | '1Y' | 'ALL', currentPrice: number, now: Date) {
  // Define quantos pontos gerar baseado no período
  const pointsCount = {
    '1D': 24,       // 24 pontos para 1 dia (1 ponto por hora)
    '7D': 7,        // 7 pontos para 7 dias (1 ponto por dia)
    '1M': 30,       // 30 pontos para 1 mês (1 ponto por dia)
    '1Y': 12,       // 12 pontos para 1 ano (1 ponto por mês)
    'ALL': 10,      // 10 pontos para histórico completo
  }[range];
  
  const points = [];
  
  for (let i = 0; i < pointsCount; i++) {
    // Cria uma variação aleatória entre -5% e +5% do preço atual
    // Isso é apenas para ter alguma flutuação visual no gráfico de fallback
    const randomVariation = 0.9 + Math.random() * 0.2; // entre 0.9 e 1.1
    const simulatedPrice = currentPrice * randomVariation;
    
    // Calcula uma data baseada no período
    const simulatedDate = new Date(now);
    
    // Ajusta a data de acordo com o período
    if (range === '1D') {
      // Para 1 dia, subtrai horas
      simulatedDate.setHours(now.getHours() - (pointsCount - i));
      
    } else if (range === '7D') {
      // Para 7 dias, subtrai dias
      simulatedDate.setDate(now.getDate() - (pointsCount - i));
      
    } else if (range === '1M') {
      // Para 1 mês, subtrai dias
      simulatedDate.setDate(now.getDate() - (pointsCount - i));
      
    } else if (range === '1Y') {
      // Para 1 ano, subtrai meses
      simulatedDate.setMonth(now.getMonth() - (pointsCount - i));
      
    } else {
      // Para ALL (histórico completo), subtrai anos
      simulatedDate.setFullYear(now.getFullYear() - (pointsCount - i));
    }
    
    // Formata o rótulo de tempo de acordo com o período
    let timeLabel;
    if (range === '1D') {
      timeLabel = simulatedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D' || range === '1M') {
      timeLabel = simulatedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      timeLabel = simulatedDate.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
    }
    
    // Adiciona o ponto simulado à lista
    points.push({
      time: timeLabel,
      price: parseFloat(simulatedPrice.toFixed(2)),
    });
  }
  
  return points;
}

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
