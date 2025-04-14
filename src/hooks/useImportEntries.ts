
/**
 * Hook para gerenciar a importação de aportes via planilha
 * 
 * Responsável por:
 * - Preparar importação via N8N
 * - Gerenciar estado de progresso
 * - Confirmar importação no Supabase
 */

import { useState } from 'react';
import { BitcoinEntry } from '@/types';
import { importSpreadsheet, confirmImport } from '@/services/import/importService';
import { useQueryClient } from '@tanstack/react-query';

export const useImportEntries = () => {
  const queryClient = useQueryClient();
  const [previewData, setPreviewData] = useState<BitcoinEntry[]>([]);
  const [pendingImport, setPendingImport] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState<{
    progress: number;
    stage: string;
    isImporting: boolean;
  }>({
    progress: 0,
    stage: '',
    isImporting: false
  });

  const prepareImportFromSpreadsheet = async (file: File): Promise<BitcoinEntry[]> => {
    if (!file) throw new Error('Nenhum arquivo selecionado');
    
    try {
      setImportProgress({
        progress: 0,
        stage: 'Iniciando importação...',
        isImporting: true
      });
      
      const result = await importSpreadsheet(
        file,
        'user-id', // Este valor será substituído pelo ID real do usuário
        (progress, stage) => {
          setImportProgress({
            progress,
            stage,
            isImporting: true
          });
        }
      );
      
      setPreviewData(result.previewData);
      setPendingImport(result.entries);
      
      setImportProgress({
        progress: 70,
        stage: 'Dados prontos para conferência',
        isImporting: false
      });
      
      return result.previewData;
      
    } catch (error) {
      console.error('[useImportEntries] Erro na preparação da importação:', error);
      setImportProgress({
        progress: 0,
        stage: '',
        isImporting: false
      });
      throw error;
    }
  };

  const confirmImportEntries = async () => {
    if (pendingImport.length === 0) {
      throw new Error('Nenhum dado pendente para importação');
    }
    
    try {
      setImportProgress({
        progress: 75,
        stage: 'Enviando dados ao servidor...',
        isImporting: true
      });
      
      const result = await confirmImport(pendingImport);
      
      await queryClient.invalidateQueries({ queryKey: ['entries'] });
      
      setPreviewData([]);
      setPendingImport([]);
      
      setImportProgress({
        progress: 100,
        stage: 'Importação concluída',
        isImporting: false
      });
      
      return result;
    } catch (error) {
      setImportProgress({
        progress: 0,
        stage: '',
        isImporting: false
      });
      throw error;
    }
  };
  
  const cancelImport = () => {
    setPreviewData([]);
    setPendingImport([]);
    setImportProgress({
      progress: 0,
      stage: '',
      isImporting: false
    });
  };

  return {
    importProgress,
    previewData,
    prepareImportFromSpreadsheet,
    confirmImportEntries,
    cancelImport,
  };
};

