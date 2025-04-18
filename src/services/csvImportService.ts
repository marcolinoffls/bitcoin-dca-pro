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
  date: string;
  amount: number;
  btc: number;
  rate: number;
  origin: Origin;
}

/**
 * Processa o arquivo CSV e retorna um array com os dados formatados
 * @param file Arquivo CSV a ser processado
 * @returns Promise com array de aportes processados
 */
export const processCSV = (file: File): Promise<CsvAporte[]> => {
  return new Promise((resolve, reject) => {
    // Verificação inicial do tipo de arquivo
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      reject(new Error('Formato de arquivo inválido. Por favor, envie um arquivo CSV ou Excel.'));
      return;
    }

    // Verificação do tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Arquivo muito grande. O tamanho máximo permitido é 5MB.'));
      return;
    }

    // Se for Excel, converter para CSV primeiro
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          // Processar como Excel...
          // (Adicionar biblioteca como xlsx para processar arquivos Excel)
          reject(new Error('Arquivos Excel ainda não são suportados. Por favor, salve como CSV.'));
        } catch (error) {
          reject(new Error('Erro ao processar arquivo Excel: ' + error));
        }
      };
      reader.readAsBinaryString(file);
      return;
    }

    // Processar como CSV
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            reject(new Error(`Erro ao processar CSV: ${results.errors[0].message}`));
            return;
          }

          // Detectar formato do CSV e normalizar os dados
          const normalizedData = normalizeData(results.data);
          
          // Validar dados normalizados
          const validData = validateData(normalizedData);
          
          resolve(validData);
        } catch (error) {
          console.error('Erro ao processar dados:', error);
          reject(new Error(`Erro ao processar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao processar CSV: ${error.message}`));
      }
    });
  });
};

/**
 * Normaliza os dados do CSV para um formato padrão, independente do formato original
 * Trata campos opcionais (cotação e origem) aplicando valores padrões quando necessário
 */
const normalizeData = (rawData: any[]): CsvAporte[] => {
  return rawData.map(row => {
    // Detectar quais colunas contêm os dados necessários
    const entries = Object.entries(row);
    
    // Encontrar coluna de data (primeira coluna normalmente)
    const dateColumn = entries.find(([key]) => 
      key.toLowerCase().includes('data') || 
      (/^\d{2}\/\d{2}\/\d{4}$/.test(String(key)))
    );
    
    // Encontrar coluna de valor
    const valueColumn = entries.find(([key, value]) => 
      key.toLowerCase().includes('valor') || 
      (typeof value === 'string' && value.includes('R$'))
    );
    
    // Encontrar coluna de bitcoin
    const bitcoinColumn = entries.find(([key, value]) => 
      key.toLowerCase().includes('bitcoin') || 
      (typeof value === 'string' && value.toLowerCase().includes('btc'))
    );
    
    // Encontrar coluna de cotação (OPCIONAL)
    const rateColumn = entries.find(([key]) => 
      key.toLowerCase().includes('cota') || 
      key.toLowerCase().includes('preco')
    );
    
    // Encontrar coluna de origem (OPCIONAL)
    const originColumn = entries.find(([key]) => 
      key.toLowerCase().includes('origem') || 
      key.toLowerCase().includes('source')
    );
    
    // Extrair e formatar a data
    let dateStr = dateColumn ? String(dateColumn[1]) : '';
    // Se a data está vazia, verificar se a chave é uma data
    if (!dateStr && dateColumn) {
      dateStr = dateColumn[0];
    }
    
    // Extrair e formatar o valor (remover R$ e espaços)
    let valueStr = valueColumn ? String(valueColumn[1]) : '0';
    valueStr = valueStr.replace(/R\$|\s+/g, '').replace(',', '.');
    
    // Extrair e formatar o bitcoin (remover BTC e espaços)
    let bitcoinStr = bitcoinColumn ? String(bitcoinColumn[1]) : '0';
    bitcoinStr = bitcoinStr.replace(/BTC|\s+/g, '').replace(',', '.');
    
    // Extrair e formatar a cotação (OPCIONAL - remover R$ e espaços)
    let rateStr = rateColumn ? String(rateColumn[1]) : '';
    rateStr = rateStr.replace(/R\$|\s+/g, '').replace(',', '.');
    
    // Extrair origem (OPCIONAL - p2p ou corretora)
    let origin = originColumn ? String(originColumn[1]).trim().toLowerCase() : '';
    
    // Atribuir o valor padrão 'exchange' (corretora) se estiver vazio ou não reconhecido
    if (!origin || (origin !== 'p2p' && origin !== 'corretora' && origin !== 'exchange')) {
      origin = 'exchange'; // Valor padrão é corretora/exchange
    } else if (origin === 'corretora') {
      origin = 'exchange'; // Normalizar 'corretora' para 'exchange'
    }
    
    // Formatar a data para o formato esperado (YYYY-MM-DD)
    const dateParts = dateStr.split('/');
    const formattedDate = dateParts.length === 3 
      ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` 
      : new Date().toISOString().split('T')[0];
    
    // Conversão para valores numéricos
    const amount = parseFloat(valueStr) || 0;
    const btcAmount = parseFloat(bitcoinStr) || 0;
    
    // Se a taxa foi fornecida, use-a; caso contrário, será calculada na validação
    const rate = rateStr ? (parseFloat(rateStr) || 0) : 0;
    
    return {
      date: formattedDate,
      amount,
      btc: btcAmount,
      rate,
      origin: origin as 'p2p' | 'exchange'
    };
  }).filter(item => item.amount > 0 && item.btc > 0); // Filtrar linhas inválidas
};

/**
 * Valida os dados normalizados e verifica se estão corretos
 * Calcula a cotação automaticamente quando não fornecida
 */
const validateData = (data: CsvAporte[]): CsvAporte[] => {
  if (data.length === 0) {
    throw new Error('Nenhum dado válido encontrado no arquivo.');
  }
  
  return data.map(item => {
    // SEMPRE calcular a cotação com base no valor investido e bitcoin obtido
    // Isso garante que mesmo que tenha sido fornecida uma cotação, usamos o cálculo preciso
    if (item.amount > 0 && item.btc > 0) {
      item.rate = item.amount / item.btc;
    }
    
    // Verificar data válida
    const date = new Date(item.date);
    if (isNaN(date.getTime())) {
      throw new Error(`Data inválida: ${item.date}`);
    }
    
    // Verificação final de dados
    if (item.amount <= 0) {
      throw new Error(`Valor investido inválido: ${item.amount}`);
    }
    
    if (item.btc <= 0) {
      throw new Error(`Quantidade de Bitcoin inválida: ${item.btc}`);
    }
    
    return item;
  });
};

/**
 * Salva os aportes importados no Supabase
 * @param entries Array de aportes a serem salvos
 */
export const saveImportedEntries = async (entries: Partial<BitcoinEntry>[]) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      throw new Error('Usuário não autenticado');
    }
    
    const userId = user.user.id;
    console.log(`Usuário autenticado: ${userId}`);
    
    // Estrutura bem definida para os dados
    // Incluindo apenas os campos necessários que existem na tabela
    const preparedEntries = entries.map(entry => {
      // Converter formato de data se necessário
      let formattedDate = entry.date;
      if (formattedDate && !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Se a data não estiver no formato YYYY-MM-DD, tenta converter
        const date = new Date(formattedDate);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      return {
        date: formattedDate,
        amount: Number(entry.amount) || 0, // Garantir que é número
        btc: Number(entry.btc) || 0,      // Garantir que é número
        price: Number(entry.price) || 0,   // Garantir que é número
        origin: entry.origin === 'p2p' ? 'p2p' : 'exchange',
        registration_source: 'planilha',
        user_id: userId,
        created_at: new Date().toISOString() // Formato ISO padrão
      };
    });
    
    console.log('Enviando dados para o Supabase:', JSON.stringify(preparedEntries[0], null, 2));
    
    // Envio simplificado - sem especificar colunas
    const { error } = await supabase
      .from('aportes')
      .insert(preparedEntries);
    
    if (error) {
      console.error('Erro ao salvar aportes:', error);
      throw new Error(`Erro ao salvar aportes: ${error.message}`);
    }
    
    console.log('Aportes salvos com sucesso');
    return { success: true, count: preparedEntries.length };
  } catch (error) {
    console.error('Erro completo ao salvar aportes:', error);
    throw error;
  }
};

/**
 * Função principal que realiza todo o processo de importação do CSV
 * @param file Arquivo CSV a ser importado
 * @returns Objeto com status de sucesso e mensagem
 */
export const importCSV = async (file: File) => {
  try {
    // Validar arquivo CSV usando as funções de segurança importadas
    validateCsvFile(file);
    
    const processedData = await processCSV(file);
    
    // Converter dados processados para o formato de BitcoinEntry
    const entriesToSave: Partial<BitcoinEntry>[] = processedData.map(item => ({
      date: item.date,
      amount: item.amount,
      btc: item.btc,
      price: item.rate, // Usando a cotação calculada automaticamente
      origin: item.origin,
      registrationSource: 'planilha' // Marcando que veio da importação
    }));
    
    // Sanitizar dados antes de salvar (usando função importada)
    const sanitizedEntries = sanitizeCsvData(entriesToSave);
    
    // Salvar entradas processadas
    await saveImportedEntries(sanitizedEntries);
    return { success: true, message: `${sanitizedEntries.length} aportes importados com sucesso.` };
  } catch (error) {
    console.error('Erro na importação:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Erro desconhecido ao importar CSV.' };
  }
};

/**
 * Envia o arquivo CSV para processamento seguro via webhook externo
 * @param file Arquivo CSV a ser enviado
 * @param userId ID do usuário atual
 * @param userEmail Email do usuário atual
 * @returns Objeto com status de sucesso e mensagem
 */
export const sendSecureCSVToWebhook = async (
  file: File, 
  userId: string, 
  userEmail: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Verificar arquivo usando as funções de segurança importadas
    validateCsvFile(file);
    
    // Criar FormData para envio
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('userEmail', userEmail);
    
    // Gerar timestamp para segurança usando a função importada
    const timestamp = generateTimestamp();
    formData.append('timestamp', timestamp);
    
    // Gerar assinatura HMAC para segurança
    const signature = generateHmacSignature(userId, timestamp);
    
    // Preparar headers seguros
    const headers = prepareSecureHeaders(signature, timestamp);
    
    // Enviar para o webhook usando a URL importada
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: formData,
      timeout: REQUEST_TIMEOUT
    });
    
    // Validar resposta do webhook usando função importada
    const result = await validateWebhookResponse(response);
    
    return { 
      success: true, 
      message: result.message || 'Arquivo enviado com sucesso! Você receberá um email quando o processamento for concluído.' 
    };
  } catch (error) {
    console.error('Erro ao enviar CSV para processamento externo:', error);
    return { 
      success: false, 
      message: error instanceof Error 
        ? `Erro: ${error.message}`
        : 'Erro desconhecido ao enviar arquivo para processamento'
    };
  }
};