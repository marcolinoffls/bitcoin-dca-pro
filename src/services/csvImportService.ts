
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
import { BitcoinEntry, Origin, AporteDB, CsvAporte, ImportedEntry } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';
import { atualizarEntradasRetroativas } from '@/services/bitcoinEntryService';


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
 * Converte data no formato DD/MM/YYYY para YYYY-MM-DD
 * Se inválida, retorna a data atual
 */
const parseCsvDate = (raw: string): string => {
  const parts = raw.trim().split('/');
  if (parts.length !== 3) return new Date().toISOString().split('T')[0];

  const [day, month, year] = parts;
  const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  
  const parsedDate = new Date(`${formatted}T00:00:00`);
  return isNaN(parsedDate.getTime()) ? new Date().toISOString().split('T')[0] : formatted;
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
    
    // Extrair origem (OPCIONAL)
    let origin = originColumn ? String(originColumn[1]).trim().toLowerCase() : '';
    
    // Lista de corretoras conhecidas (todos em lowercase)
    const knownExchanges = [
      'binance', 'coinbase', 'okx', 'crypto.com',
      'mercado bitcoin', 'foxbit', 'novadax',
      'bitget', 'coinext', 'ripio'
    ];
    
    // Regras específicas primeiro
    if (origin.includes('p2p satisfaction')) {
      origin = 'p2p';
    } else if (knownExchanges.includes(origin)) {
      origin = 'corretora';
    }
    
    // Fallback para valores vazios ou não reconhecidos
    if (!origin || (origin !== 'p2p' && origin !== 'corretora' && origin !== 'planilha')) {
      origin = 'corretora';
    }
    // Formatar a data para o formato esperado (YYYY-MM-DD)
    const formattedDate = parseCsvDate(dateStr);
    
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
      origin: origin as Origin
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
export const saveImportedEntries = async (entries: ImportedEntry[]) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      throw new Error('Usuário não autenticado');
    }
    
    const userId = user.user.id;
    // Log seguro do ID do usuário (mostra apenas parte inicial)
    console.log(`Usuário autenticado: ${userId.substring(0, 6)}...`);
    
    // Preparar entradas para o Supabase
    const preparedEntries = entries.map(entry => {
      // Formatar a data para o formato esperado pelo Supabase (YYYY-MM-DD)
      const dateStr = typeof entry.date === 'string' ? entry.date : ''; 
      
      // Garantir que a cotação (price) existe - se não, calcular
      let priceValue = Number(entry.price) || 0;
      if (priceValue <= 0 && entry.amount && entry.btc) {
        priceValue = Number(entry.amount) / Number(entry.btc);
      }
      
      return {
        data_aporte: dateStr,
        moeda: 'BRL',
        valor_investido: Number(entry.amount) || 0,
        bitcoin: Number(entry.btc) || 0,
        cotacao: priceValue,
        cotacao_moeda: 'BRL',
        origem_aporte: entry.origin,
        origem_registro: 'planilha',
        user_id: userId,
        created_at: new Date().toISOString(),
        valor_usd: null,
        cotacao_usd_brl: null
      };
    });
    
    // Log seguro: apenas metadados, sem expor valores financeiros
    console.log('Enviando dados para o Supabase:', {
      quantidade: preparedEntries.length,
      primeiroPeriodo: preparedEntries[0]?.data_aporte || 'N/A',
      ultimoPeriodo: preparedEntries[preparedEntries.length-1]?.data_aporte || 'N/A'
    });
    
    const { error } = await supabase
      .from('aportes')
      .insert(preparedEntries);
    
    if (error) {
      // Log seguro de erros: sem expor detalhes completos
      console.error('Erro ao salvar aportes - código:', error.code);
      
      // Log apenas do tipo de erro, não do conteúdo completo
      if ('message' in error) {
        console.error('Tipo de erro:', error.code || 'Erro sem código');
      }
      
      throw new Error(`Erro ao salvar aportes: ${error.message}`);
    }
    
    console.log('Aportes salvos com sucesso:', preparedEntries.length);
    
    // Atualizar campos valor_usd e cotacao_usd_brl retroativamente
    await atualizarEntradasRetroativas();
    
    return { success: true, count: preparedEntries.length };

  } catch (error) {
    // Log seguro para erros genéricos
    console.error('Erro ao processar aportes');
    throw error;
  }
};

/**
 * Função principal que realiza todo o processo de importação do CSV
 * Esta função foi refatorada para resolver o erro de exportação.
 * @param file Arquivo CSV a ser importado
 * @returns Objeto com status de sucesso e mensagem
 */
export const importCSV = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    // Log seguro - apenas metadados do arquivo, sem conteúdo
    console.log('Iniciando importação:', {
      tipo: file.type, 
      tamanho: `${Math.round(file.size / 1024)} KB`
    });
    
    // Validar arquivo CSV usando as funções de segurança importadas
    validateCsvFile(file);
    
    const processedData = await processCSV(file);
    
    // Log seguro - apenas quantidade de registros
    console.log(`Processamento concluído: ${processedData.length} registros válidos`);
    
    // Converter dados processados para o formato de BitcoinEntry
    const entriesToSave: ImportedEntry[] = processedData.map(item => ({
      date: item.date,
      amount: item.amount,
      btc: item.btc,
      price: item.rate, // Usando a cotação calculada automaticamente
      origin: item.origin,
      registrationSource: 'planilha' // Marcando que veio da importação
    }));
    
    // Sanitizar dados antes de salvar (usando função importada)
    const sanitizedEntries = sanitizeCsvData(entriesToSave);
    
    // Log seguro - apenas contadores
    console.log('Preparando persistência:', {
      registrosOriginais: processedData.length,
      registrosSanitizados: sanitizedEntries.length,
      periodo: sanitizedEntries.length > 0 ? 
        `${sanitizedEntries[0].date?.substring(0, 10) || 'N/A'} a ${sanitizedEntries[sanitizedEntries.length-1].date?.substring(0, 10) || 'N/A'}` : 
        'N/A'
    });
    
    // Salvar entradas processadas
    await saveImportedEntries(sanitizedEntries);
    
    // Log seguro de conclusão
    console.log(`Importação finalizada com sucesso: ${sanitizedEntries.length} registros`);
    
    return { 
      success: true, 
      message: `${sanitizedEntries.length} aportes importados com sucesso.` 
    };
  } catch (error) {
    // Log seguro de erro - apenas mensagem, sem detalhes técnicos completos
    console.error('Erro na importação de CSV:', 
      error instanceof Error ? 
        error.message.substring(0, 100) + (error.message.length > 100 ? '...' : '') : 
        'Erro desconhecido');
    
    return { 
      success: false, 
      message: error instanceof Error ? 
        error.message : 
        'Erro desconhecido ao importar CSV.' 
    };
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
    const signature = await generateHmacSignature(userId, timestamp);
    
    // Preparar headers seguros
    const headers = prepareSecureHeaders(userId, timestamp, signature);
    
    // Enviar para o webhook usando a URL importada
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: formData,
      // Remover timeout que não existe no tipo RequestInit
    });
    
    // Validar resposta do webhook usando função importada
    await validateWebhookResponse(response);
    
    return { 
      success: true, 
      message: 'Arquivo enviado com sucesso! Você receberá um email quando o processamento for concluído.' 
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
