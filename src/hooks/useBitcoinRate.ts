
import { useState, useEffect } from 'react';
import { CurrentRate, PriceVariation } from '@/types';
import { fetchCurrentBitcoinRate, fetchBitcoinPriceVariation } from '@/services/bitcoin'; // Atualizado o caminho de importação
import { useToast } from '@/components/ui/use-toast';

// Objeto padrão a ser usado quando não há dados disponíveis
const defaultRate: CurrentRate = {
  usd: 0,
  brl: 0,
  timestamp: new Date(),
};

const defaultVariation: PriceVariation = {
  day: 0,
  week: 0,
  month: 0,
  year: 0,
  timestamp: new Date(),
};

export function useBitcoinRate() {
  // Inicialização com valores padrão seguros
  const [currentRate, setCurrentRate] = useState<CurrentRate>(defaultRate);

  // Estado para armazenar as variações de preço
  const [priceVariation, setPriceVariation] = useState<PriceVariation>(defaultVariation);

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
      
      // Garantir que temos valores válidos antes de atualizar o estado
      if (rate && typeof rate.usd === 'number' && typeof rate.brl === 'number') {
        setCurrentRate(rate);
      } else {
        console.warn('Dados de taxa recebidos inválidos:', rate);
        // Não atualizamos o estado, mantendo o valor anterior ou padrão
      }
      
      if (variation) {
        setPriceVariation(variation);
      }
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
