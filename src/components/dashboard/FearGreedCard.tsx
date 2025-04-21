
/**
 * Card do Fear & Greed Index
 * Exibe o índice atual de medo e ganância do mercado Bitcoin
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FearGreedData {
  value: number;
  valueText: string;
  timestamp: string;
}

const getColorByValue = (value: number) => {
  if (value <= 25) return 'text-red-500';
  if (value <= 45) return 'text-orange-500';
  if (value <= 55) return 'text-yellow-500';
  if (value <= 75) return 'text-green-500';
  return 'text-emerald-500';
};

const FearGreedCard = () => {
  // Valor mockado inicial - será substituído por dados da API
  const data: FearGreedData = {
    value: 45,
    valueText: "Fear",
    timestamp: new Date().toISOString(),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <div className={`text-4xl font-bold ${getColorByValue(data.value)} text-center`}>
            {data.value}
          </div>
          <div className="text-lg text-center mt-2">
            {data.valueText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { FearGreedCard };
