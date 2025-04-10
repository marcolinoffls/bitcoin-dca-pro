
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculateTotalBitcoin, calculateAverageByPeriod } from '@/services/bitcoinService';
import { Bitcoin, DollarSign, Repeat, Calendar } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StatisticsCardsProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  selectedCurrency: 'BRL' | 'USD';
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  entries,
  currentRate,
  selectedCurrency,
}) => {
  const totalBitcoin = calculateTotalBitcoin(entries);
  
  const avgPriceMonth = calculateAverageByPeriod(entries, 'month');
  const avgPriceYear = calculateAverageByPeriod(entries, 'year');
  const avgPriceAll = calculateAverageByPeriod(entries, 'all');
  
  const currentRateValue = selectedCurrency === 'USD' ? currentRate.usd : currentRate.brl;
  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'R$';
  
  const totalValueCurrent = totalBitcoin * currentRateValue;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total em Bitcoin</CardTitle>
          <Bitcoin className="h-4 w-4 text-bitcoin" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(totalBitcoin, 8)} BTC</div>
          <p className="text-xs text-muted-foreground">
            Valor atual: {currencySymbol} {formatNumber(totalValueCurrent)}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Preço Médio (Mês)</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgPriceMonth > 0 
              ? `${currencySymbol} ${formatNumber(avgPriceMonth)}` 
              : "Sem aportes"}
          </div>
          <p className="text-xs text-muted-foreground">
            Mês atual
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Preço Médio (Ano)</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgPriceYear > 0 
              ? `${currencySymbol} ${formatNumber(avgPriceYear)}` 
              : "Sem aportes"}
          </div>
          <p className="text-xs text-muted-foreground">
            Ano atual
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Preço Médio (Total)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgPriceAll > 0 
              ? `${currencySymbol} ${formatNumber(avgPriceAll)}` 
              : "Sem aportes"}
          </div>
          <p className="text-xs text-muted-foreground">
            Todos os períodos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
