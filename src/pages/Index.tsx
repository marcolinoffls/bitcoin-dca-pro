
/**
 * Página Index
 * 
 * Este é o componente principal da aplicação que exibe:
 * - Os cards com estatísticas (total acumulado, preço médio)
 * - A cotação atual do Bitcoin
 * - O formulário para adicionar novos aportes de Bitcoin
 * - A lista de aportes registrados
 * 
 * Utiliza os hooks personalizados para gerenciar dados e estado da aplicação.
 * Organiza o layout em grid responsivo para diferentes tamanhos de tela.
 */
import React from 'react';
import EntriesList from '@/components/EntriesList';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import StatisticsCards from '@/components/StatisticsCards';
import CurrentRateCard from '@/components/CurrentRateCard';
import CurrencySelector from '@/components/CurrencySelector';
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit';

const IndexPage: React.FC = () => {
  const { 
    entries, 
    isLoading, 
    currentRate, 
    addEntry, 
    updateEntry, 
    deleteEntry,
    importProgress,
    importEntriesFromSpreadsheet,
    refetch,
    selectedCurrency, 
    setSelectedCurrency,
    displayUnit,
    setDisplayUnit
  } = useBitcoinEntries();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleAddEntry = async (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p' | 'planilha'
  ) => {
    try {
      await addEntry({
        amountInvested,
        btcAmount,
        exchangeRate,
        currency,
        date,
        origin
      });
      toast({
        title: "Aporte adicionado!",
        description: "Seu aporte foi registrado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar aporte",
        description: error.message || "Ocorreu um erro ao registrar o aporte.",
        variant: "destructive",
      });
    }
  };

  const handleEditEntry = async (id: string, entry: any) => {
    try {
      await updateEntry(id, entry);
      toast({
        title: "Aporte atualizado!",
        description: "Seu aporte foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar aporte",
        description: error.message || "Ocorreu um erro ao atualizar o aporte.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({
        title: "Aporte excluído!",
        description: "Seu aporte foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir aporte",
        description: error.message || "Ocorreu um erro ao excluir o aporte.",
        variant: "destructive",
      });
    }
  };
  
  const handleImportFile = async (file: File) => {
    try {
      const result = await importEntriesFromSpreadsheet(file);
      toast({
        title: "Importação concluída!",
        description: `Foram adicionados ${result.count} aportes à sua carteira.`,
        variant: "success",
      });
      refetch(); // Atualiza a lista de aportes
      return result;
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar a planilha",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
      <Toaster />
      
      {/* Cabeçalho com seleção de moeda e unidade */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">Bitcoin DCA Pro</h1>
        <div className="flex gap-2 items-center">
          <CurrencySelector 
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
          />
          <ToggleDisplayUnit 
            displayUnit={displayUnit}
            onDisplayUnitChange={setDisplayUnit}
          />
        </div>
      </div>
      
      {/* Layout principal em grid responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna esquerda: Cards de estatísticas e cotação */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cards de estatísticas: Total de BTC e Preço Médio */}
          <StatisticsCards 
            entries={entries}
            currentRate={currentRate}
            selectedCurrency={selectedCurrency}
            displayUnit={displayUnit}
            isLoading={isLoading}
          />
          
          {/* Card de cotação atual */}
          <CurrentRateCard 
            currentRate={currentRate} 
            selectedCurrency={selectedCurrency}
          />
        </div>
        
        {/* Coluna direita: Formulário de entrada */}
        <div className="lg:col-span-8">
          <Card>
            <CardContent className="p-6">
              {currentRate ? (
                <EntryForm 
                  onAddEntry={handleAddEntry} 
                  currentRate={currentRate} 
                  displayUnit={displayUnit}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de aportes em toda a largura */}
        <div className="lg:col-span-12">
          <EntriesList
            entries={entries}
            currentRate={currentRate}
            onDelete={handleDeleteEntry}
            onEdit={handleEditEntry}
            selectedCurrency={selectedCurrency}
            displayUnit={displayUnit}
            isLoading={isLoading}
            importProgress={importProgress}
            onImportFile={handleImportFile}
          />
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
