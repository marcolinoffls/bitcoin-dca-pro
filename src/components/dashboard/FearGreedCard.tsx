
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

const FearGreedCard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['fearGreedIndex'],
    queryFn: fetchFearGreedIndex,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fear & Greed Index</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fear & Greed Index</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Não foi possível carregar o índice
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32">
          <div className={`text-4xl font-bold ${getColorByValue(data?.value || 0)} text-center`}>
            {data?.value || 0}
          </div>
          <div className="text-lg text-center mt-2">
            {data?.valueText || 'N/A'}
          </div>
        </div>
        {data?.timestamp && (
          <p className="text-xs text-muted-foreground mt-4">
            Atualizado: {format(new Date(data.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export { FearGreedCard };
