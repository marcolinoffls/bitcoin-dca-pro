import React, { useState, useEffect } from 'react';
import { useBitcoinRate } from '@/hooks/useBitcoinRate';
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import { LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit';
import ToggleCurrency from '@/components/ToggleCurrency';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import { BitcoinEntry } from '@/types';

const Index = () => {
  const {
    currentRate: bitcoinRate,
    priceVariation,
    isLoading: isRateLoading,
    updateCurrentRate: fetchRateUpdate
  } = useBitcoinRate();

  const {
    entries,
    isLoading: isEntriesLoading,
    editingEntry,
    addEntry,
    editEntry,
    cancelEdit,
    deleteEntry
  } = useBitcoinEntries();

  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [displayUnit, setDisplayUnit] = useState<'BTC' | 'SATS'>('BTC');
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !sessionStorage.getItem('loginSuccessShown')) {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      sessionStorage.setItem('loginSuccessShown', 'true');
    }
  }, [user, toast]);

  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => {
    setDisplayUnit(value);
  };

  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  const handleAddEntry = (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p'
  ) => {
    addEntry({
      amountInvested,
      btcAmount,
      exchangeRate,
      currency,
      date,
      origin
    });
  };

  const handleDeleteEntry = (entryIdOrEntry: string | { id: string }) => {
    const id = typeof entryIdOrEntry === 'string' 
      ? entryIdOrEntry 
      : entryIdOrEntry.id;
    
    deleteEntry(id);
  };

  const handleEditEntry = (entry: BitcoinEntry | string) => {
    if (typeof entry === 'string') {
      const foundEntry = entries.find(e => e.id === entry);
      if (foundEntry) {
        editEntry(foundEntry);
      }
    } else {
      editEntry(entry);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin%20logo%20oficial%20sem%20nome%20100px.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYml0Y29pbiBsb2dvIG9maWNpYWwgc2VtIG5vbWUgMTAwcHgucG5nIiwiaWF0IjoxNzQ0NTc3ODY3LCJleHAiOjE3NzYxMTM4Njd9.j6RrKe8hvdoQXp52OgpfLtpxl84vz46GfXKKY1QdIec" 
                  alt="Bitcoin Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="h-8">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/Bitcoin%20dca%20pro%20-%20caixa%20alta.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvQml0Y29pbiBkY2EgcHJvIC0gY2FpeGEgYWx0YS5wbmciLCJpYXQiOjE3NDQ1Nzc5NDgsImV4cCI6MTc3NjExMzk0OH0.JvdEaY7wjEjQc5Fs2v-K9yC9-8Rm1vQbkHkTOdSXROs" 
                  alt="Bitcoin DCA Pro"
                  className="h-full object-contain"
                />
              </div>
            </div>
            <div className="flex items-center">
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
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-muted-foreground ${isMobile ? "text-xs" : ""}`}>
              Stay Humble and Stack Sats
            </p>
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
              currentRate={bitcoinRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-5">
              <CurrentRateCard
                currentRate={bitcoinRate}
                priceVariation={priceVariation}
                isLoading={isRateLoading}
                onRefresh={fetchRateUpdate}
              />
            </div>
            <div>
              <EntryForm
                onAddEntry={handleAddEntry}
                currentRate={bitcoinRate}
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
            currentRate={bitcoinRate}
            onDelete={handleDeleteEntry}
            onEdit={handleEditEntry}
            selectedCurrency={selectedCurrency}
            displayUnit={displayUnit}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
