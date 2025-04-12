export interface BitcoinEntry {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: 'BRL' | 'USD';
  originType?: 'corretora' | 'p2p';
}

export interface CurrentRate {
  usd: number;
  brl: number;
  timestamp: Date;
}
