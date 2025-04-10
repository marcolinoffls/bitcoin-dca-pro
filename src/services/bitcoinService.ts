
import { BitcoinEntry, CurrentRate } from "@/types";

// Funções para buscar a cotação atual
export const fetchCurrentBitcoinRate = async (): Promise<CurrentRate> => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_last_updated_at=true"
    );
    const data = await response.json();
    
    return {
      usd: data.bitcoin.usd,
      brl: data.bitcoin.brl,
      timestamp: new Date(data.bitcoin.last_updated_at * 1000)
    };
  } catch (error) {
    console.error("Error fetching Bitcoin rates:", error);
    // Retorna valores padrão em caso de erro
    return {
      usd: 0,
      brl: 0,
      timestamp: new Date()
    };
  }
};

// Funções para cálculos estatísticos
export const calculateTotalBitcoin = (entries: BitcoinEntry[]): number => {
  return entries.reduce((total, entry) => total + entry.btcAmount, 0);
};

export const calculatePercentageChange = (buyRate: number, currentRate: number): number => {
  return ((currentRate - buyRate) / buyRate) * 100;
};

export const calculateAverageByPeriod = (
  entries: BitcoinEntry[],
  period: 'month' | 'year' | 'all'
): number => {
  if (entries.length === 0) return 0;

  const now = new Date();
  let filteredEntries = entries;

  if (period === 'month') {
    filteredEntries = entries.filter(
      (entry) => 
        entry.date.getMonth() === now.getMonth() && 
        entry.date.getFullYear() === now.getFullYear()
    );
  } else if (period === 'year') {
    filteredEntries = entries.filter(
      (entry) => entry.date.getFullYear() === now.getFullYear()
    );
  }

  if (filteredEntries.length === 0) return 0;

  const totalInvested = filteredEntries.reduce(
    (sum, entry) => sum + entry.amountInvested, 
    0
  );
  const totalBtc = filteredEntries.reduce(
    (sum, entry) => sum + entry.btcAmount, 
    0
  );

  return totalBtc > 0 ? totalInvested / totalBtc : 0;
};
