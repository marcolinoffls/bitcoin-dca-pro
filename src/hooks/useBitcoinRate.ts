
import { useState, useEffect } from 'react';
import { CurrentRate } from '@/types';
import { fetchCurrentBitcoinRate } from '@/services/bitcoinService';
import { useToast } from '@/components/ui/use-toast';

export function useBitcoinRate() {
  // Inicialização com um timestamp real para evitar erros de formatação
  const [currentRate, setCurrentRate] = useState<CurrentRate>({
    usd: 0,
    brl: 0,
    timestamp: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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

  useEffect(() => {
    updateCurrentRate();
    
    // Update the quote every 5 minutes
    const interval = setInterval(() => {
      updateCurrentRate();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentRate,
    isLoading,
    updateCurrentRate
  };
}
