// Importações principais de hooks, componentes e utilitários
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

// Componente principal da dashboard
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

  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [displayUnit, setDisplayUnit] = useState<'BTC' | 'SATS'>('BTC');

  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        refetchEntries();
      }, 100);
    }
  }, [user?.id, refetchEntries]);

  // Troca entre BTC e SATS
  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => {
    setDisplayUnit(value);
  };

  // Troca entre BRL e USD
  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  // Lógica de novo aporte
  const handleAddEntry = (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p' | 'planilha'
  ) => {
    addEntry({ amountInvested, btcAmount, exchangeRate, currency, date, origin });
  };

  const handleDeleteEntry = (entryIdOrEntry: string | { id: string }) => {
    const id = typeof entryIdOrEntry === 'string' ? entryIdOrEntry : entryIdOrEntry.id;
    deleteEntry(id);
  };

  const handleEditEntry = (entry: BitcoinEntry | string) => {
    if (typeof entry === 'string') {
      const foundEntry = entries.find(e => e.id === entry);
      if (foundEntry) editEntry(foundEntry);
    } else {
      editEntry(entry);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        {/* TOPO COM LOGO, NOME E SAIR */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Ícone Bitcoin */}
              <div className="h-8 w-8">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin%20logo%20oficial%20sem%20nome%20100px.png"
                  alt="Bitcoin Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              {/* Nome em imagem */}
              <div className="h-5">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/fontes//Bitcoin%20dca%20pro%20-%20caixa%20alta%20(1).png"
                  alt="Bitcoin DCA Pro"
                  className="h-full object-contain"
                />
              </div>
            </div>
            <div>
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

        {/* Seletor de unidade (BTC/SATS) e moeda (BRL/USD) */}
        <div className="flex justify-center gap-4 mb-6">
          <ToggleDisplayUnit displayUnit={displayUnit} onToggle={toggleDisplayUnit} />
          <ToggleCurrency selectedCurrency={selectedCurrency} onToggle={toggleCurrency} />
        </div>

        {/* ---------- BLOCO PRINCIPAL (CARDS + FORM + LISTA) ---------- */}
        <div className="flex flex-col gap-6">
          {/* 3 CARDS EM GRID DE 3 COLUNAS (total, preço médio, cotação) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card de Total Investido + BTC */}
            <StatisticsCards
              entries={entries}
              currentRate={bitcoinRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
              isLoading={isEntriesLoading}
            />

            {/* Card de Preço Médio */}
            <div className="h-full">
              {/* Já incluso dentro do StatisticsCards */}
            </div>

            {/* Card de Cotação Atual */}
            <CurrentRateCard
              currentRate={bitcoinRate}
              priceVariation={priceVariation}
              isLoading={isRateLoading}
              onRefresh={fetchRateUpdate}
            />
          </div>

          {/* Formulário de Aportes */}
          <EntryForm
            onAddEntry={handleAddEntry}
            currentRate={bitcoinRate}
            onCancelEdit={cancelEdit}
            displayUnit={displayUnit}
            editingEntry={editingEntry}
          />

          {/* Lista de Aportes */}
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
  );
};

export default Index;
