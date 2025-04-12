
/**
 * Fornece as funções para interagir com os aportes de Bitcoin no Supabase
 * - Busca todos os aportes
 * - Cria novos aportes
 * - Atualiza aportes existentes
 * - Exclui aportes
 * 
 * Atualizações:
 * - Corrigido problema de atualização da data não ser persistida corretamente
 * - Adicionados logs para monitorar as conversões de data
 * - Melhorada a manipulação dos valores para conversão correta entre string e number
 * - Adicionada verificação extra para garantir que a data seja formatada corretamente
 */

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
  // Formata a data para o formato ISO (YYYY-MM-DD)
  const formattedDate = date.toISOString().split('T')[0];
  console.log('Data sendo enviada para criação:', formattedDate);
  
  const newEntryId = uuidv4();
  const { error } = await supabase
    .from('aportes')
    .insert({
      id: newEntryId,
      data_aporte: formattedDate,
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
  // Garantir que a data é um objeto Date válido
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Data inválida:', date);
    throw new Error('Data inválida fornecida para atualização');
  }
  
  // Formata a data para o formato ISO (YYYY-MM-DD)
  const formattedDate = date.toISOString().split('T')[0];
  console.log('Data sendo enviada para atualização:', formattedDate, 'Objeto Date original:', date);
  
  const updateData = {
    data_aporte: formattedDate,
    moeda: currency,
    cotacao_moeda: currency,
    valor_investido: amountInvested,
    bitcoin: btcAmount,
    cotacao: exchangeRate,
    origem_aporte: origin
  };
  
  console.log('Dados completos sendo enviados para atualização:', updateData);
  
  const { error, data } = await supabase
    .from('aportes')
    .update(updateData)
    .eq('id', entryId)
    .select();

  if (error) {
    console.error('Erro ao atualizar o aporte no Supabase:', error);
    throw error;
  } else {
    console.log('Aporte atualizado com sucesso no Supabase:', entryId);
    console.log('Resposta do Supabase após atualização:', data);
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
