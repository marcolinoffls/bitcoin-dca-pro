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
    if (!origin || (origin !== 'p2p' && origin !== 'corretora' && origin !== 'exchange' && origin !== 'planilha')) {
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
        created_at: new Date().toISOString()
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
    const signature = generateHmacSignature(userId, timestamp);
    
    // Preparar headers seguros
    const headers = prepareSecureHeaders(signature, timestamp);
    
    // Enviar para o webhook usando a URL importada
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: formData,
      // Remover timeout que não existe no tipo RequestInit
    });
    
    // Validar resposta do webhook usando função importada
    const result = await validateWebhookResponse(response);
    
    return { 
      success: true, 
      message: result?.message || 'Arquivo enviado com sucesso! Você receberá um email quando o processamento for concluído.' 
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

/**
 * Processa aportes finais e os envia para o supabase
 * @param entries Entradas de aporte processadas
 * @param currency Moeda (BRL ou USD)
 * @returns True se todos os aportes foram importados com sucesso
 */
export const processFinalEntries = async (entries: ImportedEntry[], currency: 'BRL' | 'USD'): Promise<boolean> => {
  if (!entries.length) {
    console.error('Nenhum aporte para processar');
    return false;
  }

  try {
    // Inserir cada entrada no Supabase
    for (const entry of entries) {
      const entryDate = parseLocalDate(entry.date);
      console.log(`Processando aporte com data ${entry.date} -> ${entryDate}`);

      if (isNaN(entryDate.getTime())) {
        console.error(`Data inválida: ${entry.date}`);
        continue;
      }

      try {
        // Buscar o ID do usuário atual da sessão
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('Usuário não autenticado');
        }

        // Criar aporte no Supabase usando o serviço centralizado
        await createBitcoinEntry(
          user.id,
          entry.amount,
          entry.btc,
          entry.price,
          currency,
          entryDate,
          entry.origin
        );
        
        console.log(`Aporte importado com sucesso: ${entry.date} - ${entry.amount} ${currency} - ${entry.btc} BTC`);
      } catch (error) {
        console.error(`Erro ao importar aporte: ${error}`);
        throw new Error(`Falha ao importar aporte de ${entry.date}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao processar aportes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Falha ao processar aportes: ${errorMessage}`);
  }
};

/**
 * Função auxiliar para converter data local para timestamp
 * @param dateStr Data local no formato 'DD/MM/YYYY'
 * @returns Timestamp correspondente
 */
const parseLocalDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Função auxiliar para criar uma entrada no Supabase
 * @param userId ID do usuário
 * @param amount Valor investido
 * @param btc Bitcoin investido
 * @param price Cotação
 * @param currency Moeda
 * @param date Date da entrada
 * @param origin Origem da entrada
 */
const createBitcoinEntry = async (
  userId: string,
  amount: number,
  btc: number,
  price: number,
  currency: 'BRL' | 'USD',
  date: Date,
  origin: Origin
) => {
  // Calcular valor em USD e cotação USD/BRL se a moeda for BRL
  let valorUsd = null;
  let cotacaoUsdBrl = null;
  let cotacaoUsd = null;
  
  try {
    if (currency === 'BRL') {
      // Buscar a cotação histórica USD/BRL para a data do aporte
      cotacaoUsdBrl = await fetchHistoricalUsdBrlRate(date);
      
      if (cotacaoUsdBrl) {
        // Calcular valor em USD
        valorUsd = amount / cotacaoUsdBrl;
        // Calcular cotação BTC/USD
        cotacaoUsd = valorUsd / btc;
      }
    } else {
      // Se já está em USD, mantém o mesmo valor e define cotação USD/BRL como 1
      valorUsd = amount;
      cotacaoUsdBrl = 1;
      cotacaoUsd = price;
    }
  } catch (error) {
    console.error('Erro ao buscar cotação USD/BRL:', error);
  }

  const result = await supabase
    .from('aportes')
    .insert({
      data_aporte: date.toISOString().split('T')[0],
      moeda: currency,
      valor_investido: amount,
      bitcoin: btc,
      cotacao: price,
      cotacao_moeda: currency,
      origem_aporte: origin,
      origem_registro: 'planilha',
      user_id: userId,
      created_at: new Date().toISOString(),
      valor_usd: valorUsd,
      cotacao_usd_brl: cotacaoUsdBrl,
      cotacao_usd: cotacaoUsd
    });
    
  return result;
};

/**
 * Função para buscar a cotação histórica USD/BRL
 * @param date Data para a qual buscar a cotação
 * @returns Cotação USD/BRL ou null em caso de erro
 */
const fetchHistoricalUsdBrlRate = async (date: Date): Promise<number | null> => {
  try {
    // Formata a data para o formato esperado pela API (YYYYMMDD)
    const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '');
    
    // Buscar cotação na AwesomeAPI
    const response = await fetch(`https://economia.awesomeapi.com.br/json/daily/USD-BRL/1?start_date=${formattedDate}&end_date=${formattedDate}`);
    
    if (!response.ok) {
      console.warn(`API responded with status: ${response.status} for date ${formattedDate}`);
      // Tenta usar API alternativa em caso de falha
      return fetchAlternativeUsdBrlRate(date);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      // Pega o valor de fechamento (bid) da cotação na data
      const rate = parseFloat(data[0].bid);
      console.log(`Cotação USD/BRL para ${date.toISOString().split('T')[0]}: ${rate}`);
      return rate;
    } else {
      console.warn(`Nenhuma cotação encontrada para a data ${formattedDate}`);
      // Tenta usar API alternativa em caso de falha
      return fetchAlternativeUsdBrlRate(date);
    }
  } catch (error) {
    console.error("Erro ao buscar cotação histórica USD/BRL:", error);
    // Tenta usar API alternativa em caso de erro
    return fetchAlternativeUsdBrlRate(date);
  }
};

/**
 * API alternativa para buscar cotação USD/BRL caso a principal falhe
 * @param date Data do aporte
 * @returns Cotação USD/BRL ou null em caso de erro
 */
const fetchAlternativeUsdBrlRate = async (date: Date): Promise<number | null> => {
  try {
    const dateString = date.toISOString().split('T')[0];
    
    // Usar ExchangeRate.host como alternativa
    const response = await fetch(`https://api.exchangerate.host/${dateString}?base=USD&symbols=BRL`);
    
    if (!response.ok) {
      console.error(`API alternativa respondeu com status: ${response.status}`);
      // Se ambas as APIs falharem, tenta obter a cotação atual como último recurso
      return fetchCurrentUsdBrlRate();
    }
    
    const data = await response.json();
    
    if (data && data.rates && data.rates.BRL) {
      const rate = data.rates.BRL;
      console.log(`Cotação alternativa USD/BRL para ${dateString}: ${rate}`);
      return rate;
    } else {
      console.error(`Formato inválido de resposta da API alternativa para data ${dateString}`);
      // Se ambas as APIs falharem, tenta obter a cotação atual como último recurso
      return fetchCurrentUsdBrlRate();
    }
  } catch (error) {
    console.error("Erro ao buscar cotação alternativa USD/BRL:", error);
    // Se ambas as APIs falharem, tenta obter a cotação atual como último recurso
    return fetchCurrentUsdBrlRate();
  }
};

/**
 * Busca a cotação atual de USD/BRL como último recurso
 * @returns Cotação atual ou valor padrão em caso de erro
 */
const fetchCurrentUsdBrlRate = async (): Promise<number> => {
  try {
    // Buscar cotações atuais do Bitcoin
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl');
    const data = await response.json();
    
    if (data.bitcoin && data.bitcoin.usd && data.bitcoin.brl) {
      // Calcular cotação USD/BRL a partir da relação entre BTC/BRL e BTC/USD
      const rate = data.bitcoin.brl / data.bitcoin.usd;
      console.log('Usando cotação atual USD/BRL (último recurso):', rate);
      return rate;
    }
  } catch (error) {
    console.error("Erro ao buscar cotação atual USD/BRL:", error);
  }
  
  // Valor padrão aproximado em caso de falha completa
  console.warn("Usando valor padrão para cotação USD/BRL (5.0)");
  return 5.0;
};
