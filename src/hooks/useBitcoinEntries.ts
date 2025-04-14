/**
 * Hook: useBitcoinEntries
 *
 * Gerencia toda a lógica de aportes:
 * - Busca aportes no Supabase
 * - Permite adicionar, editar e excluir aportes
 * - Importação de planilhas CSV/Excel com pré-visualização
 * - Integra com a cotação atual do Bitcoin
 *
 * Utiliza React Query para cache e atualização reativa
 * 
 * Atualizações:
 * - Adicionado suporte à nova coluna origem_registro
 * - Implementada pré-visualização de dados antes da importação
 * - Corrigido o problema de carregamento inicial após login
 * - Adicionada escuta da mudança de estado de autenticação
 * - Melhorada a invalidação de queries ao mudar o usuário
 * - Corrigido o problema de atualização da data no Supabase
 * - Adicionado log detalhado para acompanhar a atualização dos aportes
 * - Garantida a invalidação do cache de queries após operações
 * - Melhorada a validação da data para garantir que seja salva corretamente
 * - Melhorado o tratamento de erros e validação de datas
 * - Corrigido problema de timezone, forçando o horário local ao interpretar datas
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BitcoinEntry, CurrentRate, Origin } from '@/types';
import { fetchCurrentBitcoinRate } from '@/services/bitcoinService';
import { 
  fetchBitcoinEntries, 
  updateBitcoinEntry, 
  deleteBitcoinEntry,
  deleteAllSpreadsheetEntries
} from '@/services/bitcoinEntryService';
import { 
  importSpreadsheet, 
  confirmImport 
} from '@/services/importService';

// Interface para mapear os dados do Supabase para os tipos da aplicação
interface SupabaseAporte {
  id: string;
  data_aporte: string;
  valor_investido: number;
  bitcoin: number;
  cotacao: number;
  moeda: 'BRL' | 'USD';
  origem_aporte: 'corretora' | 'p2p';
  origem_registro: 'manual' | 'planilha';
  user_id: string;
  cotacao_moeda: string;
  created_at: string;
}

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

export const useBitcoinEntries = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Estado local para armazenar o aporte sendo editado
  const [editingEntry, setEditingEntry] = useState<BitcoinEntry | null>(null);
  
  // Estado para armazenar os dados de pré-visualização da importação
  const [previewData, setPreviewData] = useState<BitcoinEntry[]>([]);
  const [pendingImport, setPendingImport] = useState<any[]>([]);
  
  // Estado para controlar o progresso de importação
  const [importProgress, setImportProgress] = useState<{
    progress: number;
    stage: string;
    isImporting: boolean;
  }>({
    progress: 0,
    stage: '',
    isImporting: false
  });

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
   * Adiciona um novo aporte
   */
  const addEntry = async (entry: Partial<BitcoinEntry>) => {
    if (!user) return;
    
    const { date, amountInvested, btcAmount, exchangeRate, currency, origin } = entry;
    
    if (!date || amountInvested === undefined || btcAmount === undefined || 
        exchangeRate === undefined || !currency || !origin) {
      throw new Error("Dados incompletos para criar aporte");
    }
    
    // Garantir que a data é válida antes de enviar
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Data inválida para criação:', date);
      throw new Error('Data inválida fornecida');
    }
    
    const { error } = await supabase.from('aportes').insert([{
      user_id: user.id,
      data_aporte: date.toISOString().split('T')[0],
      valor_investido: amountInvested,
      bitcoin: btcAmount,
      cotacao: exchangeRate,
      moeda: currency,
      cotacao_moeda: currency,
      origem_aporte: origin,
      origem_registro: 'manual' // Registro manual por padrão
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
   * Prepara a importação de aportes a partir de um arquivo de planilha
   * Retorna os dados para pré-visualização, sem salvá-los ainda
   */
  const prepareImportFromSpreadsheet = async (file: File) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    try {
      setImportProgress({
        progress: 0,
        stage: 'Iniciando processamento...',
        isImporting: true
      });
      
      // Chamar função de importação com callback de progresso
      const result = await importSpreadsheet(
        file, 
        user.id,
        (progress, stage) => {
          setImportProgress({
            progress,
            stage,
            isImporting: true
          });
        }
      );
      
      // Armazenar dados para pré-visualização
      setPreviewData(result.previewData);
      setPendingImport(result.entries); // Array para Supabase
      
      // Finalizar o progresso de preparação
      setImportProgress({
        progress: 70,
        stage: 'Dados preparados para importação',
        isImporting: false
      });
      
      return result.previewData;
    } catch (error) {
      // Em caso de erro, resetar o progresso
      setImportProgress({
        progress: 0,
        stage: '',
        isImporting: false
      });
      
      console.error('Erro na preparação da importação:', error);
      throw error;
    }
  };

  /**
   * Confirma a importação após a pré-visualização
   */
  const confirmImportEntries = async () => {
    if (!user || pendingImport.length === 0) {
      throw new Error('Nenhum dado pendente para importação');
    }
    
    try {
      setImportProgress({
        progress: 75,
        stage: 'Enviando dados ao servidor...',
        isImporting: true
      });
      
      // Confirma a importação no Supabase
      const result = await confirmImport(pendingImport);
      
      // Atualizar o cache de queries para exibir os novos dados
      await queryClient.invalidateQueries({ queryKey: ['entries'] });
      
      // Limpar os dados de pré-visualização após importação
      setPreviewData([]);
      setPendingImport([]);
      
      // Finalizar o progresso
      setImportProgress({
        progress: 100,
        stage: 'Importação concluída',
        isImporting: false
      });
      
      return result;
    } catch (error) {
      // Em caso de erro, resetar o progresso
      setImportProgress({
        progress: 0,
        stage: '',
        isImporting: false
      });
      
      console.error('Erro na confirmação da importação:', error);
      throw error;
    }
  };
  
  /**
   * Cancela a importação e limpa os dados de pré-visualização
   */
  const cancelImport = () => {
    setPreviewData([]);
    setPendingImport([]);
    setImportProgress({
      progress: 0,
      stage: '',
      isImporting: false
    });
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
    importProgress,
    previewData,
    addEntry,
    updateEntry,
    deleteEntry,
    deleteAllSpreadsheetRecords,
    editEntry,
    cancelEdit,
    updateCurrentRate,
    prepareImportFromSpreadsheet,
    confirmImportEntries,
    cancelImport,
    refetch,
  };
};
