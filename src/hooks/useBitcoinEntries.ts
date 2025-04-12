
import { useState, useEffect } from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useBitcoinRate } from '@/hooks/useBitcoinRate';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import * as entryService from '@/services/bitcoinEntryService';

export function useBitcoinEntries() {
  const [entries, setEntries] = useState<BitcoinEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<BitcoinEntry | undefined>(undefined);
  const { currentRate, isLoading, updateCurrentRate } = useBitcoinRate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Carregar entradas ao inicializar
  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const fetchedEntries = await entryService.fetchBitcoinEntries();
      setEntries(fetchedEntries);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      toast({
        title: 'Erro ao buscar dados',
        description: 'Não foi possível carregar seus aportes.',
        variant: 'destructive',
      });
    }
  };

  const addEntry = async (
    amountInvested: number, 
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p'
  ) => {
    if (!user) {
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para registrar aportes.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const newEntry = await entryService.createBitcoinEntry(
        user.id,
        amountInvested,
        btcAmount,
        exchangeRate,
        currency,
        date,
        origin
      );
      
      setEntries((currentEntries) => [newEntry, ...currentEntries]);
      
      toast({
        title: 'Aporte registrado',
        description: 'Seu aporte foi registrado com sucesso!',
      });
    } catch (error) {
      console.error('Failed to create entry:', error);
      toast({
        title: 'Erro ao registrar',
        description: 'Não foi possível salvar seu aporte.',
        variant: 'destructive',
      });
    }
  };

  const editEntry = (entry: BitcoinEntry) => {
    setEditingEntry(entry);
  };

  const cancelEdit = () => {
    setEditingEntry(undefined);
  };

  const deleteEntry = async (entryId: string) => {
    try {
      await entryService.deleteBitcoinEntry(entryId);
      
      setEntries((currentEntries) => 
        currentEntries.filter((entry) => entry.id !== entryId)
      );
      
      toast({
        title: 'Aporte removido',
        description: 'Seu aporte foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover seu aporte.',
        variant: 'destructive',
      });
    }
  };

  return {
    entries,
    currentRate,
    isLoading,
    editingEntry,
    addEntry,
    editEntry,
    cancelEdit,
    deleteEntry,
    updateCurrentRate,
  };
}
