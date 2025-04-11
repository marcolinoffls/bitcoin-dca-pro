
import React, { useState } from 'react';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import { Bitcoin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit';

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

  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => {
    setDisplayUnit(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4">
        <header className="mb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Bitcoin size={isMobile ? 28 : 40} className="text-bitcoin" />
            <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold`}>Bitcoin Stash Tracker Pro</h1>
          </div>
          <p className={`text-muted-foreground ${isMobile ? "text-xs" : ""}`}>
            Acompanhe seus investimentos em Bitcoin e monitore seu desempenho ao longo do tempo
          </p>
          <div className="mt-3 flex justify-center">
            <ToggleDisplayUnit 
              displayUnit={displayUnit} 
              onToggle={toggleDisplayUnit} 
            />
          </div>
        </header>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-3 mb-6">
          <div className="md:col-span-2">
            <StatisticsCards 
              entries={entries} 
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
            />
          </div>
          
          <div className="md:col-span-1">
            <CurrentRateCard 
              currentRate={currentRate} 
              isLoading={isLoading} 
              onRefresh={updateCurrentRate}
              selectedCurrency={selectedCurrency}
              onChangeCurrency={setSelectedCurrency}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <EntryForm 
            onAddEntry={addEntry} 
            currentRate={currentRate}
            editingEntry={editingEntry || undefined}
            onCancelEdit={cancelEdit}
            displayUnit={displayUnit}
          />
        </div>
        
        <div>
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
