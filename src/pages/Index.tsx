
import React, { useState } from 'react';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import { Bitcoin, SwitchCamera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { 
    entries, 
    currentRate, 
    isLoading, 
    editingEntry,
    addEntry, 
    editEntry,
    cancelEdit,
    deleteEntry, 
    updateCurrentRate 
  } = useBitcoinEntries();
  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [displayUnit, setDisplayUnit] = useState<'BTC' | 'SATS'>('BTC');
  const isMobile = useIsMobile();

  const toggleDisplayUnit = () => {
    setDisplayUnit(prev => prev === 'BTC' ? 'SATS' : 'BTC');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bitcoin size={isMobile ? 30 : 40} className="text-bitcoin" />
            <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold`}>Bitcoin Stash Tracker Pro</h1>
          </div>
          <p className={`text-muted-foreground ${isMobile ? "text-sm" : ""}`}>
            Acompanhe seus investimentos em Bitcoin e monitore seu desempenho ao longo do tempo
          </p>
          <div className="mt-4 flex justify-center">
            <Button 
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={toggleDisplayUnit}
              className="flex items-center gap-2"
            >
              <SwitchCamera className="h-4 w-4" />
              Exibir em {displayUnit === 'BTC' ? 'Satoshis' : 'Bitcoin'}
            </Button>
          </div>
        </header>

        <div className={`grid gap-6 ${isMobile ? "grid-cols-2" : "md:grid-cols-3"}`}>
          <div className={`${isMobile ? "col-span-2" : "md:col-span-2"}`}>
            <StatisticsCards 
              entries={entries} 
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
            />
          </div>
          
          <div className={`${isMobile ? "col-span-2" : "md:col-span-1"}`}>
            <CurrentRateCard 
              currentRate={currentRate} 
              isLoading={isLoading} 
              onRefresh={updateCurrentRate}
              selectedCurrency={selectedCurrency}
              onChangeCurrency={setSelectedCurrency}
            />
          </div>
        </div>
        
        <div className={`${isMobile ? "mt-4" : "mt-6"}`}>
          <EntryForm 
            onAddEntry={addEntry} 
            currentRate={currentRate}
            editingEntry={editingEntry || undefined}
            onCancelEdit={cancelEdit}
            displayUnit={displayUnit}
          />
        </div>
        
        <div className={`${isMobile ? "mt-4" : "mt-6"}`}>
          <EntriesList 
            entries={entries} 
            currentRate={currentRate} 
            onDelete={deleteEntry}
            onEdit={editEntry}
            selectedCurrency={selectedCurrency}
            displayUnit={displayUnit}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
