
/**
 * Serviço principal para importação de planilhas
 * 
 * Orquestra o fluxo de importação:
 * - Envio para N8N
 * - Transformação de dados
 * - Confirmação no Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { BitcoinEntry } from '@/types';
import { sendFileToWebhook } from './webhookService';
import { transformWebhookData } from './transformService';

/**
 * Processa arquivo de planilha através do N8N
 */
export const importSpreadsheet = async (
  file: File,
  userId: string,
  onProgress?: (progress: number, stage: string) => void
): Promise<{ count: number, entries: BitcoinEntry[], previewData: BitcoinEntry[] }> => {
  console.log('[importService] Iniciando envio do arquivo para N8N:', file.name);
  
  try {
    onProgress?.(25, 'Preparando arquivo...');
    
    onProgress?.(50, 'Enviando arquivo...');
    const webhookData = await sendFileToWebhook(file, userId);
    console.log('[importService] Dados recebidos do N8N:', webhookData);
    
    onProgress?.(75, 'Processando resposta...');
    const appEntries = transformWebhookData(webhookData);
    console.log('[importService] Dados mapeados para BitcoinEntry:', appEntries);
    
    onProgress?.(70, 'Dados prontos para conferência');
    
    return {
      count: appEntries.length,
      entries: appEntries,
      previewData: appEntries
    };
    
  } catch (error) {
    console.error('[importService] Erro durante importação:', error);
    throw error;
  }
};

/**
 * Confirma a importação após a pré-visualização
 */
export const confirmImport = async (entries: any[]): Promise<{ count: number }> => {
  console.log('[importService] Iniciando confirmação de importação:', entries.length);
  
  try {
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('aportes')
        .insert(batch);
      
      if (error) throw error;
      
      inserted += batch.length;
    }
    
    return { count: inserted };
  } catch (error) {
    console.error('[importService] Erro ao confirmar importação:', error);
    throw error;
  }
};
