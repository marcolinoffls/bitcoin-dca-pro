
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculateTotalBitcoin, calculateAverageByPeriod } from '@/services/bitcoinService';
import { Bitcoin, Calendar, CalendarDays, CalendarClock } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  
  // Calculate average price based on currency selection
  const calculateAvgPrice = (period: 'month' | 'year' | 'all') => {
    const avgPriceLocal = calculateAverageByPeriod(entries, period);
    
    if (avgPriceLocal <= 0) return 0;
    
    // If selected currency is USD and the rates are in BRL, convert
    if (selectedCurrency === 'USD' && currentRate.usd > 0 && currentRate.brl > 0) {
      // Convert from BRL to USD using the current exchange rate
      return avgPriceLocal * (currentRate.usd / currentRate.brl);
    }
    
    return avgPriceLocal;
  };
  
  const avgPriceMonth = calculateAvgPrice('month');
  const avgPriceYear = calculateAvgPrice('year');
  const avgPriceAll = calculateAvgPrice('all');
  
  const currentAvgPrice = selectedPeriod === 'month' 
    ? avgPriceMonth 
    : selectedPeriod === 'year' 
      ? avgPriceYear 
      : avgPriceAll;
  
  const currentRateValue = selectedCurrency === 'USD' ? currentRate.usd : currentRate.brl;
  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'R$';
  
  const totalValueCurrent = totalBitcoin * currentRateValue;

  // Format total Bitcoin amount based on display unit
  const formattedTotalBitcoin = displayUnit === 'SATS' 
    ? `${formatNumber(totalBitcoin * 100000000, 0)} SATS`
    : `${formatNumber(totalBitcoin, 8)} BTC`;
    
  // Get period display text
  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'month': return 'Período selecionado: Mês atual';
      case 'year': return 'Período selecionado: Ano atual';
      case 'all': return 'Período selecionado: Todos os períodos';
    }
  };
  
  // Get period icon
  const PeriodIcon = selectedPeriod === 'month' 
    ? Calendar 
    : selectedPeriod === 'year' 
      ? CalendarDays 
      : CalendarClock;

  return (
    <div className="grid gap-5 grid-cols-2">
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bitcoin/10">
              <Bitcoin className="h-6 w-6 text-bitcoin" />
            </div>
            <CardTitle className="text-sm text-gray-500">Total em {displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col h-full">
            <div className="text-2xl font-bold mb-2">{formattedTotalBitcoin}</div>
            <p className="text-xs text-muted-foreground">
              Valor atual: {currencySymbol} {formatNumber(totalValueCurrent)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <PeriodIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-sm text-gray-500">
              Preço Médio
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col h-full">
            <div className="text-2xl font-bold mb-2 animate-in fade-in-0 duration-300">
              {currentAvgPrice > 0 
                ? `${currencySymbol} ${formatNumber(currentAvgPrice)}` 
                : "Sem aportes"}
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="self-start px-3 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors">
                  {selectedPeriod === 'month' ? 'Mês' : selectedPeriod === 'year' ? 'Ano' : 'Total'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 animate-in fade-in-0 zoom-in-95 duration-200" align="center">
                <div className="flex flex-col space-y-1">
                  <button 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'month' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'hover:bg-muted'}`}
                    onClick={() => setSelectedPeriod('month')}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Mês</span>
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'year' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'hover:bg-muted'}`}
                    onClick={() => setSelectedPeriod('year')}
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span>Ano</span>
                  </button>
                  <button 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${selectedPeriod === 'all' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'hover:bg-muted'}`}
                    onClick={() => setSelectedPeriod('all')}
                  >
                    <CalendarClock className="h-4 w-4" />
                    <span>Total</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            
            <p className="text-xs mt-1 text-muted-foreground">
              {getPeriodText()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
