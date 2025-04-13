
import { useState, useEffect } from 'react';
import { CurrentRate, PriceVariation } from '@/types';
import { fetchCurrentBitcoinRate, fetchBitcoinPriceVariation } from '@/services/bitcoinService';
import { useToast } from '@/components/ui/use-toast';

export function useBitcoinRate() {
  // Inicialização com um timestamp real para evitar erros de formatação
  const [currentRate, setCurrentRate] = useState<CurrentRate>({
    usd: 0,
    brl: 0,
    timestamp: new Date(),
  });

  // Estado para armazenar as variações de preço
  const [priceVariation, setPriceVariation] = useState<PriceVariation>({
    day: 0,
    week: 0,
    month: 0,
    year: 0,
    timestamp: new Date(),
  });

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const updateCurrentRate = async () => {
    setIsLoading(true);
    try {
      // Buscar taxa atual e variações de preço em paralelo
      const [rate, variation] = await Promise.all([
        fetchCurrentBitcoinRate(),
        fetchBitcoinPriceVariation()
      ]);
      
      setCurrentRate(rate);
      setPriceVariation(variation);
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
    priceVariation,
    isLoading,
    updateCurrentRate
  };
}
