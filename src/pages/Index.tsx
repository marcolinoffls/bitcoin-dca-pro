
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
import AveragePriceCard from '@/components/AveragePriceCard';
import ConfigButton from '@/components/config/ConfigButton';
import SidebarConfig from '@/components/config/SidebarConfig';

/**
 * Página principal do aplicativo
 * 
 * Responsável por exibir todos os componentes da dashboard e gerenciar
 * o estado global da aplicação (aportes, cotação atual, moeda selecionada, etc.)
 */
const Index = () => {
  // Abre/fecha a barra lateral de configurações
  const [configOpen, setConfigOpen] = useState(false);
  
  // Obter a taxa de Bitcoin e estado do usuário
  const { currentRate, priceVariation, isLoading: isRateLoading, updateCurrentRate: fetchRateUpdate } = useBitcoinRate();
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
    origin: 'corretora' | 'p2p' | 'planilha'
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
      {/* Sidebar de configurações */}
      <SidebarConfig open={configOpen} onOpenChange={setConfigOpen} />
      
      <div className="container mx-auto py-6 px-4 max-w-5xl">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-0">
            {/* Botão de configurações no lado esquerdo */}
            <div className="flex items-center gap-2">
              <ConfigButton onClick={() => setConfigOpen(true)} />
            </div>
        
            {/* Centered Bitcoin DCA Pro text logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="h-8">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/fontes//Bitcoin%20dca%20pro%20-%20caixa%20alta%20(1).png"
                  alt="Bitcoin DCA Pro"
                  className="h-full object-contain"
                />
              </div>
            </div>
        
            {/* Sign out button stays on the right */}
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
        
          {/* Centered tagline */}
          <div className="flex justify-center">
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
          {/* Grid dos 3 cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Total/Portfolio */}
            <div className="h-full">
              <StatisticsCards
                  entries={entries}
                  currentRate={currentRate}
                  selectedCurrency={selectedCurrency}
                  displayUnit={displayUnit}
                  isLoading={isEntriesLoading}
              />
            </div>
            
            {/* Card Preço Médio */}
            <div className="h-full">
              <AveragePriceCard 
                  entries={entries}
                  currentRate={currentRate}
                  selectedCurrency={selectedCurrency}
                  isLoading={isEntriesLoading}
              />
            </div>
            
            {/* Card Cotação */}
            <div className="h-full">
              <CurrentRateCard
                  currentRate={currentRate}
                  priceVariation={priceVariation}
                  isLoading={isRateLoading}
                  onRefresh={fetchRateUpdate}
              />
            </div>
          </div>
        
          {/* Card Registrar Novo Aporte - Largura total */}
          <div className="w-full">
            <EntryForm
              onAddEntry={handleAddEntry}
              currentRate={currentRate}
              onCancelEdit={cancelEdit}
              displayUnit={displayUnit}
              editingEntry={editingEntry}
            />
          </div>
        
          {/* Card Aportes Registrados - Largura total */}
          <div className="w-full">
            <EntriesList
              entries={entries}
              currentRate={currentRate}
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
