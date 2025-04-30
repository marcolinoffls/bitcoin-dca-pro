import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BitcoinEntry, CurrentRate, Origin, AporteDB } from '@/types';
import { createBitcoinEntry } from '@/services/bitcoinEntryService';
import { fetchCurrentBitcoinRate } from '@/services/bitcoin';
import { 
  fetchBitcoinEntries, 
  updateBitcoinEntry, 
  deleteBitcoinEntry,
  deleteAllSpreadsheetEntries
} from '@/services/bitcoinEntryService';

/**
 * Converte string de data para objeto Date, forçando o fuso horário local
 * @param dateString String de data no formato 'YYYY-MM-DD'
 * @returns Objeto Date com o fuso horário local
 */
const parseLocalDate = (dateString: string): Date => {
  // Adiciona o horário T00:00:00 para forçar a interpretação no fuso horário local
  const localDate = new Date(`${dateString}T00:00:00`);
  console.log(`Convertendo data string ${dateString} para objeto Date: ${localDate}`);
  return localDate;
};

/**
 * Hook para gerenciar aportes de Bitcoin
 * 
 * Funcionalidades:
 * - Lista todos os aportes do usuário
 * - Adiciona novos aportes
 * - Atualiza aportes existentes
 * - Remove aportes
 * - Gerencia estado de edição
 * 
 * Atualização:
 * - Adicionado suporte a cotação opcional, calculando automaticamente
 *   quando o valor não é fornecido
 * - Corrigida tipagem para compatibilidade com o Supabase
 */
export const useBitcoinEntries = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Estado local para armazenar o aporte sendo editado
  const [editingEntry, setEditingEntry] = useState<BitcoinEntry | null>(null);
  
  // Efeito para limpar o cache quando o usuário muda
  useEffect(() => {
    // Quando o usuário muda (login, logout ou troca de conta)
    // invalidamos o cache para forçar uma nova busca
    if (user) {
      console.log('Usuário autenticado detectado, invalidando cache de aportes');
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    }
  }, [user?.id, queryClient]);

  /**
   * Busca lista de aportes do usuário logado
   */
  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['entries', user?.id], // Adicionado user.id como parte da chave
    queryFn: async () => {
      if (!user) {
        console.log('Nenhum usuário autenticado, retornando lista vazia');
        return [];
      }
      
      try {
        console.log('Buscando aportes para o usuário:', user.id);
        const entriesData = await fetchBitcoinEntries();
        console.log('Aportes carregados do Supabase:', entriesData);
        return entriesData;
      } catch (error) {
        console.error('Erro ao buscar aportes:', error);
        throw error;
      }
    },
    enabled: !!user, // Ativa a query apenas quando há um usuário
    staleTime: 1000 * 60 * 5, // 5 minutos antes de considerar os dados obsoletos
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
   * Calcula a cotação automaticamente com base no valor investido e quantidade de BTC
   * @param amountInvested Valor investido
   * @param btcAmount Quantidade de BTC
   * @returns Cotação calculada
   */
  const calculateExchangeRate = (amountInvested: number, btcAmount: number): number => {
    if (amountInvested <= 0 || btcAmount <= 0) {
      throw new Error("Valores inválidos para cálculo da cotação");
    }
    return amountInvested / btcAmount;
  };

  /**
   * Adiciona um novo aporte
   */
  const addEntry = async (entry: Partial<BitcoinEntry>) => {
    if (!user) return;
  
    const { date, amountInvested, btcAmount, exchangeRate, currency, origin } = entry;
  
    if (!date || amountInvested === undefined || btcAmount === undefined || 
        !currency || !origin) {
      throw new Error("Dados incompletos para criar aporte");
    }
  
    try {
      // Chama a função centralizada que calcula valor_usd e cotacao_usd_brl
      await createBitcoinEntry(
        user.id,
        amountInvested,
        btcAmount,
        exchangeRate,
        currency,
        date,
        origin
      );
  
      // Atualiza lista após inserção
      await queryClient.invalidateQueries({ queryKey: ['entries'] });
    } catch (error) {
      console.error('Erro ao criar aporte com suporte USD:', error);
      throw error;
    }
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
      if (updatedFields.date instanceof Date) {
        dateToUpdate = updatedFields.date;
      } else {
        // Se for string, converte usando parseLocalDate para garantir timezone local
        dateToUpdate = typeof updatedFields.date === 'string' 
          ? parseLocalDate(updatedFields.date) 
          : new Date(updatedFields.date);
      }
      
      // Verificar se a data é válida
      if (isNaN(dateToUpdate.getTime())) {
        console.error('Data inválida:', updatedFields.date);
        throw new Error('Data inválida');
      }
    } else {
      dateToUpdate = originalEntry.date;
    }
    
    // Valores atualizados ou originais
    const finalAmountInvested = updatedFields.amountInvested ?? originalEntry.amountInvested;
    const finalBtcAmount = updatedFields.btcAmount ?? originalEntry.btcAmount;
    
    // Se a cotação não foi fornecida, calcula automaticamente
    let finalExchangeRate = updatedFields.exchangeRate ?? originalEntry.exchangeRate;
    if (finalExchangeRate <= 0) {
      finalExchangeRate = calculateExchangeRate(finalAmountInvested, finalBtcAmount);
      console.log('Cotação calculada automaticamente durante atualização:', finalExchangeRate);
    }
    
    // Combinar campos originais com atualizados
    const finalEntry = {
      amountInvested: finalAmountInvested,
      btcAmount: finalBtcAmount,
      exchangeRate: finalExchangeRate,
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
        finalEntry.origin as Origin
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
   * Exclui todos os aportes importados de planilha
   */
  const deleteAllSpreadsheetRecords = async () => {
    if (!user) return;
    
    try {
      await deleteAllSpreadsheetEntries();
      await queryClient.invalidateQueries({ queryKey: ['entries'] }); // Atualiza lista após exclusão
    } catch (error) {
      console.error('Erro ao excluir aportes de planilha:', error);
      throw error;
    }
  };
  
  /**
   * Exclui funções de importação de planilhas
   */
  const editEntry = (entry: BitcoinEntry) => {
    setEditingEntry(entry);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
  };

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
    deleteAllSpreadsheetRecords,
    editEntry,
    cancelEdit,
    updateCurrentRate,
    refetch,
  };
};
