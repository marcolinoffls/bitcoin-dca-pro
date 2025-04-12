
import { useState, useEffect } from 'react';
import { BitcoinEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useBitcoinRate } from '@/hooks/useBitcoinRate';
import { 
  fetchBitcoinEntries, 
  createBitcoinEntry, 
  updateBitcoinEntry, 
  deleteBitcoinEntry 
} from '@/services/bitcoinEntryService';

// Removemos o import do CheckCircle, pois não podemos usar JSX diretamente aqui

export function useBitcoinEntries() {
  const [entries, setEntries] = useState<BitcoinEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<BitcoinEntry | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentRate, isLoading, updateCurrentRate } = useBitcoinRate();

  useEffect(() => {
    // Only fetch entries if user is logged in
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    
    try {
      const data = await fetchBitcoinEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar seus aportes do banco de dados.',
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
    origin: 'corretora' | 'p2p' = 'corretora'
  ) => {
    if (!user) {
      toast({
        title: 'Erro ao registrar',
        description: 'Você precisa estar logado para registrar um aporte.',
        variant: 'destructive',
      });
      return;
    }

    if (editingEntry) {
      try {
        await updateBitcoinEntry(
          editingEntry.id,
          amountInvested,
          btcAmount,
          exchangeRate,
          currency,
          date,
          origin
        );

        // Update local state
        const updatedEntries = entries.map(entry => 
          entry.id === editingEntry.id 
            ? {
                ...entry,
                amountInvested,
                btcAmount,
                exchangeRate,
                currency,
                date,
                origin
              }
            : entry
        );
        
        setEntries(updatedEntries);
        setEditingEntry(null);
        
        // Usando apenas o objeto de configuração sem JSX
        toast({
          title: 'Aporte atualizado',
          description: 'Seu aporte de Bitcoin foi atualizado com sucesso.',
          variant: 'success',
        });
      } catch (error) {
        console.error('Error updating entry:', error);
        toast({
          title: 'Erro ao atualizar',
          description: 'Ocorreu um erro ao atualizar o aporte.',
          variant: 'destructive',
        });
      }
    } else {
      try {
        const newEntry = await createBitcoinEntry(
          user.id,
          amountInvested,
          btcAmount,
          exchangeRate,
          currency,
          date,
          origin
        );

        setEntries(prev => [newEntry, ...prev]);

        // Usando apenas o objeto de configuração sem JSX
        toast({
          title: 'Aporte registrado',
          description: 'Seu aporte de Bitcoin foi registrado com sucesso.',
          variant: 'success',
        });
      } catch (error) {
        console.error('Error adding entry:', error);
        toast({
          title: 'Erro ao registrar',
          description: 'Ocorreu um erro ao registrar o aporte.',
          variant: 'destructive',
        });
      }
    }
  };

  const editEntry = (id: string) => {
    const entry = entries.find(entry => entry.id === id);
    if (entry) {
      setEditingEntry(entry);
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;
    
    try {
      await deleteBitcoinEntry(id);

      // Update local state
      const updatedEntries = entries.filter((entry) => entry.id !== id);
      setEntries(updatedEntries);

      toast({
        title: 'Registro removido',
        description: 'O registro foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Ocorreu um erro ao remover o aporte.',
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
