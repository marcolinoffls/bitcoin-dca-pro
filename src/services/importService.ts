
/**
 * Serviço para importação de planilhas
 * 
 * Este serviço fornece funções para:
 * - Enviar arquivos para processamento no N8N
 * - Receber dados processados do webhook
 * - Preparar dados para exibição
 * 
 * É usado pelo componente EntriesList para importar aportes a partir
 * de planilhas fornecidas pelo usuário
 */

import { supabase } from '@/integrations/supabase/client';
import { BitcoinEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Envia arquivo para processamento no N8N e recebe dados processados
 */
export const importSpreadsheet = async (
  file: File,
  userId: string,
  onProgress?: (progress: number, stage: string) => void
): Promise<{ count: number, entries: BitcoinEntry[], previewData: BitcoinEntry[] }> => {
  console.log('[importService] Iniciando envio do arquivo para N8N:', file.name);
  
  try {
    // Fase 1: Preparar arquivo para envio (25%)
    onProgress?.(25, 'Preparando arquivo...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    
    // Fase 2: Enviar para o N8N (50%)
    onProgress?.(50, 'Enviando arquivo...');
    
    const webhookUrl = 'https://primary-production-3045.up.railway.app/webhook/import-satisfaction';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao enviar arquivo: ${response.statusText}`);
    }
    
    // Fase 3: Receber e processar resposta (75%)
    onProgress?.(75, 'Processando resposta...');
    
    const processedData = await response.json();
    console.log('[importService] Dados recebidos do N8N:', processedData);
    
    // Validar resposta do N8N
    if (!Array.isArray(processedData)) {
      throw new Error('Formato de resposta inválido do webhook');
    }
    
    // Mapear dados recebidos para o formato BitcoinEntry
    const appEntries = processedData.map((item): BitcoinEntry => ({
      id: item.id || uuidv4(),
      date: new Date(item.date),
      amountInvested: Number(item.amountInvested),
      btcAmount: Number(item.btcAmount),
      exchangeRate: Number(item.exchangeRate),
      currency: item.currency || 'BRL',
      origin: item.origin || 'planilha',
      registrationSource: 'planilha'
    }));
    
    console.log('[importService] Dados mapeados para BitcoinEntry:', appEntries);
    
    // Fase 4: Finalizar (100%)
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
    // Inserir em lotes de 100 para evitar limite de tamanho da requisição
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
