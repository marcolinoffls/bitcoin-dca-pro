
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export type supabaseClient = SupabaseClient<Database>;
export type Tables = Database['public']['Tables'];

export type SidebarNavigationItem = {
  href: string;
  title: string;
  icon: React.ElementType;
};

export type BitcoinEntry = {
  id: string;
  date: Date;
  amountInvested: number;
  btcAmount: number;
  exchangeRate: number;
  currency: 'BRL' | 'USD';
  origin?: 'corretora' | 'p2p' | 'planilha';
};

export type CurrentRate = {
  brl: number;
  usd: number;
  lastUpdated: Date;
};
