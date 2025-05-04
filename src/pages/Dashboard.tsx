
/**
 * Página do Dashboard
 * 
 * Esta página exibe informações do dashboard do usuário, incluindo:
 * - Cards com estatísticas de Bitcoin
 * - Cotação atual e preço médio
 * - Fear & Greed Index
 * - Aporte mais recente
 * 
 * Utiliza vários hooks personalizados para buscar e exibir dados.
 */

import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import CurrentRateCard from '@/components/CurrentRateCard';
import AveragePriceCard from '@/components/AveragePriceCard';
import StatisticsCards from '@/components/StatisticsCards';
import ToggleCurrency from '@/components/ToggleCurrency';
import ToggleDisplayUnit from '@/components/ToggleDisplayUnit';
import EntryForm from '@/components/EntryForm';
import EntriesList from '@/components/EntriesList';
import { useToast } from '@/hooks/use-toast';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import { useBitcoinRate } from '@/hooks/useBitcoinRate';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { BitcoinEntry, Origin } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import FearGreedIndex from '@/components/FearGreedIndex';

export default function Dashboard() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Armazenamento local para preferências do usuário
  const [selectedCurrency, setSelectedCurrency] = useLocalStorage<'BRL' | 'USD'>(
    'bitcoinDcaPro-currency',
    'BRL'
  );
  
  const [displayUnit, setDisplayUnit] = useLocalStorage<'BTC' | 'SATS'>(
    'bitcoinDcaPro-displayUnit',
    'BTC'
  );
  
  // Estado para gerenciar formulários e seções colapsáveis
  const [editingEntryId, setEditingEntryId] = useState<string>('');
  const [showNewEntryForm, setShowNewEntryForm] = useState<boolean>(!isMobile);
  
  // Hooks para buscar dados do Bitcoin
  const { entries, addEntry, updateEntry, deleteEntry, isLoading: entriesLoading } = useBitcoinEntries();
  const { 
    currentRate, 
    priceVariation,
    refreshRates, 
    isLoading: ratesLoading 
  } = useBitcoinRate();
  
  const queryClient = useQueryClient();
  
  // Garante que o formulário seja mostrado automaticamente em desktop
  useEffect(() => {
    if (!isMobile) {
      setShowNewEntryForm(true);
    }
  }, [isMobile]);

  // Gerenciamento de edição de entradas
  const editEntry = (id: string) => {
    setEditingEntryId(id);
  };

  const handleToggleCurrency = (currency: 'BRL' | 'USD') => {
    setSelectedCurrency(currency);
  };

  const handleToggleDisplayUnit = (unit: 'BTC' | 'SATS') => {
    setDisplayUnit(unit);
  };

  // Manipulação de adição de nova entrada
  const handleAddEntry = async (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: Origin
  ) => {
    try {
      if (editingEntryId) {
        await updateEntry(editingEntryId, {
          amountInvested,
          btcAmount,
          exchangeRate,
          currency,
          date,
          origin,
        });
        
        toast({
          title: "Aporte atualizado",
          description: "Aporte atualizado com sucesso",
        });
        
        setEditingEntryId("");
      } else {
        await addEntry({
          amountInvested,
          btcAmount,
          exchangeRate,
          currency,
          date,
          origin,
        });
        
        queryClient.invalidateQueries({ queryKey: ["entries"] });
      }
    } catch (error) {
      toast({
        title: "Erro ao adicionar aporte",
        description: "Não foi possível adicionar o aporte",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntryId("");
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({
        title: "Aporte excluído",
        description: "Aporte excluído com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir aporte",
        description: "Não foi possível excluir o aporte",
        variant: "destructive",
      });
    }
  };

  // Encontra a entrada que está sendo editada atualmente
  const editingEntry = entries?.find((entry: BitcoinEntry) => entry.id === editingEntryId);

  return (
    <>
      <Helmet>
        <title>Dashboard | Bitcoin DCA Pro</title>
      </Helmet>

      <MainLayout>
        <div className="container mx-auto py-6">
          {/* Cabeçalho com Toggle de Moeda/Unidade */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex gap-2">
              <ToggleDisplayUnit
                displayUnit={displayUnit}
                onToggle={handleToggleDisplayUnit}
              />
              <ToggleCurrency
                selectedCurrency={selectedCurrency}
                onToggle={handleToggleCurrency}
              />
            </div>
          </div>

          {/* Grade de cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CurrentRateCard
              currentRate={currentRate}
              priceVariation={priceVariation}
              isLoading={ratesLoading}
              onRefresh={refreshRates}
            />
            
            <AveragePriceCard
              entries={entries || []}
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              isLoading={entriesLoading || ratesLoading}
            />
            
            <FearGreedIndex />
          </div>

          {/* Status Cards/Portfolio */}
          <div className="mt-6">
            <StatisticsCards
              entries={entries || []}
              currentRate={currentRate}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
              isLoading={entriesLoading || ratesLoading}
            />
          </div>

          {/* Formulário de novo aporte (colapsável em mobile) */}
          {isMobile && (
            <div className="mt-6">
              <Button
                onClick={() => setShowNewEntryForm(!showNewEntryForm)}
                variant="outline"
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left border border-gray-200"
              >
                <div className="flex items-center">
                  <div className="h-6 w-6 mr-2">
                    <img 
                      src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/novo-aporte.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvbm92by1hcG9ydGUucG5nIiwiaWF0IjoxNzQ0NDk3MTY4LCJleHAiOjE3NzYwMzMxNjh9.gSYsPjL3OqW6iNLDHtvyuoYh6SBlJUm30UL16I4NPI8" 
                      alt="Novo Aporte"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="font-medium">{editingEntryId ? "Editar Aporte" : "Novo Aporte"}</span>
                </div>
                {showNewEntryForm ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}

          {/* Form colapsável de novo aporte */}
          {showNewEntryForm && (
            <div className="mt-6">
              <EntryForm
                onAddEntry={handleAddEntry}
                currentRate={currentRate}
                editingEntry={editingEntry}
                onCancelEdit={handleCancelEdit}
                displayUnit={displayUnit}
              />
            </div>
          )}

          {/* Lista de aportes */}
          {!entriesLoading && entries && (
            <EntriesList
              entries={entries}
              currentRate={currentRate}
              onDelete={handleDeleteEntry}
              onEdit={editEntry}
              selectedCurrency={selectedCurrency}
              displayUnit={displayUnit}
              isLoading={entriesLoading}
            />
          )}
        </div>
      </MainLayout>
    </>
  );
}
