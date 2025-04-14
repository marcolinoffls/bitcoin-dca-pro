
/**
 * Hook principal para gestão de aportes
 * 
 * Orquestra todas as operações relacionadas a aportes:
 * - Listagem
 * - Criação
 * - Edição
 * - Exclusão
 * - Importação
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { BitcoinEntry } from '@/types';
import { 
  fetchBitcoinEntries, 
  createBitcoinEntry, 
  deleteBitcoinEntry,
  deleteAllSpreadsheetEntries 
} from '@/services/bitcoinEntryService';
import { useEditEntry } from './useEditEntry';
import { useImportEntries } from './useImportEntries';

export const useBitcoinEntries = () => {
  const { user } = useAuth();
  
  // Separando funcionalidades em hooks especializados
  const {
    editingEntry,
    editEntry,
    cancelEdit,
    updateEntry
  } = useEditEntry();

  const {
    importProgress,
    previewData,
    prepareImportFromSpreadsheet,
    confirmImportEntries,
    cancelImport
  } = useImportEntries();

  // Query principal para buscar aportes
  const { 
    data: entries = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['entries', user?.id],
    queryFn: fetchBitcoinEntries,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Função para adicionar novo aporte
  const addEntry = async ({
    amountInvested,
    btcAmount,
    exchangeRate,
    currency,
    date,
    origin
  }: Partial<BitcoinEntry>) => {
    if (!user || !date) return;
    
    await createBitcoinEntry(
      user.id,
      amountInvested!,
      btcAmount!,
      exchangeRate!,
      currency!,
      date,
      origin!
    );
    
    await refetch();
  };

  // Função para excluir aporte
  const deleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteBitcoinEntry(entryId);
    await refetch();
  };

  // Função para excluir todos os aportes importados
  const deleteAllSpreadsheetRecords = async () => {
    if (!user) return;
    await deleteAllSpreadsheetEntries();
    await refetch();
  };

  return {
    entries,
    isLoading,
    editingEntry,
    importProgress,
    previewData,
    addEntry,
    updateEntry,
    deleteEntry,
    deleteAllSpreadsheetRecords,
    editEntry,
    cancelEdit,
    prepareImportFromSpreadsheet,
    confirmImportEntries,
    cancelImport,
    refetch,
  };
};

