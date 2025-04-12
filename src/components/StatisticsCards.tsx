
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculateTotalBitcoin, calculateAverageByPeriod } from '@/services/bitcoinService';
import { Bitcoin, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import BitcoinTotalCard from './BitcoinTotalCard';

interface StatisticsCardsProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
}

/**
 * Componente que exibe os cards de estatísticas no dashboard
 * 
 * Mostra:
 * - Total de Bitcoin/Satoshis acumulados
 * - Preço médio de compra ponderado pelo valor investido
 * 
 * O preço médio é calculado usando a fórmula:
 * (cotacao₁ × valorInvestido₁ + cotacao₂ × valorInvestido₂ + ...) / (valorInvestido₁ + valorInvestido₂ + ...)
 */
const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  entries,
  currentRate,
  selectedCurrency,
  displayUnit,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  
  // Calcula o preço médio com base na seleção de moeda
  const calculateAvgPrice = (period: 'month' | 'year' | 'all') => {
    // Obtém o preço médio ponderado na moeda original (BRL)
    const avgPriceLocal = calculateAverageByPeriod(entries, period);
    
    if (avgPriceLocal <= 0) return 0;
    
    // Adicionando verificação de segurança para currentRate e suas propriedades
    if (selectedCurrency === 'USD' && currentRate && currentRate.usd > 0 && currentRate.brl > 0) {
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
  
  // Adicionando verificações de segurança
  const currentRateValue = currentRate && selectedCurrency === 'USD' ? currentRate.usd : currentRate?.brl || 0;
  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'R$';

  return (
    <div className="flex flex-col gap-4">
      {/* Novo componente de Bitcoin Total */}
      <BitcoinTotalCard 
        entries={entries}
        currentRate={currentRate}
        selectedCurrency={selectedCurrency}
        displayUnit={displayUnit}
      />
      
      {/* Average Price Card */}
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-sm text-gray-500">
              Preço Médio
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col h-full">
            <div className="text-sm text-muted-foreground mb-1">
              {selectedCurrency}
            </div>
            <div className="text-2xl font-bold mb-3 animate-in fade-in-0 duration-300">
              {currentAvgPrice > 0 
                ? `${currencySymbol} ${formatNumber(currentAvgPrice)}` 
                : "Sem aportes"}
            </div>
            
            <ToggleGroup 
              type="single" 
              value={selectedPeriod} 
              onValueChange={(value) => value && setSelectedPeriod(value as 'month' | 'year' | 'all')}
              className="bg-gray-100 p-0.5 rounded-full w-full"
            >
              <ToggleGroupItem 
                value="month" 
                className={`flex-1 text-xs py-1 rounded-full transition-all ${selectedPeriod === 'month' ? 'bg-white text-bitcoin font-semibold shadow-sm' : 'text-gray-500'}`}
              >
                Mensal
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="year" 
                className={`flex-1 text-xs py-1 rounded-full transition-all ${selectedPeriod === 'year' ? 'bg-white text-bitcoin font-semibold shadow-sm' : 'text-gray-500'}`}
              >
                Anual
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="all" 
                className={`flex-1 text-xs py-1 rounded-full transition-all ${selectedPeriod === 'all' ? 'bg-white text-bitcoin font-semibold shadow-sm' : 'text-gray-500'}`}
              >
                Total
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsCards;
