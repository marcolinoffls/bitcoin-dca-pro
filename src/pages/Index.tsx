// Importações principais
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
 * Página principal do aplicativo Bitcoin DCA Pro
 * Exibe os cards de estatísticas, cotação, formulário de novo aporte e lista de aportes.
 */
const Index = () => {
  const {
    currentRate: bitcoinRate,
    priceVariation,
    isLoading: isRateLoading,
    updateCurrentRate: fetchRateUpdate,
  } = useBitcoinRate();

  const { user, signOut } = useAuth();
  const {
    entries,
    isLoading: isEntriesLoading,
    editingEntry,
    addEntry,
    editEntry,
    cancelEdit,
    deleteEntry,
    refetch: refetchEntries,
  } = useBitcoinEntries();

  // Recarrega os aportes após o login do usuário
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        refetchEntries();
      }, 100);
    }
  }, [user?.id, refetchEntries]);

  // Estado para moeda e unidade de exibição
  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [displayUnit, setDisplayUnit] = useState<'BTC' | 'SATS'>('BTC');
  const isMobile = useIsMobile();

  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => setDisplayUnit(value);
  const toggleCurrency = (value: 'BRL' | 'USD') => setSelectedCurrency(value);

  // Manipulação de adição e edição de aporte
  const handleAddEntry = (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p'
  ) => {
    addEntry({ amountInvested, btcAmount, exchangeRate, currency, date, origin });
  };

  const handleDeleteEntry = (entryIdOrEntry: string | { id: string }) => {
    const id = typeof entryIdOrEntry === 'string' ? entryIdOrEntry : entryIdOrEntry.id;
    deleteEntry(id);
  };

  const handleEditEntry = (entry: BitcoinEntry | string) => {
    if (typeof entry === 'string') {
      const found = entries.find(e => e.id === entry);
      if (found) editEntry(found);
    } else {
      editEntry(entry);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        {/* Cabeçalho com logo e botão de logout */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Logo do Bitcoin */}
              <div className="h-8 w-8">
                <img
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin%20logo%20oficial%20sem%20nome%20100px.png"
                  alt="Bitcoin Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              {/* Logo texto do app */}
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
                <span className={isMobile ? 'hidden' : 'inline'}>Sair</span>
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground text-sm">
              Stay Humble and Stack Sats
            </p>
          </div>
        </header>

        {/* Botões de seleção de moeda e unidade */}
        <div className="flex justify-center gap-4 mb-6">
          <ToggleDisplayUnit displayUnit={displayUnit} onToggle={toggleDisplayUnit} />
          <ToggleCurrency selectedCurrency={selectedCurrency} onToggle={toggleCurrency} />
        </div>

        {/* Cards principais */}
        <div className="flex flex-col gap-6">
          {/* Cards em grid: Total, Preço Médio e Cotação */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-full">
              <StatisticsCards
                entries={entries}
                currentRate={bitcoinRate}
                selectedCurrency={selectedCurrency}
                displayUnit={displayUnit}
                isLoading={isEntriesLoading}
              />
            </div>

            <div className="h-full hidden md:block">{/* Espaço reservado */}</div>

            <div className="h-full">
              <CurrentRateCard
                currentRate={bitcoinRate}
                priceVariation={priceVariation}
                isLoading={isRateLoading}
                onRefresh={fetchRateUpdate}
              />
            </div>
          </div>

          {/* Formulário de novo aporte */}
          <EntryForm
            onAddEntry={handleAddEntry}
            currentRate={bitcoinRate}
            onCancelEdit={cancelEdit}
            displayUnit={displayUnit}
            editingEntry={editingEntry}
          />

          {/* Lista de aportes registrados */}
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
