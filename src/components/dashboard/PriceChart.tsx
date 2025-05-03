
/**
 * Gráfico de preço do Bitcoin
 * Exibe a variação de preço em diferentes períodos (1D, 7D, 1M, 1Y, ALL)
 * Suporta exibição em USD ou BRL conforme a preferência do usuário
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchBitcoinPriceHistory, PriceHistoryPoint } from '@/services/bitcoin';
import { Loader2 } from 'lucide-react';
import { CurrentRate } from '@/types';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine
} from 'recharts';



// Define os períodos de tempo disponíveis
type TimeRange = '1D' | '7D' | '1M' | '1Y' | 'ALL';

// Props do componente para receber a moeda selecionada e taxa de câmbio
interface PriceChartProps {
  selectedCurrency?: 'BRL' | 'USD';
  currentRate?: CurrentRate;
}

export const PriceChart = ({ 
  selectedCurrency = 'USD',
  currentRate = { usd: 0, brl: 0, timestamp: new Date() }
}: PriceChartProps) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null); // ← aqui está certo agora

  /**
   * Função para carregar os dados baseado no período selecionado
   * Agora passando a moeda selecionada como segundo parâmetro
   */
  const loadData = async (range: TimeRange) => {
    try {
      setLoading(true); // Inicia o carregamento
      setError(null);   // Limpa erros anteriores
  
      // --- MODO REAL ---
      // Passamos a moeda selecionada para a função de busca
      const history = await fetchBitcoinPriceHistory(range, selectedCurrency);
      console.log(`Dados carregados: ${history.length} pontos em ${selectedCurrency}`);
      setData(history);
  
      // --- MODO MOCK (descomente abaixo para simular) ---
      /*
      const mockUsdPrices: PriceHistoryPoint[] = Array.from({ length: 10 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (10 - i));
        return {
          time: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          price: 10000 + i * 1000, // Mock em USD
        };
      });
      await new Promise((res) => setTimeout(res, 300)); // Simula carregamento
      setData(mockUsdPrices);
      console.log('Mock carregado:', mockUsdPrices.length, 'pontos');
   */
    } catch (error) {
      console.error('Erro ao carregar dados do histórico:', error);
      setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false); // Finaliza carregamento
    }
  };

  /**
   * Manipulador para troca de período
   * Separado para melhorar a legibilidade e permitir extensões futuras
   */
  const handleRangeChange = (range: TimeRange) => {
    console.log(`Alterando período para: ${range}`);
    setSelectedRange(range);
  };

  // Carrega dados iniciais e sempre que mudar o período selecionado ou a moeda
  useEffect(() => {
    loadData(selectedRange);
  }, [selectedRange, selectedCurrency]); // Adicionado selectedCurrency como dependência

  /**
   * Retorna o símbolo da moeda atual para exibição no gráfico
   */
  const getCurrencySymbol = (): string => {
    return selectedCurrency === 'BRL' ? 'R$' : '$';
  };

  /**
   * Formata o valor para exibição no tooltip com símbolo correto
   */
  const formatCurrencyValue = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2
    }).format(value);
  };

  /**
   * Renderiza o gráfico dentro de um Card
   * Com estados de carregamento e erro
   */
  return (
    <Card>
      <CardHeader className="flex flex-col items-start space-y-2">
        <CardTitle className="text-sm text-muted-foreground">
          Preço do Bitcoin
        </CardTitle>
        {/* Preço atual acima */}
        <div className="text-2xl font-bold text-red-700">
          {formatCurrencyValue(data?.[data.length - 1]?.price || 0)}
        </div>
        {/* Título e botões abaixo */}
        <div className="flex w-full items-center justify-between">

    
          <div className="flex flex-wrap justify-center gap-2 bg-gray-100 rounded-xl px-3 py-1">
            {(['1D', '7D', '1M', '1Y', 'ALL'] as TimeRange[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedRange(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition
                  ${selectedRange === period
                    ? 'bg-white text-black shadow'
                    : 'text-gray-600 hover:bg-white hover:text-black'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Container do gráfico com estados de carregamento e erro */}
        <div className="h-[400px] w-full relative">
          {/* Overlay de carregamento */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="text-sm text-gray-500">Carregando dados...</span>
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => loadData(selectedRange)}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {/* Gráfico */}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 0, left: 10, bottom: 0 }}
            >
              {/* Gradiente de fundo */}
              <defs>
                <linearGradient id="price" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7931A" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#F7931A" stopOpacity={0} />
                </linearGradient>
              </defs>
          
              {/* Eixo X */}
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                minTickGap={15}
                tickFormatter={(value) => {
                  if (selectedRange === 'ALL') {
                    return new Date(value).getFullYear();
                  }
                  return value;
                }}
              />


              {/* Eixo Y */}
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`}
                domain={['auto', 'auto']}
                padding={{ left: 2 }}
              />
          
              {/* Linha horizontal quando o mouse passa por um ponto */}
              {hoveredPrice && (
                <ReferenceLine
                  y={hoveredPrice}
                  stroke="#F7931A"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
          
              {/* Tooltip com captura do valor */}
              <Tooltip
                content={({ payload, label }) => {
                  if (payload?.[0]) setHoveredPrice(payload[0].value);
                  return (
                    <div
                      style={{
                        backgroundColor: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "10px",
                        fontSize: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div>
                        <strong>
                          {selectedRange === "1D" && `Horário: ${label}`}
                          {["7D", "1M"].includes(selectedRange) && `Data: ${label}`}
                          {["1Y", "ALL"].includes(selectedRange) && `Data: ${label}`}
                        </strong>
                      </div>
                      <div>Preço: {formatCurrencyValue(payload?.[0]?.value)}</div>
                    </div>
                  );
                }}
              />

              {/* Linha de dados */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="#F7931A"
                fill="url(#price)"
                strokeWidth={2}
                isAnimationActive={!loading}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Indicador da fonte de dados com moeda atual */}
        <div className="text-xs text-gray-400 text-right mt-2">
          Dados via CoinStats em {selectedCurrency}
          {selectedRange === '1D' ? " (últimas 24h)" : selectedRange === '7D' ? " (últimos 7 dias)" : 
            selectedRange === '1M' ? " (último mês)" : selectedRange === '1Y' ? " (último ano)" : " (histórico completo)"}
        </div>
      </CardContent>
    </Card>
  );
};
