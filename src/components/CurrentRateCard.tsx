import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentRate, PriceVariation } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Triangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatNumber } from '@/lib/utils';

interface CurrentRateCardProps {
  currentRate: CurrentRate;
  priceVariation?: PriceVariation;
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * Componente que exibe o card de cotação atual do Bitcoin
 * 
 * Mostra o preço atual em USD e BRL, além das variações percentuais
 * em diferentes períodos (24h, 7d, 30, 1 ano)
 * 
 * @param currentRate Objeto com as cotações atuais
 * @param priceVariation Objeto com as variações percentuais
 * @param isLoading Estado de carregamento
 * @param onRefresh Função para atualizar os dados
 */
const CurrentRateCard: React.FC<CurrentRateCardProps> = ({
  currentRate,
  priceVariation,
  isLoading,
  onRefresh,
}) => {
  // Definindo valores seguros para exibição
  const usdRate = currentRate?.usd || 0;
  const brlRate = currentRate?.brl || 0;
  const timestamp = currentRate?.timestamp || new Date();

  // Componente para exibir cada período de variação
  const PriceVariationItem = ({ 
    label, 
    value, 
    className = '' 
  }: { 
    label: string; 
    value: number; 
    className?: string;
  }) => {
    // Determine if the variation is positive or negative
    const isPositive = value >= 0;
    
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <span className="text-xs text-muted-foreground mb-1">{label}</span>
        <div className={`flex items-center ${isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
          {isPositive ? (
            <Triangle 
              className="h-2 w-2 mr-1 fill-current" 
              strokeWidth={0} 
              fill="currentColor" 
            />
          ) : (
            <Triangle 
              className="h-2 w-2 mr-1 fill-current rotate-180" 
              strokeWidth={0} 
              fill="currentColor" 
            />
          )}
          <span className="text-sm">
            {formatNumber(Math.abs(value), 2)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
        <div className="flex items-center gap-3">
          {/* Novo ícone para o card de cotação */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/cotacao4.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvY290YWNhbzQucG5nIiwiaWF0IjoxNzQ0NDk2Nzk0LCJleHAiOjE3NzYwMzI3OTR9.JE043OJwu41fPHcWgkmh15Hoytznv-MAiEhyF1xvWvM" 
              alt="Cotação Bitcoin"
              className="h-full w-full object-contain"
            />
          </div>
          <CardTitle className="text-sm font-medium text-gray-500">Cotação atual do Bitcoin</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="grid gap-3 grid-cols-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium mb-1">USD</span>
            <div className="flex items-start">
              <span className="text-sm font-medium">$</span>
              <span className="text-xl font-bold ml-1">{formatNumber(usdRate)}</span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium mb-1">BRL</span>
            <div className="flex items-start">
              <span className="text-sm font-medium">R$</span>
              <span className="text-xl font-bold ml-1">{formatNumber(brlRate)}</span>
            </div>
          </div>
        </div>
        
        {/* Bloco de variação de preços com novo estilo */}
        {priceVariation && (
          <div className="mt-3 mb-2">
            <div className="bg-gray-100 p-2 rounded-lg flex flex-wrap justify-between gap-2">
              <PriceVariationItem label="24 horas" value={priceVariation.day} />
              <PriceVariationItem label="7 dias" value={priceVariation.week} />
              <PriceVariationItem label="30 dias" value={priceVariation.month} />
              <PriceVariationItem label="1 ano" value={priceVariation.year} />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Atualizado: {format(timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="h-7 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentRateCard;
