
/**
 * Configurações de segurança para a aplicação
 * Contém constantes e funções relacionadas à segurança da transmissão de dados
 */

// Configurações de tamanho e tipo para arquivos CSV
export const CSV_MAX_SIZE_MB = 5;
export const CSV_MAX_SIZE_BYTES = CSV_MAX_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['text/csv'];
export const ALLOWED_EXTENSIONS = ['.csv'];

// URL do webhook do n8n
export const WEBHOOK_URL = 'https://primary-production-3045.up.railway.app/webhook-test/import-satisfaction';

// Token de API para autorização (normalmente viria de variáveis de ambiente)
// Em produção, isso deveria estar em variáveis de ambiente seguras
export const API_KEY = 'seu-token-seguro-aqui'; 

/**
 * Gera um timestamp para uso nos headers de segurança
 * @returns string com timestamp atual em formato ISO
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Gera uma assinatura HMAC para validação de integridade
 * @param payload dados a serem assinados
 * @param timestamp timestamp da requisição
 * @returns string com assinatura HMAC
 */
export const generateHmacSignature = (payload: any, timestamp: string): string => {
  // Em um ambiente real, utilizaríamos algo como:
  // const hmac = crypto.createHmac('sha256', SECRET_KEY);
  // hmac.update(JSON.stringify(payload) + timestamp);
  // return hmac.digest('hex');
  
  // Implementação simplificada para demonstração:
  const combinedString = JSON.stringify(payload) + timestamp;
  // Simulação de hash - em produção usar um algoritmo real como SHA-256
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para 32bit integer
  }
  return hash.toString(16);
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
 * Implementação básica que remove caracteres potencialmente perigosos
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
