import React, { useState } from 'react';

// Hooks personalizados
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries'; // Lida com operações de CRUD dos aportes
import { useIsMobile } from '@/hooks/use-mobile'; // Detecta se está em um dispositivo móvel
import { useAuth } from '@/hooks/useAuth'; // Gerencia autenticação do usuário

// Componentes principais da interface
import EntryForm from '@/components/EntryForm'; // Formulário para registrar ou editar aportes
import EntriesList from '@/components/EntriesList'; // Tabela com todos os aportes registrados
import StatisticsCards from '@/components/StatisticsCards'; // Card com total investido, BTC acumulado, etc.
import CurrentRateCard from '@/components/CurrentRateCard'; // Card com cotação atual do Bitcoin

// Componentes utilitários e UI
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit'; // Alterna entre BTC e SATS
import ToggleCurrency from '@/components/ToggleCurrency'; // Alterna entre BRL e USD
import { Button } from '@/components/ui/button'; // Botão estilizado do projeto

// Ícones
import { Bitcoin, LogOut } from 'lucide-react'; // Ícones SVG utilizados no topo

const Index = () => {
  // Dados fornecidos pelo hook de aportes
  const {
    entries,              // Lista de aportes
    currentRate,          // Cotação atual do Bitcoin
    isLoading,            // Indica se a cotação ainda está sendo carregada
    editingEntry,         // Se estiver editando, contém os dados do aporte
    addEntry,             // Função para adicionar novo aporte
    editEntry,            // Função para iniciar edição de aporte
    cancelEdit,           // Cancela o modo de edição
    deleteEntry,          // Deleta um aporte
    updateCurrentRate     // Recarrega cotação atual
  } = useBitcoinEntries();

  const [selectedCurrency, setSelectedCurrency] = useState<'BRL' | 'USD'>('BRL'); // Estado para BRL/USD
  const [displayUnit, setDisplayUnit] = useState<'BTC' | 'SATS'>('BTC'); // BTC ou SATS
  const isMobile = useIsMobile(); // Verifica se é mobile
  const { user, signOut } = useAuth(); // Dados de usuário + função logout

  // Alterna exibição de unidade (BTC/SATS)
  const toggleDisplayUnit = (value: 'BTC' | 'SATS') => {
    setDisplayUnit(value);
  };

  // Alterna exibição de moeda (BRL/USD)
  const toggleCurrency = (value: 'BRL' | 'USD') => {
    setSelectedCurrency(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 px-4">
        {/* TOPO DO APP */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            {/* Logo e Título */}
            <div className="flex items-center gap-3">
              <Bitcoin size={isMobile ? 28 : 40} className="text-bitcoin" />
              <h1 className={`${isMobile ? "text-xl" : "text-3xl"} font-bold`}>BITCOIN DCA PRO</h1>
            </div>

            {/* Botão de Logout */}
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

          {/* Subtítulo / Frase inspiradora */}
          <div className="flex items-center justify-between">
            <p className={`text-muted-foreground ${isMobile ? "text-xs" : ""}`}>
              Stay Humble and Stack Sats
            </p>
          </div>
        </header>

        {/* BOTÕES DE CONTROLE (BTC/SATS - BRL/USD) */}
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

        {/* ÁREA PRINCIPAL EM GRID (versão desktop organizada) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mb-6">
          {/* Lado esquerdo (estatísticas) - Ocupa 4/12 colunas no desktop */}
          <div className="xl:col-span-4">
            <StatisticsCards 
              entries={entries} 
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
            />
          </div>

          {/* Lado direito com cotação e formulário (ocupa 8/12 colunas no desktop) */}
          <div className="xl:col-span-8">
            <div className="flex flex-col gap-5">
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
        </div>

        {/* LISTAGEM DE APORTES REGISTRADOS (TABELA) */}
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
