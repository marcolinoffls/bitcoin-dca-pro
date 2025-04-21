
/**
 * Gráfico de preço do Bitcoin
 * Exibe a variação de preço em diferentes períodos (1D, 7D, 1M, 1Y, ALL)
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBitcoinRate } from '@/hooks/useBitcoinRate';

type TimeRange = '1D' | '7D' | '1M' | '1Y' | 'ALL';

const PriceChart = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const { currentRate } = useBitcoinRate();

  // Dados mockados inicialmente - será substituído por dados reais da API
  const data = [
    { time: '00:00', price: 40000 },
    { time: '04:00', price: 42000 },
    { time: '08:00', price: 41000 },
    { time: '12:00', price: 43000 },
    { time: '16:00', price: 44000 },
    { time: '20:00', price: 45000 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>
          Preço do Bitcoin
        </CardTitle>
        <div className="flex space-x-2">
          {(['1D', '7D', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
            <Button 
              key={range}
              variant={selectedRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="price" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7931A" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#F7931A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#F7931A"
                fill="url(#price)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export { PriceChart };
