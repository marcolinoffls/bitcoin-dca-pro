
/**
 * Componente de seleção de período para o gráfico
 * 
 * Função: Permite escolher diferentes intervalos de tempo para visualização do gráfico
 * Usado em: PriceChart
 */
import React from 'react';
import { CalendarRange } from 'lucide-react';

type TimeRange = '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM';

interface PeriodSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
  selectedRange, 
  onRangeChange 
}) => {
  return (
    <div className="w-full flex justify-center sm:justify-start">
      <div className="flex flex-wrap justify-center gap-2 bg-gray-100 rounded-xl px-3 py-1">
        {(['1D', '7D', '1M', '3M', 'YTD', '1Y', 'ALL'] as TimeRange[]).map((period) => (
          <button
            key={period}
            onClick={() => onRangeChange(period)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition
              ${selectedRange === period
                ? 'bg-white text-black shadow'
                : 'text-gray-600 hover:bg-white hover:text-black'}`}
          >
            {period}
          </button>
        ))}
        
        {/* Botão de período personalizado */}
        <button
          onClick={() => onRangeChange('CUSTOM')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition flex items-center
            ${selectedRange === 'CUSTOM'
              ? 'bg-white text-black shadow'
              : 'text-gray-600 hover:bg-white hover:text-black'}`}
        >
          <CalendarRange className="h-3 w-3 mr-1" />
          Personalizado
        </button>
      </div>
    </div>
  );
};
