
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

        {/* Move the entry form higher on mobile */}
        {isMobile && (
          <div className="mb-6">
            <EntryForm 
              onAddEntry={addEntry} 
              currentRate={currentRate}
              editingEntry={editingEntry || undefined}
              onCancelEdit={cancelEdit}
              displayUnit={displayUnit}
            />
          </div>
        )}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
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
        
        {/* Only show entry form here on larger screens */}
        {!isMobile && (
          <div className="mb-6">
            <EntryForm 
              onAddEntry={addEntry} 
              currentRate={currentRate}
              editingEntry={editingEntry || undefined}
              onCancelEdit={cancelEdit}
              displayUnit={displayUnit}
            />
          </div>
        )}
        
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
