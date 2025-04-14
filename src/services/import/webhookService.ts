
/**
 * Serviço para comunicação com webhook do N8N
 * 
 * Responsável por enviar arquivos para processamento no N8N
 * e receber os dados processados de volta
 */

const WEBHOOK_URL = 'https://primary-production-3045.up.railway.app/webhook/import-satisfaction';

/**
 * Envia arquivo para processamento no N8N
 * @param file Arquivo da planilha para processar
 * @param userId ID do usuário atual
 * @returns Dados processados pelo N8N
 */
export const sendFileToWebhook = async (
  file: File,
  userId: string
): Promise<any[]> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao enviar arquivo: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Formato de resposta inválido do webhook');
  }
  
  return data;
};
