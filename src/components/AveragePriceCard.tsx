
/**
 * Componente AveragePriceCard
 * 
 * Responsável por exibir o card com preço médio de compra de Bitcoin
 * Este componente mostra:
 * - Preço médio ponderado de Bitcoin por período (mensal, anual, total)
 * - Seletor para alternar entre períodos diferentes
 * - Nota: Os ajustes não são considerados neste cálculo
 * 
 * O preço médio é calculado usando a função calculateAverageByPeriod do bitcoinService,
 * que aplica uma média ponderada pelo valor investido, excluindo entradas do tipo "ajuste".
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculateAverageByPeriod } from '@/services/bitcoin';
import { formatNumber } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AveragePriceCardProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  selectedCurrency: 'BRL' | 'USD';
  isLoading?: boolean;
}

const AveragePriceCard: React.FC<AveragePriceCardProps> = ({
  entries,
  currentRate,
  selectedCurrency,
  isLoading = false,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'all'>('month');
  
  // Verifica se currentRate está definido antes de acessá-lo
  const isCurrencyDataAvailable = currentRate && typeof currentRate.usd === 'number' && typeof currentRate.brl === 'number';
  
  // Calcula o preço médio com base na seleção de moeda
  const calculateAvgPrice = (period: 'month' | 'year' | 'all') => {
    // Obtém o preço médio ponderado na moeda original (BRL)
    const avgPriceLocal = calculateAverageByPeriod(entries, period);
    
    if (avgPriceLocal <= 0) return 0;
    
    // Verifica se os dados da moeda estão disponíveis antes de fazer a conversão
    if (selectedCurrency === 'USD' && isCurrencyDataAvailable) {
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
  
  // Adicionando verificações de segurança para evitar acesso a propriedades de undefined
  const currentRateValue = isCurrencyDataAvailable
    ? (selectedCurrency === 'USD' ? currentRate.usd : currentRate.brl)
    : 0;
  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'R$';

  // Componente de carregamento
  if (isLoading) {
    return (
      <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-bitcoin" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando seus dados...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 h-[220px]">
      <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/cotacao2.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvY290YWNhbzIucG5nIiwiaWF0IjoxNzQ0NDk1NjY4LCJleHAiOjE3NzYwMzE2Njh9.f41oc6Aw4_fncoJYnVG0j2fJ0SNpz_hnUxEjtVICI84" 
              alt="Preço Médio"
              className="h-full w-full object-contain"
            />
          </div>
          <CardTitle className="text-base font-semibold text-gray-500">
            PREÇO MÉDIO
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block ml-1">
                  <Info size={14} className="text-gray-400" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Registros do tipo "ajuste" não são considerados no cálculo do preço médio.</p>
              </TooltipContent>
            </Tooltip>
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

          <div className="mt-auto">
            <ToggleGroup 
              type="single" 
              value={selectedPeriod} 
              onValueChange={(value) => value && setSelectedPeriod(value as 'month' | 'year' | 'all')}
              className="bg-gray-100 p-1 rounded-xl w-full"
              >
              <ToggleGroupItem 
                value="month" 
                className={`flex-1 text-xs py-1 rounded-lg transition-all data-[state=on]:bg-white data-[state=on]:text-bitcoin data-[state=on]:font-regular ${selectedPeriod !== 'month' && 'text-gray-500 hover:bg-white/50'}`}
              >
                Mensal
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="year" 
                className={`flex-1 text-xs py-1 rounded-lg transition-all data-[state=on]:bg-white data-[state=on]:text-bitcoin data-[state=on]:font-semibold ${selectedPeriod !== 'year' && 'text-gray-500 hover:bg-white/50'}`}
              >
                Anual
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="all" 
                className={`flex-1 text-xs py-1 rounded-lg transition-all data-[state=on]:bg-white data-[state=on]:text-bitcoin data-[state=on]:font-semibold ${selectedPeriod !== 'all' && 'text-gray-500 hover:bg-white/50'}`}
              >
                Total
              </ToggleGroupItem>
            </ToggleGroup>
          </div>   
        </div>
      </CardContent>
    </Card>
  );
};

export default AveragePriceCard;
