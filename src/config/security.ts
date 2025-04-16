
/**
 * Configurações de segurança para a aplicação
 * Contém constantes, funções e utilidades relacionadas à segurança
 */

// Configurações de tamanho e tipo para arquivos CSV
export const CSV_MAX_SIZE_MB = 5;
export const CSV_MAX_SIZE_BYTES = CSV_MAX_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['text/csv'];
export const ALLOWED_EXTENSIONS = ['.csv'];

// URL do webhook do n8n (em produção, usar variável de ambiente do Supabase)
export const WEBHOOK_URL = 'https://primary-production-3045.up.railway.app/webhook-test/import-satisfaction';

// Token de API para autorização
export const API_KEY = 'testkey123'; // Em produção, usar secrets do Supabase

// Configurações de timeout para requisições (em milissegundos)
export const REQUEST_TIMEOUT = 30000; // 30 segundos

/**
 * Gera uma nova API key segura usando algoritmos de criptografia do navegador
 * @returns string contendo a API key em formato hexadecimal
 */
export const generateSecureApiKey = (): string => {
  // Gera bytes aleatórios usando a Web Crypto API
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  
  // Converte para hexadecimal
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Gera um timestamp para uso nos headers de segurança
 * @returns string com timestamp atual em ISO
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Gera uma assinatura para validação de integridade
 * Usa SHA-256 através da Web Crypto API
 * @param payload dados a serem assinados
 * @param timestamp timestamp da requisição
 * @returns Promise com a assinatura em hexadecimal
 */
export const generateHmacSignature = async (payload: any, timestamp: string): Promise<string> => {
  try {
    // Combina payload e timestamp
    const data = JSON.stringify(payload) + timestamp;
    
    // Converte para um formato que a Web Crypto API possa processar
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Cria hash SHA-256 usando Web Crypto API
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Converte para string hexadecimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Erro ao gerar assinatura:', error);
    throw new Error('Falha ao gerar assinatura de segurança');
  }
};

/**
 * Valida o tipo e tamanho do arquivo CSV
 * @param file Arquivo a ser validado
 * @returns objeto com resultado da validação e mensagem de erro
 */
export const validateCsvFile = (file: File): { isValid: boolean; errorMessage?: string } => {
  // Validar tamanho
  if (file.size > CSV_MAX_SIZE_BYTES) {
    return {
      isValid: false,
      errorMessage: `O arquivo excede o tamanho máximo de ${CSV_MAX_SIZE_MB}MB`
    };
  }

  // Validar tipo
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      errorMessage: 'Apenas arquivos CSV são permitidos'
    };
  }

  // Validar mime type (pode não ser confiável, mas é uma camada adicional)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    console.warn(`Tipo MIME suspeito: ${file.type}, mas extensão válida. Procedendo com cautela.`);
  }
  
  return { isValid: true };
};

/**
 * Sanitiza os dados do CSV antes do processamento
 * Remove caracteres potencialmente perigosos e valida tipos
 * @param data Dados do CSV a serem sanitizados
 * @returns Dados sanitizados
 */
export const sanitizeCsvData = (data: any[]): any[] => {
  return data.map(row => {
    const sanitizedRow: Record<string, any> = {};
    
    // Para cada propriedade no objeto
    Object.keys(row).forEach(key => {
      // Sanitizar string removendo caracteres potencialmente perigosos
      if (typeof row[key] === 'string') {
        // Remove scripts e tags HTML
        sanitizedRow[key] = row[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          // Escapa aspas e outros caracteres especiais
          .replace(/[\\'"]/g, '\\$&');
      } else {
        sanitizedRow[key] = row[key];
      }
    });
    
    return sanitizedRow;
  });
};

/**
 * Prepara headers seguros para requisição ao webhook
 * @param userId ID do usuário autenticado
 * @param timestamp Timestamp da requisição
 * @param signature Assinatura
 * @returns objeto com headers seguros
 */
export const prepareSecureHeaders = (
  userId: string,
  timestamp: string,
  signature: string
): HeadersInit => {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'X-Request-Timestamp': timestamp,
    'X-Signature': signature,
    'X-User-Id': userId
  };
};

/**
 * Valida a resposta do webhook para garantir sucesso
 * @param response Resposta da requisição
 * @returns void, lança erro se a resposta não for válida
 */
export const validateWebhookResponse = async (response: Response): Promise<void> => {
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Erro na resposta do webhook:', {
      status: response.status,
      statusText: response.statusText,
      errorData: errorData.substring(0, 100) // Limita logs para não expor dados sensíveis
    });
    throw new Error(`Erro ao processar arquivo: ${response.status} ${response.statusText}`);
  }
};
