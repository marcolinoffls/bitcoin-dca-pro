
import { useState, useEffect } from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { fetchCurrentBitcoinRate } from '@/services/bitcoinService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useBitcoinEntries() {
  const [entries, setEntries] = useState<BitcoinEntry[]>([]);
  const [currentRate, setCurrentRate] = useState<CurrentRate>({
    usd: 0,
    brl: 0,
    timestamp: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<BitcoinEntry | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch entries if user is logged in
    if (user) {
      fetchEntries();
    }
    
    // Always fetch current BTC rate
    updateCurrentRate();
  }, [user]);

  // Update the quote every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      updateCurrentRate();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchEntries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('aportes')
        .select('*')
        .order('data_aporte', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Convert Supabase data to app's BitcoinEntry format
        const formattedEntries: BitcoinEntry[] = data.map(entry => ({
          id: entry.id,
          date: new Date(entry.data_aporte),
          amountInvested: Number(entry.valor_investido),
          btcAmount: Number(entry.bitcoin),
          exchangeRate: Number(entry.cotacao),
          currency: entry.moeda as 'BRL' | 'USD',
          originType: entry.origem_aporte as 'corretora' | 'p2p'
        }));
        
        setEntries(formattedEntries);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar seus aportes do banco de dados.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCurrentRate = async () => {
    setIsLoading(true);
    try {
      const rate = await fetchCurrentBitcoinRate();
      setCurrentRate(rate);
    } catch (error) {
      console.error('Failed to fetch current rate:', error);
      toast({
        title: 'Erro ao buscar cotação',
        description: 'Não foi possível atualizar a cotação atual do Bitcoin.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    originType: 'corretora' | 'p2p' = 'corretora'
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
      // Update existing entry in Supabase
      try {
        const { error } = await supabase
          .from('aportes')
          .update({
            data_aporte: date.toISOString().split('T')[0],
            moeda: currency,
            cotacao_moeda: currency,
            valor_investido: amountInvested,
            bitcoin: btcAmount,
            cotacao: exchangeRate,
            origem_aporte: originType
          })
          .eq('id', editingEntry.id);

        if (error) throw error;

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
                originType
              }
            : entry
        );
        
        setEntries(updatedEntries);
        setEditingEntry(null);
        
        toast({
          title: 'Aporte atualizado',
          description: 'Seu aporte de Bitcoin foi atualizado com sucesso.',
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
      // Add new entry to Supabase
      try {
        const newEntryId = uuidv4();
        const { error } = await supabase
          .from('aportes')
          .insert({
            data_aporte: date.toISOString().split('T')[0],
            moeda: currency,
            cotacao_moeda: currency,
            valor_investido: amountInvested,
            bitcoin: btcAmount,
            cotacao: exchangeRate,
            origem_aporte: originType,
            user_id: user.id
          });

        if (error) throw error;

        // Add to local state
        const newEntry: BitcoinEntry = {
          id: newEntryId,
          date,
          amountInvested,
          btcAmount,
          exchangeRate,
          currency,
          originType
        };

        setEntries(prev => [newEntry, ...prev]);

        toast({
          title: 'Aporte registrado',
          description: 'Seu aporte de Bitcoin foi registrado com sucesso.',
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
      const { error } = await supabase
        .from('aportes')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
