
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin, ArrowLeft, LogOut, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Statistics = () => {
  const { user, signOut } = useAuth();
  const { entries, currentRate, isLoading } = useBitcoinEntries();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Bitcoin className="h-7 w-7 text-bitcoin mr-2" />
            <span>Estatísticas Bitcoin</span>
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  // Calcular métricas
  const totalInvested = entries.reduce((sum, entry) => {
    // Converter todos para BRL para soma
    let amount = entry.amountInvested;
    if (entry.currency === 'USD') {
      amount = amount * currentRate.brl / currentRate.usd; // Conversão aproximada
    }
    return sum + amount;
  }, 0);

  const totalBitcoin = entries.reduce((sum, entry) => sum + entry.btcAmount, 0);
  
  const currentValueBRL = totalBitcoin * currentRate.brl;
  const currentValueUSD = totalBitcoin * currentRate.usd;
  
  const profitBRL = currentValueBRL - totalInvested;
  const profitPercentage = (totalInvested > 0) ? (profitBRL / totalInvested) * 100 : 0;
  
  // Preparar dados para gráficos
  const chartData = entries.slice().reverse().map(entry => {
    const date = format(entry.date, 'dd/MM/yy', { locale: ptBR });
    const value = entry.currency === 'BRL' 
      ? entry.amountInvested 
      : entry.amountInvested * currentRate.brl / currentRate.usd; // Conversão aproximada
    
    return {
      date,
      valor: value,
      bitcoin: entry.btcAmount,
      preco: entry.exchangeRate,
      origem: entry.origin || 'corretora'
    };
  });

  // Dados acumulados
  const cumulativeData = entries.slice().reverse().reduce((acc, entry, index) => {
    const date = format(entry.date, 'dd/MM/yy', { locale: ptBR });
    const value = entry.currency === 'BRL' 
      ? entry.amountInvested 
      : entry.amountInvested * currentRate.brl / currentRate.usd;
    
    const btc = entry.btcAmount;
    
    const previousBTC = index > 0 ? acc[index - 1].btcAcumulado : 0;
    const previousValue = index > 0 ? acc[index - 1].valorAcumulado : 0;
    
    return [...acc, {
      date,
      valorAporte: value,
      valorAcumulado: previousValue + value,
      btcAporte: btc,
      btcAcumulado: previousBTC + btc
    }];
  }, [] as any[]);

  // Distribuição por origem
  const originData = entries.reduce((acc, entry) => {
    const origin = entry.origin || 'corretora';
    if (!acc[origin]) {
      acc[origin] = {
        name: origin === 'corretora' ? 'Corretora' : 'P2P',
        value: 0,
        btc: 0
      };
    }
    
    const value = entry.currency === 'BRL' 
      ? entry.amountInvested 
      : entry.amountInvested * currentRate.brl / currentRate.usd;
    
    acc[origin].value += value;
    acc[origin].btc += entry.btcAmount;
    
    return acc;
  }, {} as Record<string, { name: string; value: number; btc: number }>);

  const pieChartData = Object.values(originData);
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Bitcoin className="h-7 w-7 text-bitcoin mr-2" />
          <span>Estatísticas Bitcoin</span>
        </h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Métricas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Total Investido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {formatNumber(totalInvested)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              US$ {formatNumber(totalInvested * currentRate.usd / currentRate.brl)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-bitcoin" />
              Total Bitcoin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalBitcoin, 8)} BTC</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatNumber(totalBitcoin * 100000000, 0)} Sats
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Valor Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {formatNumber(currentValueBRL)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              US$ {formatNumber(currentValueUSD)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitBRL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {profitBRL >= 0 ? '+' : ''}{formatNumber(profitBRL)} BRL
            </div>
            <div className={`text-sm ${profitBRL >= 0 ? 'text-green-500' : 'text-red-500'} mt-1`}>
              {profitBRL >= 0 ? '+' : ''}{formatNumber(profitPercentage, 2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico de aportes */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Histórico de Aportes</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => ['R$ ' + formatNumber(value as number), 'Valor']} />
                <Legend />
                <Bar dataKey="valor" name="Valor (BRL)" fill="#F7931A" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Acumulado de Bitcoin */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Bitcoin Acumulado</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cumulativeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatNumber(value as number, 8), 'BTC']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="btcAcumulado" 
                  name="Bitcoin Total" 
                  stroke="#F7931A" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Origem */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Distribuição por Origem</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pieChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(value) => ['R$ ' + formatNumber(value as number), 'Valor']} />
                <Legend />
                <Bar dataKey="value" name="Valor (BRL)" fill="#1A3064" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bitcoin por Origem */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Bitcoin por Origem</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pieChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip formatter={(value) => [formatNumber(value as number, 8), 'BTC']} />
                <Legend />
                <Bar dataKey="btc" name="Bitcoin" fill="#F7931A" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
