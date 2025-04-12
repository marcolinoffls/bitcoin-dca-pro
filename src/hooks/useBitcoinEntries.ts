
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
 * - Melhorada a validação da data para garantir que seja salva corretamente
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BitcoinEntry, CurrentRate } from '@/types';
import { fetchCurrentBitcoinRate } from '@/services/bitcoinService';
import { fetchBitcoinEntries, updateBitcoinEntry, deleteBitcoinEntry } from '@/services/bitcoinEntryService';

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
      
      try {
        const entriesData = await fetchBitcoinEntries();
        console.log('Aportes carregados do Supabase:', entriesData);
        return entriesData;
      } catch (error) {
        console.error('Erro ao buscar aportes:', error);
        throw error;
      }
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
    
    // Encontrar a entrada original para preencher os campos faltantes
    const originalEntry = entries.find(e => e.id === entryId);
    if (!originalEntry) {
      console.error('Entrada original não encontrada');
      throw new Error('Entrada não encontrada');
    }
    
    // Garantindo que a data é um objeto Date válido
    let dateToUpdate: Date;
    if (updatedFields.date) {
      if (!(updatedFields.date instanceof Date)) {
        dateToUpdate = new Date(updatedFields.date);
      } else {
        dateToUpdate = updatedFields.date;
      }
      
      // Verificar se a data é válida
      if (isNaN(dateToUpdate.getTime())) {
        console.error('Data inválida:', updatedFields.date);
        throw new Error('Data inválida');
      }
    } else {
      dateToUpdate = originalEntry.date;
    }
    
    // Combinar campos originais com atualizados
    const finalEntry = {
      amountInvested: updatedFields.amountInvested ?? originalEntry.amountInvested,
      btcAmount: updatedFields.btcAmount ?? originalEntry.btcAmount,
      exchangeRate: updatedFields.exchangeRate ?? originalEntry.exchangeRate,
      currency: updatedFields.currency ?? originalEntry.currency,
      date: dateToUpdate,
      origin: updatedFields.origin ?? originalEntry.origin
    };
    
    console.log('Entrada final para atualização:', finalEntry);
    
    try {
      // Usar a função do serviço para atualizar o aporte
      await updateBitcoinEntry(
        entryId,
        finalEntry.amountInvested,
        finalEntry.btcAmount,
        finalEntry.exchangeRate,
        finalEntry.currency,
        finalEntry.date,
        finalEntry.origin
      );
      
      console.log('Aporte atualizado com sucesso via serviço');
      
      // Força a atualização da lista após edição - CRUCIAL PARA REFLETIR MUDANÇAS
      await queryClient.invalidateQueries({ queryKey: ['entries'] });
      setEditingEntry(null); // Limpa estado de edição
    } catch (error) {
      console.error('Erro ao atualizar aporte:', error);
      throw error;
    }
  };

  /**
   * Exclui um aporte existente
   */
  const deleteEntry = async (entryId: string) => {
    if (!user) return;
    
    try {
      await deleteBitcoinEntry(entryId);
      await queryClient.invalidateQueries({ queryKey: ['entries'] }); // Atualiza lista após exclusão
    } catch (error) {
      console.error('Erro ao excluir aporte:', error);
      throw error;
    }
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
