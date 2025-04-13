import { supabase } from '@/integrations/supabase/client';
import { BitcoinEntry } from '@/types';

/**
 * Busca todos os aportes de Bitcoin do usuário logado no Supabase.
 * @returns Uma Promise com a lista de aportes ou um erro.
 */
export const fetchBitcoinEntries = async (): Promise<BitcoinEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('aportes')
      .select('*')
      .order('data_aporte', { ascending: false });

    if (error) {
      console.error("Erro ao buscar aportes:", error);
      throw new Error(error.message);
    }

    // Mapeia os dados do Supabase para o tipo BitcoinEntry
    const bitcoinEntries: BitcoinEntry[] = data.map(entry => ({
      id: entry.id,
      date: new Date(entry.data_aporte),
      amountInvested: entry.valor_investido,
      btcAmount: entry.bitcoin,
      exchangeRate: entry.cotacao,
      currency: entry.moeda as 'BRL' | 'USD',
      origin: entry.origem_aporte as 'corretora' | 'p2p' | 'planilha'
    }));

    return bitcoinEntries;
  } catch (error: any) {
    console.error("Erro ao buscar aportes:", error);
    throw new Error(error.message);
  }
};

/**
 * Atualiza um aporte de Bitcoin existente no Supabase.
 * @param id ID do aporte a ser atualizado.
 * @param amountInvested Novo valor investido.
 * @param bitcoinAmount Nova quantidade de Bitcoin.
 * @param exchangeRate Nova cotação do Bitcoin.
 * @param currency Moeda utilizada ('BRL' ou 'USD').
 * @param date Nova data do aporte.
 * @param origin Nova origem do aporte.
 * @returns Uma Promise que resolve se a atualização for bem-sucedida ou rejeita com um erro.
 */
export const updateBitcoinEntry = async (
  id: string,
  amountInvested: number,
  bitcoinAmount: number,
  exchangeRate: number,
  currency: 'BRL' | 'USD',
  date: Date,
  origin: 'corretora' | 'p2p' | 'planilha'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('aportes')
      .update({
        valor_investido: amountInvested,
        bitcoin: bitcoinAmount,
        cotacao: exchangeRate,
        moeda: currency,
        data_aporte: date.toISOString().split('T')[0],
        origem_aporte: origin
      })
      .eq('id', id);

    if (error) {
      console.error("Erro ao atualizar aporte:", error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error("Erro ao atualizar aporte:", error);
    throw new Error(error.message);
  }
};

/**
 * Deleta um aporte de Bitcoin do Supabase.
 * @param id ID do aporte a ser deletado.
 * @returns Uma Promise que resolve se a exclusão for bem-sucedida ou rejeita com um erro.
 */
export const deleteBitcoinEntry = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('aportes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Erro ao excluir aporte:", error);
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error("Erro ao excluir aporte:", error);
    throw new Error(error.message);
  }
};
