import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchFearGreedIndex } from '@/services/coinmarketcapService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const getPointerRotation = (value: number) => {
  // Mapeia valor de 0-100 para -90 a +90 graus
  return (value / 100) * 180 - 90;
};

const FearGreedCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fearGreedIndex'],
    queryFn: fetchFearGreedIndex,
    staleTime: 1000 * 60 * 15,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fear & Greed Index</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
        </CardContent>
      </Card>
    );
  }

  const rotation = getPointerRotation(data.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* Semicírculo */}
        <div className="relative w-40 h-20">
          {/* Arco de cores usando conic-gradient */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div
              className="w-full h-full"
              style={{
                background: `conic-gradient(
                  #ef4444 0deg, 
                  #f97316 45deg, 
                  #facc15 90deg, 
                  #22c55e 135deg, 
                  #10b981 180deg
                )`,
                borderRadius: '100% 100% 0 0 / 100% 100% 0 0',
              }}
            />
          </div>

          {/* Ponteiro */}
          <div
            className="absolute left-1/2 bottom-0 w-2 h-2 bg-black rounded-full z-10 transform origin-bottom"
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg) translateY(-90%)`,
            }}
          />

          {/* Valor no centro */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold">
            {data.value}
          </div>
        </div>

        {/* Status textual */}
        <div className="mt-2 text-muted-foreground text-sm">
          {data.valueText}
        </div>

        {/* Data */}
        <div className="text-xs text-muted-foreground mt-2">
          Atualizado: {format(new Date(data.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
};

export { FearGreedCard };
