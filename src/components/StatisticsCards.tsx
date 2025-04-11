
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculateTotalBitcoin, calculateAverageByPeriod } from '@/services/bitcoinService';
import { Bitcoin, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StatisticsCardsProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  entries,
  currentRate,
  selectedCurrency,
  displayUnit,
}) => {
  const totalBitcoin = calculateTotalBitcoin(entries);
  
  const avgPriceMonth = calculateAverageByPeriod(entries, 'month');
  const avgPriceYear = calculateAverageByPeriod(entries, 'year');
  const avgPriceAll = calculateAverageByPeriod(entries, 'all');
  
  const currentRateValue = selectedCurrency === 'USD' ? currentRate.usd : currentRate.brl;
  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'R$';
  
  const totalValueCurrent = totalBitcoin * currentRateValue;

  // Format total Bitcoin amount based on display unit
  const formattedTotalBitcoin = displayUnit === 'SATS' 
    ? `${formatNumber(totalBitcoin * 100000000, 0)} SATS`
    : `${formatNumber(totalBitcoin, 8)} BTC`;

  return (
    <div className="grid gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bitcoin/10">
              <Bitcoin className="h-5 w-5 text-bitcoin" />
            </div>
            <CardTitle>Total em {displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedTotalBitcoin}</div>
          <p className="text-xs mt-1 text-muted-foreground">
            Valor atual: {currencySymbol} {formatNumber(totalValueCurrent)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Preço Médio (Mês)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgPriceMonth > 0 
              ? `${currencySymbol} ${formatNumber(avgPriceMonth)}` 
              : "Sem aportes"}
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            Mês atual
          </p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>Preço Médio (Ano)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgPriceYear > 0 
              ? `${currencySymbol} ${formatNumber(avgPriceYear)}` 
              : "Sem aportes"}
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            Ano atual
          </p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Preço Médio (Total)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgPriceAll > 0 
              ? `${currencySymbol} ${formatNumber(avgPriceAll)}` 
              : "Sem aportes"}
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            Todos os períodos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
