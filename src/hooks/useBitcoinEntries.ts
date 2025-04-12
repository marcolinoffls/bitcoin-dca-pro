/**
 * Hook: useBitcoinEntries
 *
 * Gerencia toda a lógica de aportes:
 * - Busca aportes no Supabase
 * - Permite adicionar, editar e excluir aportes
 * - Integra com a cotação atual do Bitcoin
 *
 * Utiliza React Query para cache e atualização reativa
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BitcoinEntry, CurrentRate } from '@/types';

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
      return data as BitcoinEntry[];
    },
    enabled: !!user,
  });

  /**
   * Busca cotação atual do Bitcoin (USD e BRL)
   */
  const { data: currentRate } = useQuery<CurrentRate>({
    queryKey: ['currentRate'],
    queryFn: async () => {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl');
      const result = await response.json();
      return {
        usd: result.bitcoin.usd,
        brl: result.bitcoin.brl,
      };
    },
    staleTime: 1000 * 60, // Atualiza a cada 1 minuto
  });

  /**
   * Adiciona um novo aporte
   */
  const addEntry = async (entry: Partial<BitcoinEntry>) => {
    const { error } = await supabase.from('aportes').insert([entry]);
    if (error) throw error;

    await queryClient.invalidateQueries(['entries']); // Atualiza lista após inserção
  };

  /**
   * Atualiza um aporte existente
   */
  const updateEntry = async (entryId: string, updatedFields: Partial<BitcoinEntry>) => {
    const { error } = await supabase
      .from('aportes')
      .update(updatedFields)
      .eq('id', entryId);

    if (error) throw error;

    // ✅ Força a atualização da lista após edição
    await queryClient.invalidateQueries(['entries']);
    setEditingEntry(null); // Limpa estado de edição
  };

  /**
   * Exclui um aporte existente
   */
  const deleteEntry = async (entryId: string) => {
    const { error } = await supabase.from('aportes').delete().eq('id', entryId);
    if (error) throw error;

    await queryClient.invalidateQueries(['entries']); // Atualiza lista após exclusão
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
    queryClient.invalidateQueries(['currentRate']);
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
