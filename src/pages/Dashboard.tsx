
/**
 * Página de Dashboard
 * 
 * Exibe visualizações e estatísticas relacionadas ao Bitcoin e aportes
 * - Gráfico de preço do Bitcoin
 * - Índice Fear & Greed
 * - Distribuição por origem dos aportes
 * - Market Cap do Bitcoin
 */
import React from 'react';
import { PriceChart } from '@/components/dashboard/PriceChart';
import { FearGreedCard } from '@/components/dashboard/FearGreedCard';
import { OriginDistribution } from '@/components/dashboard/OriginDistribution';
import { MarketCapCard } from '@/components/dashboard/MarketCapCard';

const Dashboard = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Dashboard Bitcoin
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de preço do Bitcoin - ocupa 2 colunas */}
        <div className="md:col-span-2">
          <PriceChart />
        </div>
        
        {/* Fear & Greed e Market Cap - lado a lado em telas maiores */}
        <FearGreedCard />
        <MarketCapCard />
        
        {/* Gráfico de distribuição por origem - ocupa 2 colunas */}
        <div className="md:col-span-2">
          <OriginDistribution />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
