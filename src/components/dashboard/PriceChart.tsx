
/**
 * Componente PriceChart
 * 
 * Exibe um gráfico da evolução do preço do Bitcoin ao longo do tempo
 * com opções para filtrar por períodos (1D, 1S, 1M, 3M, 1A, Tudo)
 */
import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { fetchPriceHistory, timeRanges } from '@/services/bitcoin/priceHistory';

// Tipos para as props do componente
interface PriceChartProps {
  selectedCurrency: 'BRL' | 'USD';
  currentRate: {
    BRL: number;
    USD: number;
  };
}

// Opções de período para o gráfico
const periods = [
  { value: '1d', label: '1D' },
  { value: '7d', label: '1S' },
  { value: '30d', label: '1M' },
  { value: '90d', label: '3M' },
  { value: '365d', label: '1A' },
  { value: 'max', label: 'Tudo' }
];

// Função para formatar valores monetários
const formatCurrency = (value: number, currency: 'BRL' | 'USD'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'BRL' ? 0 : 2
  }).format(value);
};

// Função para formatar datas
const formatDate = (timestamp: string, period: string): string => {
  const date = new Date(timestamp);
  
  // Formatos diferentes dependendo do período
  if (period === '1d') {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } else if (period === '7d' || period === '30d') {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
};

// Formata porcentagem de variação
const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Componente principal
export const PriceChart = ({ selectedCurrency, currentRate }: PriceChartProps) => {
  // Estado para o período selecionado
  const [period, setPeriod] = useState<string>('30d');
  
  // Estado para dados do gráfico
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Estatísticas calculadas
  const [highestPrice, setHighestPrice] = useState<number>(0);
  const [lowestPrice, setLowestPrice] = useState<number>(0);
  const [percentChange, setPercentChange] = useState<number>(0);

  // Busca dados do gráfico usando React Query
  const { data, isLoading } = useQuery({
    queryKey: ['priceHistory', period, selectedCurrency],
    queryFn: () => fetchPriceHistory(period as timeRanges, selectedCurrency)
  });

  // Atualiza os dados do gráfico quando a resposta da API chega
  useEffect(() => {
    if (!data || !data.prices) return;

    const formattedData = data.prices.map((item: [number, number]) => ({
      timestamp: new Date(item[0]).toISOString(),
      price: item[1],
    }));

    setChartData(formattedData);

    // Calcula valores mínimo e máximo
    if (formattedData.length > 0) {
      const prices = formattedData.map((item: any) => item.price);
      const max = Math.max(...prices);
      const min = Math.min(...prices);
      
      setHighestPrice(max);
      setLowestPrice(min);
      
      // Calcula variação percentual do período
      const firstPrice = formattedData[0].price;
      const lastPrice = formattedData[formattedData.length - 1].price;
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      setPercentChange(change);
    }
  }, [data]);

  // Customização do tooltip do gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const price = payload[0].value;
      const formattedDate = formatDate(label, period);
      
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="text-sm text-gray-500">{formattedDate}</p>
          <p className="text-sm font-medium">{formatCurrency(price, selectedCurrency)}</p>
        </div>
      );
    }
    
    return null;
  };

  // Handler para mudança de período
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-gray-500 flex justify-between items-center">
          <span>Preço do Bitcoin</span>
          <span className="text-base font-semibold text-gray-700">
            {formatCurrency(currentRate[selectedCurrency], selectedCurrency)}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-1 pb-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[250px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ) : (
          <>
            {/* Gráfico */}
            <div className="h-[250px] mt-2 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatDate(value, period)}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    minTickGap={15}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value, selectedCurrency).replace(/[^0-9KM]/g, '')}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    orientation="right"
                    domain={['dataMin', 'dataMax']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#F7931A" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Estatísticas do período */}
            <div className="flex justify-between items-center flex-wrap gap-y-2 text-sm">
              <div>
                <div className="text-gray-500">Mínimo</div>
                <div className="font-medium">{formatCurrency(lowestPrice, selectedCurrency)}</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={`font-semibold ${percentChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatPercentage(percentChange)}
                </div>
                <div className="text-gray-500 text-xs">{periods.find(p => p.value === period)?.label || period}</div>
              </div>
              
              <div className="text-right">
                <div className="text-gray-500">Máximo</div>
                <div className="font-medium">{formatCurrency(highestPrice, selectedCurrency)}</div>
              </div>
            </div>
            
            {/* Seletores de período */}
            <Tabs value={period} onValueChange={handlePeriodChange} className="mt-4">
              <TabsList className="grid grid-cols-6 h-9">
                {periods.map((p) => (
                  <TabsTrigger 
                    key={p.value} 
                    value={p.value}
                    className="text-xs"
                  >
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};
