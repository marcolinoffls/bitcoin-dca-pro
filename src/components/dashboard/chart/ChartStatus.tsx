
/**
 * Componente para exibir estados de carregamento e erro do gráfico
 * 
 * Função: Exibe indicadores de carregamento ou mensagens de erro
 * Usado em: PriceChart
 */
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartStatusProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ChartStatus: React.FC<ChartStatusProps> = ({ loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 z-10">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="text-sm text-gray-500">Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={onRetry}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
