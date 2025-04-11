
import React, { useState } from 'react';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import { Bitcoin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit';
import ToggleCurrency from '@/components/ToggleCurrency';

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

  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4">
        <header className="mb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Bitcoin size={isMobile ? 28 : 40} className="text-bitcoin" />
            <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold`}>Bitcoin DCA Pro</h1>
          </div>
          <p className={`text-muted-foreground ${isMobile ? "text-xs" : ""}`}>
            Stay Humble and Stack Sats
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="flex justify-start">
              <ToggleDisplayUnit 
                displayUnit={displayUnit} 
                onToggle={toggleDisplayUnit} 
              />
            </div>
            <div className="flex justify-start">
              <ToggleCurrency
                selectedCurrency={selectedCurrency}
                onToggle={toggleCurrency}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 mb-6">
          <div>
            <StatisticsCards 
              entries={entries} 
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
            />
          </div>
          
          <div>
            <CurrentRateCard 
              currentRate={currentRate} 
              isLoading={isLoading} 
              onRefresh={updateCurrentRate}
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
