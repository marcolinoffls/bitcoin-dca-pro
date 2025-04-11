
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculateTotalBitcoin, calculateAverageByPeriod } from '@/services/bitcoinService';
import { Bitcoin, Calendar, CalendarDays, CalendarClock } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
    
    // If selected currency is USD and the rates are in BRL, convert it
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

  return (
    <div className="flex flex-col gap-5">
      {/* Total Bitcoin Card */}
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 relative">
        <div className="absolute top-0 right-0 h-24 w-24 overflow-hidden">
          <div className="bg-bitcoin/30 rounded-full h-32 w-32 -translate-y-10 translate-x-10"></div>
        </div>
        <div className="absolute bottom-0 left-0 h-16 w-16 overflow-hidden">
          <div className="bg-bitcoin/20 rounded-full h-24 w-24 translate-y-12 -translate-x-12"></div>
        </div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-5 z-10 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bitcoin/10">
              <Bitcoin className="h-6 w-6 text-bitcoin" />
            </div>
            <CardTitle className="text-sm text-gray-500">Total em {displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 z-10 relative">
          <div className="flex flex-col h-full">
            <div className="text-sm text-muted-foreground mb-1">
              {displayUnit === 'SATS' ? 'SATS' : 'BTC'}
            </div>
            <div className="text-2xl font-bold mb-2">{formattedTotalBitcoin.split(' ')[0]}</div>
            <p className="text-xs text-muted-foreground">
              Valor atual: {currencySymbol} {formatNumber(totalValueCurrent)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Average Price Card */}
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              {selectedPeriod === 'month' ? (
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              ) : selectedPeriod === 'year' ? (
                <CalendarDays className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              ) : (
                <CalendarClock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <CardTitle className="text-sm text-gray-500">
              Preço Médio
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex flex-col h-full">
            <div className="text-sm text-muted-foreground mb-1">
              {selectedCurrency}
            </div>
            <div className="text-2xl font-bold mb-4 animate-in fade-in-0 duration-300">
              {currentAvgPrice > 0 
                ? `${currencySymbol} ${formatNumber(currentAvgPrice)}` 
                : "Sem aportes"}
            </div>
            
            <ToggleGroup 
              type="single" 
              value={selectedPeriod} 
              onValueChange={(value) => value && setSelectedPeriod(value as 'month' | 'year' | 'all')}
              className="bg-gray-100 p-1 rounded-full w-full"
            >
              <ToggleGroupItem 
                value="month" 
                className={`flex-1 text-xs rounded-full transition-all ${selectedPeriod === 'month' ? 'bg-white text-bitcoin shadow-sm' : 'text-gray-500'}`}
              >
                Mensal
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="year" 
                className={`flex-1 text-xs rounded-full transition-all ${selectedPeriod === 'year' ? 'bg-white text-bitcoin shadow-sm' : 'text-gray-500'}`}
              >
                Anual
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="all" 
                className={`flex-1 text-xs rounded-full transition-all ${selectedPeriod === 'all' ? 'bg-white text-bitcoin shadow-sm' : 'text-gray-500'}`}
              >
                Total
              </ToggleGroupItem>
            </ToggleGroup>
            
            <p className="text-xs mt-2 text-muted-foreground">
              {getPeriodText()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
