
/**
 * Hook para gerenciar a edição de aportes
 * 
 * Responsável por:
 * - Controlar estado de edição
 * - Atualizar aportes
 */

import { useState } from 'react';
import { BitcoinEntry } from '@/types';
import { updateBitcoinEntry } from '@/services/bitcoinEntryService';
import { useQueryClient } from '@tanstack/react-query';

export const useEditEntry = () => {
  const queryClient = useQueryClient();
  const [editingEntry, setEditingEntry] = useState<BitcoinEntry | null>(null);

  const editEntry = (entry: BitcoinEntry) => {
    setEditingEntry(entry);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
  };

  const updateEntry = async (entryId: string, updatedFields: Partial<BitcoinEntry>) => {
    if (!editingEntry) return;
    
    try {
      await updateBitcoinEntry(
        entryId,
        updatedFields.amountInvested ?? editingEntry.amountInvested,
        updatedFields.btcAmount ?? editingEntry.btcAmount,
        updatedFields.exchangeRate ?? editingEntry.exchangeRate,
        updatedFields.currency ?? editingEntry.currency,
        updatedFields.date ?? editingEntry.date,
        updatedFields.origin ?? editingEntry.origin
      );
      
      await queryClient.invalidateQueries({ queryKey: ['entries'] });
      setEditingEntry(null);
    } catch (error) {
      console.error('[useEditEntry] Erro ao atualizar aporte:', error);
      throw error;
    }
  };

  return {
    editingEntry,
    editEntry,
    cancelEdit,
    updateEntry
  };
};

