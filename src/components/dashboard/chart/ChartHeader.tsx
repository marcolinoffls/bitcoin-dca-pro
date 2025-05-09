
/**
 * Componente de cabeçalho do gráfico de preços
 * 
 * Função: Exibe o título, preço atual e variação percentual
 * Usado em: PriceChart
 */
import React from 'react';
import { PriceHistoryPoint } from '@/services/bitcoin/priceHistory';
import { CardTitle } from '@/components/ui/card';
import { CurrentRate } from '@/types';

interface ChartHeaderProps {
  data: PriceHistoryPoint[];
  selectedCurrency: 'BRL' | 'USD';
  currentRate: CurrentRate;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({ 
  data, 
  selectedCurrency, 
  currentRate 
}) => {
  /**
   * Formata o valor para exibição com símbolo correto da moeda
   */
  const formatCurrencyValue = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2
    }).format(value);
  };
  
  /**
   * Obtém o valor atual da cotação baseado na moeda selecionada
   */
  const getCurrentPriceValue = (): number => {
    if (!currentRate) return 0;
    return selectedCurrency === 'BRL' ? currentRate.brl : currentRate.usd;
  };

  return (
    <>
      <CardTitle className="text-base text-muted-foreground">
        Preço do Bitcoin
      </CardTitle>
    
      {/* Preço e variação com destaque para o preço atual */}
      <div className="flex items-center justify-between w-full">
        <div className="text-3xl font-bold text-black">
          {formatCurrencyValue(getCurrentPriceValue())}
        </div>
    
        {/* Cálculo da variação percentual */}
        {data.length > 1 && (
          <div className={`ml-3 px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1
            ${data[0].price > 0 && data[data.length - 1].price >= data[0].price
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }`}>
            <span>
              {data[data.length - 1].price >= data[0].price ? '▲' : '▼'}
              {' '}
              {Math.abs(
                ((data[data.length - 1].price - data[0].price) / data[0].price) * 100
              ).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </>
  );
};
