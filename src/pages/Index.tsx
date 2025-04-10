
import React, { useState } from 'react';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import { Bitcoin } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bitcoin size={40} className="text-bitcoin" />
            <h1 className="text-3xl font-bold">Bitcoin Stash Tracker Pro</h1>
          </div>
          <p className="text-muted-foreground">
            Acompanhe seus investimentos em Bitcoin e monitore seu desempenho ao longo do tempo
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <StatisticsCards 
              entries={entries} 
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
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
        
        <div className="mt-6">
          <EntryForm 
            onAddEntry={addEntry} 
            currentRate={currentRate}
            editingEntry={editingEntry || undefined}
            onCancelEdit={cancelEdit}
          />
        </div>
        
        <div className="mt-6">
          <EntriesList 
            entries={entries} 
            currentRate={currentRate} 
            onDelete={deleteEntry}
            onEdit={editEntry}
            selectedCurrency={selectedCurrency}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
