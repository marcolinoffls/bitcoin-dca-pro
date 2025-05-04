
/**
 * Página de Dashboard
 * 
 * Exibe visualizações e estatísticas relacionadas ao Bitcoin e aportes
 * - Gráfico de preço do Bitcoin
 * - Índice Fear & Greed
 * - Distribuição por origem dos aportes
 * - Market Cap do Bitcoin
 */
import React, { useState } from 'react';
import { PriceChart } from '@/components/dashboard/PriceChart';
import { FearGreedCard } from '@/components/dashboard/FearGreedCard';
import { OriginDistribution } from '@/components/dashboard/OriginDistribution';
import { MarketCapCard } from '@/components/dashboard/MarketCapCard';
import ToggleCurrency from '@/components/ToggleCurrency';
import { useBitcoinRate } from '@/hooks/useBitcoinRate';
import BottomNavBar from '@/components/navigation/BottomNavBar';

const Dashboard = () => {
  // Estado para controlar a moeda selecionada (USD ou BRL)
  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL');
  
  // Obtém a cotação atual do Bitcoin e taxa de câmbio
  const { currentRate } = useBitcoinRate();

  // Função para alternar entre USD e BRL
  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  return (
    <div id="top" className="container mx-auto px-4 py-6 space-y-6 pb-20">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Dashboard Bitcoin
      </h1>
      
      {/* Seletor de moeda */}
      <div className="flex justify-end mb-2">
        <ToggleCurrency
          selectedCurrency={selectedCurrency}
          onToggle={toggleCurrency}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de preço do Bitcoin - ocupa 2 colunas */}
        <div className="md:col-span-2">
          <PriceChart 
            selectedCurrency={selectedCurrency}
            currentRate={currentRate}
          />
        </div>
        
        {/* Fear & Greed e Market Cap - lado a lado em telas maiores */}
        <FearGreedCard />
        <MarketCapCard />
        
        {/* Gráfico de distribuição por origem - ocupa 2 colunas */}
        <div className="md:col-span-2">
          <OriginDistribution />
        </div>
      </div>
      
      {/* Barra de navegação inferior */}
      <BottomNavBar />
    </div>
  );
};

export default Dashboard;
