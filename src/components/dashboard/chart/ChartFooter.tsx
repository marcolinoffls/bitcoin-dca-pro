
/**
 * Componente de rodapé do gráfico de preços
 * 
 * Função: Exibe informações sobre a fonte dos dados e o período visualizado
 * Usado em: PriceChart
 */
import React from 'react';

interface ChartFooterProps {
  selectedCurrency: 'BRL' | 'USD';
  selectedRange: string;
  startDate?: Date;
  endDate?: Date;
}

export const ChartFooter: React.FC<ChartFooterProps> = ({ 
  selectedCurrency, 
  selectedRange,
  startDate,
  endDate
}) => {
  return (
    <div className="text-xs text-gray-400 text-right mt-2">
      Dados via CoinStats em {selectedCurrency}
      {selectedRange === '1D' && ' (últimas 24h)'}
      {selectedRange === '7D' && ' (últimos 7 dias)'}
      {selectedRange === '1M' && ' (último mês)'}
      {selectedRange === '3M' && ' (últimos 90 dias)'}
      {selectedRange === 'YTD' && ' (ano até hoje)'}
      {selectedRange === '1Y' && ' (último ano)'}
      {selectedRange === 'ALL' && ' (histórico completo)'}
      {selectedRange === 'CUSTOM' && startDate && endDate && 
        ` (${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')})`}
    </div>
  );
};
