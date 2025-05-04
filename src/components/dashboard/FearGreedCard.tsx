
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchFearGreedIndex } from '@/services/coinmarketcapService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente de visualização do Fear & Greed Index
 * Exibe um velocímetro que indica o sentimento do mercado de criptomoedas
 * Os dados são obtidos via Supabase Edge Function que se conecta ao CoinMarketCap
 */
interface FearGreedData {
  value: number;
  valueText: string;
  timestamp: string;
}

/**
 * Retorna a cor correspondente ao valor do índice
 * @param value - Valor numérico do índice (0-100)
 */
const getColorByValue = (value: number) => {
  if (value <= 25) return 'text-red-500';
  if (value <= 45) return 'text-orange-500';
  if (value <= 55) return 'text-yellow-500';
  if (value <= 75) return 'text-green-500';
  return 'text-emerald-500';
};

/**
 * Calcula a rotação do ponteiro com base no valor do índice
 * Mapeia valor de 0-100 para -90 a +90 graus (180° total)
 * @param value - Valor numérico do índice (0-100)
 */
const getPointerRotation = (value: number) => {
  // Mapeia valor de 0-100 para -90 a +90 graus
  return (value / 100) * 180 - 90;
};

/**
 * Componente principal do Fear & Greed Index
 * Exibe um velocímetro visual baseado nos dados da API
 */
const FearGreedCard = () => {
  // Busca dados do índice Fear & Greed via React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['fearGreedIndex'],
    queryFn: fetchFearGreedIndex,
    staleTime: 1000 * 60 * 15, // Dados ficam "frescos" por 15 minutos
  });

  // Exibe spinner durante o carregamento
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

  // Calcula rotação do ponteiro com base no valor do índice
  const rotation = getPointerRotation(data.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fear & Greed Index</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* Semicírculo com gradiente de cores */}
        <div className="relative w-48 h-24 mb-2">
          {/* Arco colorido usando conic-gradient */}
          <div className="absolute inset-0 rounded-t-full overflow-hidden">
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

          {/* Ponteiro preto com círculo */}
          <div
            className="absolute left-1/2 bottom-0 z-10"
            style={{
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              transformOrigin: 'bottom center',
            }}
          >
            <div className="h-20 w-[3px] bg-transparent relative">
              <div className="absolute left-1/2 top-0 w-4 h-4 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {/* Valor numérico centralizado dentro do arco */}
          <div className="absolute left-1/2 bottom-1.5 transform -translate-x-1/2 flex flex-col items-center">
            <span className="text-4xl font-bold">{data.value}</span>
          </div>
        </div>

        {/* Status textual */}
        <div className={`text-center font-semibold ${getColorByValue(data.value)}`}>
          {data.valueText}
        </div>

        {/* Data de atualização */}
        <div className="text-xs text-muted-foreground mt-2">
          Atualizado: {format(new Date(data.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
};

export { FearGreedCard };
