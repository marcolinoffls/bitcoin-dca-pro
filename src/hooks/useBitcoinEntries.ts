
import { useState, useEffect } from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import { fetchCurrentBitcoinRate } from '@/services/bitcoinService';

export function useBitcoinEntries() {
  const [entries, setEntries] = useState<BitcoinEntry[]>([]);
  const [currentRate, setCurrentRate] = useState<CurrentRate>({
    usd: 0,
    brl: 0,
    timestamp: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar entradas do localStorage
    const savedEntries = localStorage.getItem('bitcoin-entries');
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries);
        const formattedEntries = parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
        }));
        setEntries(formattedEntries);
      } catch (error) {
        console.error('Error parsing saved entries:', error);
        toast({
          title: 'Erro ao carregar registros',
          description: 'Não foi possível carregar seus registros anteriores.',
          variant: 'destructive',
        });
      }
    }

    // Buscar cotação atual
    updateCurrentRate();
  }, []);

  // Atualizar a cotação a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      updateCurrentRate();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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

  const addEntry = (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD'
  ) => {
    const newEntry: BitcoinEntry = {
      id: uuidv4(),
      date: new Date(),
      amountInvested,
      btcAmount,
      exchangeRate,
      currency,
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    saveEntriesToLocalStorage(updatedEntries);

    toast({
      title: 'Aporte registrado',
      description: 'Seu aporte de Bitcoin foi registrado com sucesso.',
    });
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    saveEntriesToLocalStorage(updatedEntries);

    toast({
      title: 'Registro removido',
      description: 'O registro foi removido com sucesso.',
    });
  };

  const saveEntriesToLocalStorage = (entriesToSave: BitcoinEntry[]) => {
    localStorage.setItem('bitcoin-entries', JSON.stringify(entriesToSave));
  };

  return {
    entries,
    currentRate,
    isLoading,
    addEntry,
    deleteEntry,
    updateCurrentRate,
  };
}
