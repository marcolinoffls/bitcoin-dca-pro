
import { BitcoinEntry, CurrentRate } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetches all bitcoin entries from the database
 */
export const fetchBitcoinEntries = async () => {
  const { data, error } = await supabase
    .from('aportes')
    .select('*')
    .order('data_aporte', { ascending: false });

  if (error) {
    throw error;
  }

  // Convert Supabase data to app's BitcoinEntry format
  const formattedEntries: BitcoinEntry[] = data?.map(entry => ({
    id: entry.id,
    date: new Date(entry.data_aporte),
    amountInvested: Number(entry.valor_investido),
    btcAmount: Number(entry.bitcoin),
    exchangeRate: Number(entry.cotacao),
    currency: entry.moeda as 'BRL' | 'USD',
    origin: entry.origem_aporte as 'corretora' | 'p2p',
  })) || [];
  
  return formattedEntries;
};

/**
 * Creates a new bitcoin entry in the database
 */
export const createBitcoinEntry = async (
  userId: string,
  amountInvested: number,
  btcAmount: number,
  exchangeRate: number,
  currency: 'BRL' | 'USD',
  date: Date,
  origin: 'corretora' | 'p2p'
) => {
  const newEntryId = uuidv4();
  const { error } = await supabase
    .from('aportes')
    .insert({
      id: newEntryId,
      data_aporte: date.toISOString().split('T')[0],
      moeda: currency,
      cotacao_moeda: currency,
      valor_investido: amountInvested,
      bitcoin: btcAmount,
      cotacao: exchangeRate,
      origem_aporte: origin,
      user_id: userId
    });

  if (error) {
    throw error;
  }

  return {
    id: newEntryId,
    date,
    amountInvested,
    btcAmount,
    exchangeRate,
    currency,
    origin,
  };
};

/**
 * Updates an existing bitcoin entry in the database
 */
export const updateBitcoinEntry = async (
  entryId: string,
  amountInvested: number,
  btcAmount: number,
  exchangeRate: number,
  currency: 'BRL' | 'USD',
  date: Date,
  origin: 'corretora' | 'p2p'
) => {
  const { error } = await supabase
    .from('aportes')
    .update({
      data_aporte: date.toISOString().split('T')[0],
      moeda: currency,
      cotacao_moeda: currency,
      valor_investido: amountInvested,
      bitcoin: btcAmount,
      cotacao: exchangeRate,
      origem_aporte: origin
    })
    .eq('id', entryId);

  if (error) {
    throw error;
  }
};

/**
 * Deletes a bitcoin entry from the database
 */
export const deleteBitcoinEntry = async (entryId: string) => {
  const { error } = await supabase
    .from('aportes')
    .delete()
    .eq('id', entryId);

  if (error) {
    throw error;
  }
};
