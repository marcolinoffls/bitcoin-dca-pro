
/**
 * Gráfico de distribuição dos aportes por origem
 * Exibe um gráfico de pizza com a distribuição percentual entre Corretora e P2P
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';

const COLORS = ['#F7931A', '#1D4ED8'];

const OriginDistribution = () => {
  const { entries } = useBitcoinEntries();
  
  // Calcula a distribuição por origem
  const getDistributionData = () => {
    const distribution = entries.reduce((acc, entry) => {
      acc[entry.origin] = (acc[entry.origin] || 0) + entry.btcAmount;
      return acc;
    }, {} as Record<string, number>);
    
    return [
      { name: 'Corretora', value: distribution['corretora'] || 0 },
      { name: 'P2P', value: distribution['p2p'] || 0 }
    ];
  };

  const data = getDistributionData();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Origem</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => {
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${name} ${percentage}%`;
                }}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export { OriginDistribution };
