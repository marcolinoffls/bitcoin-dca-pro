
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

/**
 * Página principal do aplicativo
 * 
 * Responsável por exibir todos os componentes da dashboard e gerenciar
 * o estado global da aplicação (aportes, cotação atual, moeda selecionada, etc.)
 */
const Index = () => {
  const {
    currentRate: bitcoinRate,
    priceVariation,
    isLoading: isRateLoading,
    updateCurrentRate: fetchRateUpdate
  } = useBitcoinRate();

  const { user } = useAuth();
  
  const {
    entries,
    isLoading: isEntriesLoading,
    editingEntry,
    addEntry,
    editEntry,
    cancelEdit,
    deleteEntry,
    refetch: refetchEntries
  } = useBitcoinEntries();

  useEffect(() => {
    if (user) {
      console.log('Usuário autenticado detectado no Index, forçando refetch de aportes');
      setTimeout(() => {
        refetchEntries();
      }, 100);
    }
  }, [user?.id, refetchEntries]);

  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [displayUnit, setDisplayUnit] = useState<'BTC' | 'SATS'>('BTC');
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const { toast } = useToast();

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
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin%20logo%20oficial%20sem%20nome%20100px.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYml0Y29pbiBsb2dvIG9maWNpYWwgc2VtIG5vbWUgMTAwcHgucG5nIiwiaWF0IjoxNzQ0NTU4MDQ2LCJleHAiOjE4MDc2MzAwNDZ9.jmzK3PG-1LJ1r-2cqJD7OiOJItfPWA4oD8n0autKJeo" 
                  alt="Bitcoin Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="h-5">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/fontes//Bitcoin%20dca%20pro%20-%20caixa%20alta%20(1).png" 
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

        <div className="flex flex-col gap-6">
          {/* Seção dos três cards principais com grid responsivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card de Portfolio */}
            <div className="h-full">
              <StatisticsCards
                entries={entries}
                currentRate={bitcoinRate}
                selectedCurrency={selectedCurrency}
                displayUnit={displayUnit}
                isLoading={isEntriesLoading}
              />
            </div>
            
            {/* Card de Preço Médio (espaço reservado que já estava no código original) */}
            <div className="hidden md:block h-full">
            </div>
            
            {/* Card de Cotação Atual */}
            <div className="h-full">
              <CurrentRateCard
                currentRate={bitcoinRate}
                priceVariation={priceVariation}
                isLoading={isRateLoading}
                onRefresh={fetchRateUpdate}
              />
            </div>
          </div>

          {/* Card de Formulário de Entrada */}
          <div>
            <EntryForm
              onAddEntry={handleAddEntry}
              currentRate={bitcoinRate}
              onCancelEdit={cancelEdit}
              displayUnit={displayUnit}
              editingEntry={editingEntry}
            />
          </div>

          {/* Card de Lista de Aportes */}
          <div>
            <EntriesList
              entries={entries}
              currentRate={bitcoinRate}
              onDelete={handleDeleteEntry}
              onEdit={handleEditEntry}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
              isLoading={isEntriesLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
