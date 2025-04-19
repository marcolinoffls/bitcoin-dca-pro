export interface CurrentRate {
  usd: number;
  brl: number;
}

export type Origin = "planilha" | "corretora" | "p2p";

export interface BitcoinEntry {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: "BRL" | "USD";
  origin?: Origin;
  registrationSource?: "manual" | "planilha";
}
