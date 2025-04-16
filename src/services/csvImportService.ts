
import { 
  validateCsvFile, 
  sanitizeCsvData, 
  generateTimestamp,
  generateHmacSignature,
  prepareSecureHeaders,
  validateWebhookResponse,
  WEBHOOK_URL,
  REQUEST_TIMEOUT
} from '@/config/security';
import { BitcoinEntry, Origin } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface CsvAporte {
  data: string;
  valor: string;
  bitcoin: string;
  cotacao?: string;
  origem?: string;
}

/**
 * Processa o arquivo CSV e retorna um array com os dados formatados
 * @param file Arquivo CSV a ser processado
 * @returns Promise com array de aportes processados
 */
export const processCSV = (file: File): Promise<CsvAporte[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // primeira linha como cabeçalho
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('Erros ao processar CSV:', results.errors);
          reject(new Error('Erro ao processar arquivo CSV'));
          return;
        }
        
        // Sanitiza os dados antes de retornar
        const sanitizedData = sanitizeCsvData(results.data as CsvAporte[]);
        resolve(sanitizedData as CsvAporte[]);
      },
      error: (error) => {
        console.error('Erro no parse do CSV:', error);
        reject(error);
      }
    });
  });
};

/**
 * Valida e formata os dados do CSV antes de salvar
 * @param data Array com dados do CSV
 * @returns Array com dados validados e formatados
 */
const validateAndFormatData = (data: CsvAporte[]): Partial<BitcoinEntry>[] => {
  return data.map(row => {
    // Converte a string de data para objeto Date
    const date = new Date(row.data);
    if (isNaN(date.getTime())) {
      throw new Error(`Data inválida: ${row.data}`);
    }

    // Remove prefixos e converte valores numéricos
    const amountInvested = Number(
      row.valor.replace('R$', '').replace(',', '.').trim()
    );
    if (isNaN(amountInvested)) {
      throw new Error(`Valor investido inválido: ${row.valor}`);
    }

    const btcAmount = Number(
      row.bitcoin.replace('BTC', '').replace(',', '.').trim()
    );
    if (isNaN(btcAmount)) {
      throw new Error(`Quantidade de bitcoin inválida: ${row.bitcoin}`);
    }

    // Valores opcionais
    const exchangeRate = row.cotacao
      ? Number(row.cotacao.replace(',', '.').trim())
      : amountInvested / btcAmount;
    if (isNaN(exchangeRate)) {
      throw new Error(`Cotação inválida: ${row.cotacao}`);
    }

    const origin = (row.origem?.toLowerCase() as Origin) || 'corretora';

    // Retorna objeto formatado
    return {
      date,
      amountInvested,
      btcAmount,
      exchangeRate,
      currency: 'BRL', // Assumimos BRL como padrão
      origin
    };
  });
};

/**
 * Salva os aportes importados no Supabase
 * @param entries Array com aportes validados
 * @returns Promise void
 */
export const saveImportedEntries = async (entries: Partial<BitcoinEntry>[]) => {
  const { error } = await supabase.from('aportes').insert(
    entries.map(entry => ({
      data_aporte: entry.date?.toISOString().split('T')[0],
      valor_investido: entry.amountInvested,
      bitcoin: entry.btcAmount,
      cotacao: entry.exchangeRate,
      moeda: entry.currency,
      origem_aporte: entry.origin,
      origem_registro: 'planilha' // Marca entradas como importadas de planilha
    }))
  );

  if (error) throw error;
};

/**
 * Processa e salva aportes de um arquivo CSV
 * @param file Arquivo CSV a ser importado
 * @returns Promise void
 */
export const importCSV = async (file: File) => {
  try {
    const rawData = await processCSV(file);
    const validatedData = validateAndFormatData(rawData);
    await saveImportedEntries(validatedData);
  } catch (error) {
    console.error('Erro ao importar CSV:', error);
    throw error;
  }
};

/**
 * Prepara e envia o arquivo CSV para o webhook do n8n com todas as medidas de segurança
 * @param file Arquivo CSV a ser enviado
 * @param userId ID do usuário autenticado
 * @param userEmail Email do usuário autenticado
 * @returns Promise com resultado do envio
 */
export const sendSecureCSVToWebhook = async (
  file: File, 
  userId: string, 
  userEmail: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validar arquivo antes do processamento
    const validation = validateCsvFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage);
    }
    
    // Ler arquivo como binário
    const fileBuffer = await file.arrayBuffer();
    
    // Preparar dados para envio
    const timestamp = generateTimestamp();
    
    // Criar FormData para envio multipart/form-data
    const formData = new FormData();
    const fileBlob = new Blob([fileBuffer], { type: 'text/csv' });
    formData.append('file', fileBlob, file.name);
    
    // Adicionar metadados
    formData.append('fileName', file.name);
    formData.append('userId', userId);
    formData.append('userEmail', userEmail);
    formData.append('timestamp', timestamp);
    
    // Dados para assinatura
    const payloadForSignature = {
      fileName: file.name,
      userId,
      userEmail,
      timestamp,
      fileSize: file.size
    };
    
    // Gerar assinatura - Agora é assíncrona!
    const signature = await generateHmacSignature(payloadForSignature, timestamp);
    
    // Configurar headers seguros
    const headers = prepareSecureHeaders(userId, timestamp, signature);
    
    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      // Enviar para webhook
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Validar resposta
      await validateWebhookResponse(response);
      
      return {
        success: true,
        message: 'Arquivo enviado e processado com sucesso!'
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('A requisição excedeu o tempo limite. Tente novamente mais tarde.');
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Erro ao enviar CSV para webhook:', error instanceof Error ? error.message : 'Erro desconhecido');
    throw error;
  }
};
