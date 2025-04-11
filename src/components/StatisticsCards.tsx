
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculateTotalBitcoin, calculateAverageByPeriod } from '@/services/bitcoinService';
import { Bitcoin, DollarSign, Calendar, TrendingUp, CalendarDays, CalendarClock } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <div className="grid gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-2">
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bitcoin/10">
              <Bitcoin className="h-6 w-6 text-bitcoin" />
            </div>
            <CardTitle className="text-sm text-gray-500">Total em {displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="text-3xl font-bold">{formattedTotalBitcoin}</div>
          <p className="text-xs mt-1 text-muted-foreground">
            Valor atual: {currencySymbol} {formatNumber(totalValueCurrent)}
          </p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-sm text-gray-500">Preço Médio</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <Tabs defaultValue="month" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="month" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Mês</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="year" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Ano</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Total</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="month" className="mt-0 space-y-2 animate-in fade-in duration-200">
              <div className="text-3xl font-bold">
                {avgPriceMonth > 0 
                  ? `${currencySymbol} ${formatNumber(avgPriceMonth)}` 
                  : "Sem aportes"}
              </div>
              <p className="text-xs text-muted-foreground">
                Mês atual
              </p>
            </TabsContent>
            
            <TabsContent value="year" className="mt-0 space-y-2 animate-in fade-in duration-200">
              <div className="text-3xl font-bold">
                {avgPriceYear > 0 
                  ? `${currencySymbol} ${formatNumber(avgPriceYear)}` 
                  : "Sem aportes"}
              </div>
              <p className="text-xs text-muted-foreground">
                Ano atual
              </p>
            </TabsContent>
            
            <TabsContent value="all" className="mt-0 space-y-2 animate-in fade-in duration-200">
              <div className="text-3xl font-bold">
                {avgPriceAll > 0 
                  ? `${currencySymbol} ${formatNumber(avgPriceAll)}` 
                  : "Sem aportes"}
              </div>
              <p className="text-xs text-muted-foreground">
                Todos os períodos
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
