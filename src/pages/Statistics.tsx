
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartLegend, 
  ChartLegendContent, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowLeft, Bitcoin, TrendingUp, TrendingDown, Percent, Wallet } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#F7931A', '#3B82F6'];

const Statistics = () => {
  const { user } = useAuth();
  const { entries, currentRate } = useBitcoinEntries();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<string>('1m');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calcula estatísticas dos aportes
  const totalInvested = entries.reduce((total, entry) => 
    total + entry.amountInvested, 0);
  
  const totalBitcoin = entries.reduce((total, entry) => 
    total + entry.btcAmount, 0);
  
  const currentBitcoinValue = totalBitcoin * 
    (currentRate?.brl || 0);
  
  const profitLoss = currentBitcoinValue - totalInvested;
  const percentageProfitLoss = totalInvested > 0 
    ? (profitLoss / totalInvested) * 100 
    : 0;
  
  // Dados para o gráfico de pizza (origem dos aportes)
  const originData = React.useMemo(() => {
    const corretora = entries
      .filter(entry => entry.originType === 'corretora')
      .reduce((total, entry) => total + entry.amountInvested, 0);
      
    const p2p = entries
      .filter(entry => entry.originType === 'p2p')
      .reduce((total, entry) => total + entry.amountInvested, 0);
    
    return [
      { name: 'Corretora', value: corretora },
      { name: 'P2P', value: p2p }
    ];
  }, [entries]);
  
  useEffect(() => {
    // Simulação de fetch de dados históricos
    fetchHistoricalData(timeRange);
  }, [timeRange]);
  
  const fetchHistoricalData = async (range: string) => {
    setIsLoading(true);
    
    // Simulação de uma API para dados históricos
    setTimeout(() => {
      // Geração de dados simulados baseados no range
      const numberOfPoints = getNumberOfPointsForRange(range);
      const data = generateMockData(numberOfPoints, range);
      setHistoricalData(data);
      setIsLoading(false);
    }, 1000);
  };
  
  const getNumberOfPointsForRange = (range: string): number => {
    switch (range) {
      case '1h': return 60; // 1 ponto por minuto
      case '1d': return 24; // 1 ponto por hora
      case '1w': return 7; // 1 ponto por dia
      case '1m': return 30; // 1 ponto por dia
      case '1y': return 12; // 1 ponto por mês
      case 'all': return 60; // Arbitrário para "all"
      default: return 30;
    }
  };
  
  const generateMockData = (points: number, range: string) => {
    const data = [];
    const basePrice = currentRate?.brl || 300000;
    const volatility = 0.05; // 5% volatilidade
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now);
      
      // Ajusta a data baseada no range
      switch (range) {
        case '1h':
          date.setMinutes(date.getMinutes() - i);
          break;
        case '1d':
          date.setHours(date.getHours() - i);
          break;
        case '1w':
          date.setDate(date.getDate() - i);
          break;
        case '1m':
          date.setDate(date.getDate() - i);
          break;
        case '1y':
          date.setMonth(date.getMonth() - i);
          break;
        case 'all':
          date.setMonth(date.getMonth() - i * 2);
          break;
      }
      
      // Gera um preço com alguma volatilidade
      const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
      const price = basePrice * randomFactor;
      
      data.push({
        date: date.toISOString(),
        price: price
      });
    }
    
    return data;
  };
  
  const formatDateForChart = (dateStr: string) => {
    const date = new Date(dateStr);
    
    switch (timeRange) {
      case '1h':
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      case '1d':
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      case '1w':
      case '1m':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      case '1y':
      case 'all':
        return date.toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' });
      default:
        return date.toLocaleDateString('pt-BR');
    }
  };
  
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(payload[0].payload.date);
      const formattedDate = date.toLocaleDateString('pt-BR');
      const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const price = payload[0].value;
      
      return (
        <div className="custom-tooltip bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium">{formattedDate}</p>
          <p className="text-sm text-gray-500">{formattedTime}</p>
          <p className="text-bitcoin font-medium">{`R$ ${formatNumber(price)}`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  if (!user) {
    navigate('/auth');
    return null;
  }
  
  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bitcoin className="h-6 w-6 text-bitcoin" />
          Estatísticas
        </h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Wallet className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                R$ {formatNumber(totalInvested)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bitcoin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Bitcoin className="mr-2 h-4 w-4 text-bitcoin" />
              <span className="text-2xl font-bold">
                {formatNumber(totalBitcoin, 8)} BTC
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {profitLoss >= 0 ? (
                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
              )}
              <span className="text-2xl font-bold">
                R$ {formatNumber(currentBitcoinValue)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro/Prejuízo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatNumber(percentageProfitLoss, 2)}%
              </span>
            </div>
            <div className={`text-sm ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {profitLoss >= 0 ? '+' : ''}{formatNumber(profitLoss)} BRL
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">
                Histórico de Preços do Bitcoin
              </CardTitle>
              <ToggleGroup 
                type="single" 
                value={timeRange} 
                onValueChange={(value) => value && setTimeRange(value)}
                className="bg-muted rounded-lg p-1"
              >
                <ToggleGroupItem value="1h" className="text-xs rounded-md h-7 px-2 data-[state=on]:bg-white data-[state=on]:shadow-sm">1H</ToggleGroupItem>
                <ToggleGroupItem value="1d" className="text-xs rounded-md h-7 px-2 data-[state=on]:bg-white data-[state=on]:shadow-sm">1D</ToggleGroupItem>
                <ToggleGroupItem value="1w" className="text-xs rounded-md h-7 px-2 data-[state=on]:bg-white data-[state=on]:shadow-sm">1S</ToggleGroupItem>
                <ToggleGroupItem value="1m" className="text-xs rounded-md h-7 px-2 data-[state=on]:bg-white data-[state=on]:shadow-sm">1M</ToggleGroupItem>
                <ToggleGroupItem value="1y" className="text-xs rounded-md h-7 px-2 data-[state=on]:bg-white data-[state=on]:shadow-sm">1A</ToggleGroupItem>
                <ToggleGroupItem value="all" className="text-xs rounded-md h-7 px-2 data-[state=on]:bg-white data-[state=on]:shadow-sm">Tudo</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-bitcoin"></div>
              </div>
            ) : (
              <ChartContainer
                className="h-[300px]"
                config={{
                  bitcoin: {
                    label: "Bitcoin",
                    color: "#F7931A"
                  }
                }}
              >
                <LineChart
                  data={historicalData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickFormatter={formatDateForChart}
                    stroke="#999"
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 12 }} 
                    tickFormatter={(value) => `R$${Math.round(value / 1000)}k`}
                    stroke="#999"
                  />
                  <Tooltip content={customTooltip} />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#F7931A" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 6, stroke: '#F7931A', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Distribuição por Origem
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={originData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {originData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `R$ ${formatNumber(value as number)}`} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-bitcoin rounded-full mr-2"></div>
                <span className="text-sm">Corretora</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm">P2P</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
