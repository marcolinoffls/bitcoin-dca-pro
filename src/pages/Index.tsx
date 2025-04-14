import React, { useState } from 'react';

// Hooks personalizados
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';

// Componentes da interface
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit';
import ToggleCurrency from '@/components/ToggleCurrency';

// Ícones e UI
import { Bitcoin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  // Hooks do estado global e local
  const {
    entries,                // Lista de aportes do usuário
    currentRate,            // Cotação atual do Bitcoin
    isLoading,              // Indica se está carregando dados
    editingEntry,           // Aporte em edição
    addEntry,               // Função para adicionar aporte
    editEntry,              // Função para iniciar edição
    cancelEdit,             // Cancela edição
    deleteEntry,            // Remove aporte
    updateCurrentRate       // Atualiza cotação
  } = useBitcoinEntries();

  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [displayUnit, setDisplayUnit] = useState<'BTC' | 'SATS'>('BTC');

  const isMobile = useIsMobile(); // Verifica se está em dispositivo móvel
  const { user, signOut } = useAuth(); // Controle de autenticação

  // Alterna entre BTC e SATS
  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => {
    setDisplayUnit(value);
  };

  // Alterna entre BRL e USD
  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4">
        
        {/* Cabeçalho */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Bitcoin size={isMobile ? 28 : 40} className="text-bitcoin" />
              <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold`}>
                BITCOIN DCA PRO
              </h1>
            </div>
            
            {/* Botão de sair */}
            <div className="flex flex-col items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-1"
              >
                <LogOut size={16} />
                {!isMobile && <span>Sair</span>}
              </Button>
            </div>
          </div>

          {/* Frase de efeito */}
          <div className="flex items-center justify-between">
            <p className={`text-muted-foreground ${isMobile ? "text-xs" : ""}`}>
              Stay Humble and Stack Sats
            </p>
          </div>
        </header>

        {/* Controles de unidade e moeda */}
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

        {/* ===== LAYOUT DESKTOP (Cards principais lado a lado) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Coluna 1 - Estatísticas */}
          <div className="col-span-1">
            <StatisticsCards
              entries={entries}
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
            />
          </div>

          {/* Coluna 2 e 3 - Cotação e Formulário */}
          <div className="col-span-2 space-y-6">
            <CurrentRateCard
              currentRate={currentRate}
              isLoading={isLoading}
              onRefresh={updateCurrentRate}
            />

            <EntryForm
              onAddEntry={addEntry}
              currentRate={currentRate}
              onCancelEdit={cancelEdit}
              displayUnit={displayUnit}
              editingEntry={editingEntry}
            />
          </div>
        </div>

        {/* Tabela de aportes */}
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
  );
};

export default Index;
