
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

  // 🔔 Exibe o toast de "login bem-sucedido" apenas uma vez por sessão
  useEffect(() => {
    if (user && !sessionStorage.getItem('loginSuccessShown')) {
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
      // Seta a flag para que o toast não apareça novamente nesta sessão
      sessionStorage.setItem('loginSuccessShown', 'true');
    }
  }, [user, toast]);

  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => {
    setDisplayUnit(value);
  };

  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  // Adaptador que converte os parâmetros individuais para o objeto esperado por addEntry
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

  // Adaptador para corrigir incompatibilidade entre tipos BitcoinEntry e string
  const handleDeleteEntry = (entryIdOrEntry: string | { id: string }) => {
    // Verifica se é uma string ou um objeto com propriedade id
    const id = typeof entryIdOrEntry === 'string' 
      ? entryIdOrEntry 
      : entryIdOrEntry.id;
    
    deleteEntry(id);
  };

  // Adaptador para corrigir incompatibilidade entre tipos
  const handleEditEntry = (entry: BitcoinEntry | string) => {
    // Se for um ID (string), precisamos encontrar a entrada correspondente
    if (typeof entry === 'string') {
      const foundEntry = entries.find(e => e.id === entry);
      if (foundEntry) {
        editEntry(foundEntry);
      }
    } else {
      // Se já for o objeto BitcoinEntry completo
      editEntry(entry);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Substituição do ícone do Bitcoin */}
              <div className="h-10 w-10">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin%20logo%20oficial.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYml0Y29pbiBsb2dvIG9maWNpYWwucG5nIiwiaWF0IjoxNzQ0NDk0OTI4LCJleHAiOjE3NzYwMzA5Mjh9.jp87rUIo5RXA3xo_VcUYD8JQkm_TEI5pHi6iSWDMA90" 
                  alt="Bitcoin Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              {/* Alteração para caixa alta */}
              <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold`}>
                BITCOIN DCA PRO
              </h1>
            </div>
            <div className="flex flex-col items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-1"
              >
                <LogOut size={16} />
                <span className={isMobile ? "hidden" : "inline"}>Sair</span>
              </Button>
              {/* Movendo o texto "Logado como" para baixo do botão */}
              {user && (
                <p className="text-xs text-muted-foreground mt-1">
                  Logado como: {user.email}
                </p>
              )}
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
