
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentRate } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatNumber } from '@/lib/utils';

interface CurrentRateCardProps {
  currentRate: CurrentRate;
  isLoading: boolean;
  onRefresh: () => void;
}

const CurrentRateCard: React.FC<CurrentRateCardProps> = ({
  currentRate,
  isLoading,
  onRefresh,
}) => {
  // Definindo valores seguros para exibição
  const usdRate = currentRate?.usd || 0;
  const brlRate = currentRate?.brl || 0;
  const timestamp = currentRate?.timestamp || new Date();

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
          <CardTitle className="text-sm font-medium text-gray-500">Cotação Atual do Bitcoin</CardTitle>
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
