
export interface BitcoinEntry {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: 'BRL' | 'USD';
}

export interface CurrentRate {
  usd: number;
  brl: number;
  timestamp: Date;
}
