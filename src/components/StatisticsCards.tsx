
import React from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { Loader2 } from 'lucide-react';
import BitcoinTotalCard from './BitcoinTotalCard';

interface StatisticsCardsProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
  isLoading?: boolean;
}

/**
 * Componente que exibe os cards de estatísticas no dashboard
 * 
 * Este componente foi refatorado para renderizar apenas o BitcoinTotalCard.
 * O card de Preço Médio foi movido para um componente separado (AveragePriceCard).
 * 
 * @param entries Lista de aportes de Bitcoin
 * @param currentRate Cotação atual do Bitcoin
 * @param selectedCurrency Moeda selecionada ('BRL' ou 'USD')
 * @param displayUnit Unidade de exibição ('BTC' ou 'SATS')
 * @param isLoading Estado de carregamento dos dados
 */
const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  entries,
  currentRate,
  selectedCurrency,
  displayUnit,
  isLoading = false,
}) => {
  // Componente de carregamento
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-bitcoin" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando seus dados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Componente de Bitcoin Total */}
      <BitcoinTotalCard 
        entries={entries}
        currentRate={currentRate}
        selectedCurrency={selectedCurrency}
        displayUnit={displayUnit}
      />
    </div>
  );
};

export default StatisticsCards;
