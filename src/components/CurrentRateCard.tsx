
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentRate } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bitcoin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CurrentRateCardProps {
  currentRate: CurrentRate;
  isLoading: boolean;
  onRefresh: () => void;
  selectedCurrency: 'BRL' | 'USD';
  onChangeCurrency: (currency: 'BRL' | 'USD') => void;
}

const CurrentRateCard: React.FC<CurrentRateCardProps> = ({
  currentRate,
  isLoading,
  onRefresh,
  selectedCurrency,
  onChangeCurrency,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Cotação Atual do Bitcoin</CardTitle>
        <Bitcoin className="h-4 w-4 text-bitcoin" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2">
          <div 
            className={`flex flex-col p-3 rounded-md cursor-pointer transition-colors ${
              selectedCurrency === 'USD' 
                ? 'bg-bitcoin/10 border border-bitcoin' 
                : 'hover:bg-muted'
            }`}
            onClick={() => onChangeCurrency('USD')}
          >
            <span className="text-sm font-medium">USD</span>
            <span className="text-2xl font-bold">$ {currentRate.usd.toFixed(2)}</span>
          </div>
          
          <div 
            className={`flex flex-col p-3 rounded-md cursor-pointer transition-colors ${
              selectedCurrency === 'BRL' 
                ? 'bg-bitcoin/10 border border-bitcoin' 
                : 'hover:bg-muted'
            }`}
            onClick={() => onChangeCurrency('BRL')}
          >
            <span className="text-sm font-medium">BRL</span>
            <span className="text-2xl font-bold">R$ {currentRate.brl.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Atualizado: {format(currentRate.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentRateCard;
