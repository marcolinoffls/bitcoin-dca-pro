
/**
 * Gráfico de preço do Bitcoin
 * Exibe a variação de preço em diferentes períodos (1D, 7D, 1M, 1Y, ALL)
 * Suporta exibição em USD ou BRL conforme a preferência do usuário
 * Agora permite seleção de período personalizado
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchBitcoinPriceHistory, PriceHistoryPoint } from '@/services/bitcoin';
import { Loader2, CalendarRange } from 'lucide-react';
import { CurrentRate } from '@/types';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine
} from 'recharts';
import DateRangePicker from './DateRangePicker';

// Define os períodos de tempo disponíveis
type TimeRange = '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM';

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
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  
  // Estados para o período personalizado
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  /**
   * Função para carregar os dados baseado no período selecionado
   * Agora suporta período customizado com datas de início e fim
   */
  const loadData = async (range: TimeRange) => {
    try {
      setLoading(true); // Inicia o carregamento
      setError(null);   // Limpa erros anteriores
  
      // Busca dados com base no período selecionado
      const history = await fetchBitcoinPriceHistory(
        range, 
        selectedCurrency,
        range === 'CUSTOM' ? startDate : undefined,
        range === 'CUSTOM' ? endDate : undefined
      );
      
      console.log(`Dados carregados: ${history.length} pontos em ${selectedCurrency}`);
      setData(history);
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
    // Se estiver trocando para o modo personalizado, não carrega os dados ainda
    if (range === 'CUSTOM') {
      setSelectedRange(range);
      setShowCustomRange(true);
      
      // Configura datas padrão se não estiverem definidas
      if (!startDate || !endDate) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30); // 30 dias atrás por padrão
        setStartDate(start);
        setEndDate(end);
      }
      return;
    }
    
    console.log(`Alterando período para: ${range}`);
    setSelectedRange(range);
    setShowCustomRange(false);
  };

  /**
   * Manipulador para alterações nas datas selecionadas no DateRangePicker
   */
  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  /**
   * Manipulador para aplicar o período personalizado
   */
  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      console.log(`Aplicando período personalizado: ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`);
      loadData('CUSTOM');
      setShowCustomRange(false);
    }
  };

  /**
   * Manipulador para cancelar a seleção de período personalizado
   */
  const handleCancelCustomRange = () => {
    setShowCustomRange(false);
    if (selectedRange === 'CUSTOM') {
      setSelectedRange('1M'); // Volta para o período padrão
      loadData('1M');
    }
  };

  // Carrega dados iniciais e sempre que mudar o período selecionado ou a moeda
  useEffect(() => {
    if (selectedRange !== 'CUSTOM' || !showCustomRange) {
      loadData(selectedRange);
    }
  }, [selectedRange, selectedCurrency, showCustomRange]); 

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
   * Obtém o valor atual da cotação baseado na moeda selecionada
   */
  const getCurrentPriceValue = (): number => {
    if (!currentRate) return 0;
    return selectedCurrency === 'BRL' ? currentRate.brl : currentRate.usd;
  };

  /**
   * Renderiza o gráfico dentro de um Card
   * Com estados de carregamento e erro
   */
  return (
    <Card>
      <CardHeader className="flex flex-col items-start space-y-2">
        <CardTitle className="text-base text-muted-foreground">
          Preço do Bitcoin
        </CardTitle>
      
        {/* Preço e variação - NOVO DESTAQUE PARA O PREÇO ATUAL */}
        <div className="flex items-center justify-between w-full">
          <div className="text-3xl font-bold text-black">
            {formatCurrencyValue(getCurrentPriceValue())}
          </div>
      
          {/* Cálculo da variação percentual */}
          {data.length > 1 && (
            <div className={`ml-3 px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1
              ${data[0].price > 0 && data[data.length - 1].price >= data[0].price
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
              }`}>
              <span>
                {data[data.length - 1].price >= data[0].price ? '▲' : '▼'}
                {' '}
                {Math.abs(
                  ((data[data.length - 1].price - data[0].price) / data[0].price) * 100
                ).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      
        {/* Seletor de períodos */}
        <div className="w-full flex justify-center sm:justify-start">
          <div className="flex flex-wrap justify-center gap-2 bg-gray-100 rounded-xl px-3 py-1">
            {(['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL'] as TimeRange[]).map((period) => (
              <button
                key={period}
                onClick={() => handleRangeChange(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition
                  ${selectedRange === period
                    ? 'bg-white text-black shadow'
                    : 'text-gray-600 hover:bg-white hover:text-black'}`}
              >
                {period}
              </button>
            ))}
            
            {/* Botão de período personalizado */}
            <button
              onClick={() => handleRangeChange('CUSTOM')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition flex items-center
                ${selectedRange === 'CUSTOM'
                  ? 'bg-white text-black shadow'
                  : 'text-gray-600 hover:bg-white hover:text-black'}`}
            >
              <CalendarRange className="h-3 w-3 mr-1" />
              Personalizado
            </button>
          </div>
        </div>
        
        {/* Seletor de período personalizado */}
        {showCustomRange && (
          <div className="w-full mt-2 p-3 bg-white border rounded-lg shadow-sm">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onRangeChange={handleDateRangeChange}
              onConfirm={handleApplyCustomRange}
              onCancel={handleCancelCustomRange}
            />
          </div>
        )}
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
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
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
                  if (selectedRange === 'ALL' || 
                     (selectedRange === 'CUSTOM' && startDate && endDate && 
                      (endDate.getTime() - startDate.getTime()) > 365 * 24 * 60 * 60 * 1000)) {
                    if (typeof value === 'string' && value.includes('/')) {
                      return value.split('/')[1]; // Retorna apenas o ano
                    }
                  }
                  return value;
                }}
              />

              {/* Eixo Y */}
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                mirror
                dx={1} // move o texto para dentro do gráfico
                tickFormatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`}
                domain={['auto', 'auto']}
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
                  if (payload?.[0]?.value !== undefined) {
                    setHoveredPrice(Number(payload[0].value));
                  }
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
                          {["7D", "1M", "3M", "YTD"].includes(selectedRange) && `Data: ${label}`}
                          {selectedRange === "CUSTOM"
                            ? `Data: ${new Date(label).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                            : `Data: ${label}`}
                        </strong>
                      </div>
                      <div>
                        Preço: {payload?.[0]?.value !== undefined ? formatCurrencyValue(Number(payload[0].value)) : ""}
                      </div>
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
          {selectedRange === '1D' && ' (últimas 24h)'}
          {selectedRange === '7D' && ' (últimos 7 dias)'}
          {selectedRange === '1M' && ' (último mês)'}
          {selectedRange === '3M' && ' (últimos 90 dias)'}
          {selectedRange === 'YTD' && ' (ano até hoje)'}
          {selectedRange === '1Y' && ' (último ano)'}
          {selectedRange === 'ALL' && ' (histórico completo)'}
          {selectedRange === 'CUSTOM' && startDate && endDate && 
            ` (${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')})`}
        </div>
      </CardContent>
    </Card>
  );
};
