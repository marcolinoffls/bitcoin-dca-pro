
import { BitcoinEntry } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetches all Bitcoin entries for the current user from Supabase
 */
export const fetchEntriesFromSupabase = async (userId: string) => {
  const { data, error } = await supabase
    .from('aportes')
    .select('*')
    .order('data_aporte', { ascending: false });

  if (error) {
    throw error;
  }

  // Convert Supabase data to app's BitcoinEntry format
  return data ? mapSupabaseDataToEntries(data) : [];
};

/**
 * Maps raw Supabase data to BitcoinEntry objects
 */
const mapSupabaseDataToEntries = (data: any[]): BitcoinEntry[] => {
  return data.map(entry => ({
    id: entry.id,
    date: new Date(entry.data_aporte),
    amountInvested: Number(entry.valor_investido),
    btcAmount: Number(entry.bitcoin),
    exchangeRate: Number(entry.cotacao),
    currency: entry.moeda as 'BRL' | 'USD',
    origin: entry.origem_aporte as 'corretora' | 'p2p'
  }));
};

/**
 * Adds a new Bitcoin entry to Supabase
 */
export const addEntryToSupabase = async (
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
    origin
  };
};

/**
 * Updates an existing Bitcoin entry in Supabase
 */
export const updateEntryInSupabase = async (
  id: string,
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
    .eq('id', id);

  if (error) {
    throw error;
  }
};

/**
 * Deletes a Bitcoin entry from Supabase
 */
export const deleteEntryFromSupabase = async (id: string) => {
  const { error } = await supabase
    .from('aportes')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};
