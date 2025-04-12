
import React, { useState } from 'react';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import { Bitcoin, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit';
import ToggleCurrency from '@/components/ToggleCurrency';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, signOut } = useAuth();

  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => {
    setDisplayUnit(value);
  };

  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Bitcoin size={isMobile ? 28 : 40} className="text-bitcoin" />
              <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold`}>Bitcoin DCA Pro</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="flex items-center gap-1"
            >
              <LogOut size={16} />
              <span className={isMobile ? "hidden" : "inline"}>Sair</span>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-muted-foreground ${isMobile ? "text-xs" : ""}`}>
              Stay Humble and Stack Sats
            </p>
            {user && (
              <p className="text-xs text-muted-foreground">
                Logado como: {user.email}
              </p>
            )}
          </div>
        </header>

        <div className="flex justify-center gap-4 mb-6">
          <ToggleDisplayUnit 
            displayUnit={displayUnit} 
            onToggle={toggleDisplayUnit} 
          />
          <ToggleCurrency
            selectedCurrency={selectedCurrency}
            onToggle={toggleCurrency}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="md:col-span-1">
            <StatisticsCards 
              entries={entries} 
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="mb-5">
              <CurrentRateCard 
                currentRate={currentRate} 
                isLoading={isLoading} 
                onRefresh={updateCurrentRate}
              />
            </div>
            <div>
              <EntryForm 
                onAddEntry={addEntry} 
                currentRate={currentRate}
                onCancelEdit={cancelEdit}
                displayUnit={displayUnit}
                editingEntry={editingEntry}
              />
            </div>
          </div>
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
