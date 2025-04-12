
/**
 * Hook: useBitcoinEntries
 *
 * Gerencia toda a lógica de aportes:
 * - Busca aportes no Supabase
 * - Permite adicionar, editar e excluir aportes
 * - Integra com a cotação atual do Bitcoin
 *
 * Utiliza React Query para cache e atualização reativa
 * 
 * Atualizações:
 * - Corrigido o problema de atualização da data no Supabase
 * - Adicionado log detalhado para acompanhar a atualização dos aportes
 * - Garantida a invalidação do cache de queries após operações
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BitcoinEntry, CurrentRate } from '@/types';
import { fetchCurrentBitcoinRate } from '@/services/bitcoinService';

// Interface para mapear os dados do Supabase para os tipos da aplicação
interface SupabaseAporte {
  id: string;
  data_aporte: string;
  valor_investido: number;
  bitcoin: number;
  cotacao: number;
  moeda: 'BRL' | 'USD';
  origem_aporte: 'corretora' | 'p2p';
  user_id: string;
  cotacao_moeda: string;
  created_at: string;
}

export const useBitcoinEntries = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estado local para armazenar o aporte sendo editado
  const [editingEntry, setEditingEntry] = useState<BitcoinEntry | null>(null);

  /**
   * Busca lista de aportes do usuário logado
   */
  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['entries'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('aportes')
        .select('*')
        .eq('user_id', user.id)
        .order('data_aporte', { ascending: false });

      if (error) throw error;
      
      // Converte os dados do formato do Supabase para o formato da aplicação
      const formattedEntries = (data as SupabaseAporte[]).map(item => ({
        id: item.id,
        date: new Date(item.data_aporte),
        amountInvested: item.valor_investido,
        btcAmount: item.bitcoin,
        exchangeRate: item.cotacao,
        currency: item.moeda,
        origin: item.origem_aporte,
      })) as BitcoinEntry[];
      
      console.log('Aportes carregados do Supabase:', formattedEntries);
      return formattedEntries;
    },
    enabled: !!user,
  });

  /**
   * Busca cotação atual do Bitcoin (USD e BRL)
   */
  const { data: currentRate, refetch: refetchRate } = useQuery({
    queryKey: ['currentRate'],
    queryFn: async () => {
      return await fetchCurrentBitcoinRate();
    },
    staleTime: 1000 * 60, // Atualiza a cada 1 minuto
  });

  /**
   * Adiciona um novo aporte
   */
  const addEntry = async (entry: Partial<BitcoinEntry>) => {
    if (!user) return;
    
    const { date, amountInvested, btcAmount, exchangeRate, currency, origin } = entry;
    
    if (!date || amountInvested === undefined || btcAmount === undefined || 
        exchangeRate === undefined || !currency || !origin) {
      throw new Error("Dados incompletos para criar aporte");
    }
    
    const { error } = await supabase.from('aportes').insert([{
      user_id: user.id,
      data_aporte: date.toISOString().split('T')[0],
      valor_investido: amountInvested,
      bitcoin: btcAmount,
      cotacao: exchangeRate,
      moeda: currency,
      cotacao_moeda: currency,
      origem_aporte: origin
    }]);
    
    if (error) throw error;

    // Atualiza lista após inserção
    await queryClient.invalidateQueries({ queryKey: ['entries'] });
  };

  /**
   * Atualiza um aporte existente
   */
  const updateEntry = async (entryId: string, updatedFields: Partial<BitcoinEntry>) => {
    if (!user) return;
    
    console.log('Iniciando atualização do aporte:', entryId);
    console.log('Campos a atualizar:', updatedFields);
    
    // Converte do formato da aplicação para o formato do Supabase
    const supabaseData: Partial<SupabaseAporte> = {};
    
    if (updatedFields.date) {
      // Garante que a data seja formatada corretamente para o Supabase (YYYY-MM-DD)
      const formattedDate = updatedFields.date.toISOString().split('T')[0];
      supabaseData.data_aporte = formattedDate;
      console.log('Data formatada para o Supabase:', formattedDate);
    }
    if (updatedFields.amountInvested !== undefined) {
      supabaseData.valor_investido = updatedFields.amountInvested;
    }
    if (updatedFields.btcAmount !== undefined) {
      supabaseData.bitcoin = updatedFields.btcAmount;
    }
    if (updatedFields.exchangeRate !== undefined) {
      supabaseData.cotacao = updatedFields.exchangeRate;
    }
    if (updatedFields.currency) {
      supabaseData.moeda = updatedFields.currency;
      supabaseData.cotacao_moeda = updatedFields.currency;
    }
    if (updatedFields.origin) {
      supabaseData.origem_aporte = updatedFields.origin;
    }

    console.log('Dados preparados para envio ao Supabase:', supabaseData);

    const { error } = await supabase
      .from('aportes')
      .update(supabaseData)
      .eq('id', entryId);

    if (error) {
      console.error('Erro ao atualizar no Supabase:', error);
      throw error;
    }

    console.log('Aporte atualizado com sucesso no Supabase');

    // Força a atualização da lista após edição - CRUCIAL PARA REFLETIR MUDANÇAS
    await queryClient.invalidateQueries({ queryKey: ['entries'] });
    setEditingEntry(null); // Limpa estado de edição
  };

  /**
   * Exclui um aporte existente
   */
  const deleteEntry = async (entryId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('aportes')
      .delete()
      .eq('id', entryId);
      
    if (error) throw error;

    await queryClient.invalidateQueries({ queryKey: ['entries'] }); // Atualiza lista após exclusão
  };

  /**
   * Coloca um aporte em modo de edição
   */
  const editEntry = (entry: BitcoinEntry) => {
    setEditingEntry(entry);
  };

  /**
   * Cancela edição de aporte
   */
  const cancelEdit = () => {
    setEditingEntry(null);
  };

  /**
   * Atualiza manualmente a cotação do Bitcoin
   */
  const updateCurrentRate = () => {
    queryClient.invalidateQueries({ queryKey: ['currentRate'] });
  };

  return {
    entries,
    isLoading,
    currentRate,
    editingEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    editEntry,
    cancelEdit,
    updateCurrentRate,
    refetch,
  };
};
