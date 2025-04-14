
/**
 * Serviço para importação de planilhas
 * 
 * Este serviço fornece funções para:
 * - Ler e processar arquivos CSV e Excel
 * - Validar dados de aportes
 * - Enviar dados ao Supabase
 * 
 * É usado pelo componente EntriesList para importar aportes a partir
 * de planilhas fornecidas pelo usuário
 */

import { supabase } from '@/integrations/supabase/client';
import { BitcoinEntry } from '@/types';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface para mapear dados importados de planilha
 */
interface RawImportData {
  data: string | Date;
  valorInvestido: number;
  bitcoin: number;
  cotacao?: number;
  moeda?: 'BRL' | 'USD';
  origem?: 'corretora' | 'p2p';
}

/**
 * Lê arquivo CSV ou Excel e retorna os dados em formato bruto
 * @param file Arquivo CSV ou Excel a ser processado
 * @returns Promise com array de dados brutos da planilha
 */
export const readSpreadsheetFile = async (file: File): Promise<RawImportData[]> => {
  console.log('[importService] Iniciando leitura do arquivo:', file.name, file.type, file.size);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Ler arquivo como ArrayBuffer
        const data = e.target?.result;
        console.log('[importService] Arquivo carregado com sucesso, tamanho:', data ? 
          (data as ArrayBuffer).byteLength : 'dados vazios');
        
        if (!data) {
          const erro = new Error('Falha ao ler o arquivo');
          console.error('[importService] Erro:', erro);
          reject(erro);
          return;
        }
        
        // Processar com a biblioteca xlsx
        console.log('[importService] Processando dados com XLSX...');
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          const erro = new Error('Planilha não contém nenhuma página');
          console.error('[importService] Erro:', erro);
          reject(erro);
          return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        console.log('[importService] Nome da primeira folha:', firstSheetName);
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        if (!worksheet) {
          const erro = new Error('Não foi possível acessar a página da planilha');
          console.error('[importService] Erro:', erro);
          reject(erro);
          return;
        }
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('[importService] Dados brutos da planilha:', jsonData);
        
        if (!jsonData || jsonData.length === 0) {
          const erro = new Error('A planilha não contém dados');
          console.error('[importService] Erro:', erro);
          reject(erro);
          return;
        }
        
        console.log('[importService] Total de linhas encontradas:', jsonData.length);
        
        // Mapear cabeçalhos para nosso formato interno
        console.log('[importService] Mapeando cabeçalhos...');
        const mappedData = mapSpreadsheetData(jsonData);
        console.log('[importService] Mapeamento concluído, linhas válidas:', mappedData.length);
        
        resolve(mappedData);
      } catch (error) {
        console.error('[importService] Erro ao processar planilha:', error);
        reject(new Error('Formato de arquivo inválido ou corrompido'));
      }
    };
    
    reader.onerror = (error) => {
      console.error('[importService] Erro no FileReader:', error);
      reject(new Error('Falha ao ler o arquivo'));
    };
    
    // Ler como array buffer
    console.log('[importService] Iniciando leitura do arquivo como ArrayBuffer...');
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Mapeia os dados da planilha para o formato interno
 * Aceita diferentes formatos de cabeçalho: português, inglês, com/sem acentos
 * @param jsonData Dados JSON extraídos da planilha
 * @returns Array de dados mapeados
 */
const mapSpreadsheetData = (jsonData: any[]): RawImportData[] => {
  if (!jsonData || jsonData.length === 0) {
    throw new Error('A planilha está vazia ou não contém dados válidos');
  }
  
  // Obter a primeira linha para identificar colunas
  const firstRow = jsonData[0];
  console.log('[importService] Primeira linha para análise de cabeçalhos:', firstRow);
  
  const headers = Object.keys(firstRow);
  console.log('[importService] Cabeçalhos encontrados:', headers);
  
  // Mapear cabeçalhos para nomes padronizados
  const headerMap: Record<string, string[]> = {
    data: ['data', 'date', 'data_aporte', 'data aporte', 'dt', 'data do aporte'],
    valorInvestido: ['valor', 'valor_investido', 'valor investido', 'investimento', 'amount', 'value', 'investimento', 'investimento (brl)'],
    bitcoin: ['btc', 'bitcoin', 'quantidade', 'quantia', 'amount', 'sats', 'satoshis'],
    cotacao: ['cotacao', 'cotação', 'preco', 'preço', 'rate', 'exchange', 'preco_btc', 'preço btc'],
    moeda: ['moeda', 'currency', 'coin', 'cambio', 'câmbio'],
    origem: ['origem', 'origin', 'source', 'tipo', 'type']
  };
  
  // Função para encontrar o nome da coluna com base nos cabeçalhos possíveis
  const findColumnName = (possibleNames: string[]): string | null => {
    const columnName = headers.find(header => 
      possibleNames.includes(header.toLowerCase().trim())
    );
    return columnName || null;
  };
  
  // Mapear colunas da planilha para nossas propriedades
  const dataColumn = findColumnName(headerMap.data);
  const valorColumn = findColumnName(headerMap.valorInvestido);
  const bitcoinColumn = findColumnName(headerMap.bitcoin);
  const cotacaoColumn = findColumnName(headerMap.cotacao);
  const moedaColumn = findColumnName(headerMap.moeda);
  const origemColumn = findColumnName(headerMap.origem);
  
  console.log('[importService] Mapeamento de colunas:', {
    data: dataColumn,
    valor: valorColumn,
    bitcoin: bitcoinColumn,
    cotacao: cotacaoColumn,
    moeda: moedaColumn,
    origem: origemColumn
  });
  
  // Verificar colunas obrigatórias
  if (!dataColumn || !valorColumn || !bitcoinColumn) {
    const missingColumns = [];
    if (!dataColumn) missingColumns.push('Data');
    if (!valorColumn) missingColumns.push('Valor Investido');
    if (!bitcoinColumn) missingColumns.push('Bitcoin');
    
    const erro = new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
    console.error('[importService] Erro de validação:', erro);
    throw erro;
  }
  
  console.log('[importService] Iniciando processamento das linhas...');
  
  // Mapear todos os dados
  const mappedData = jsonData.map((row: any, index: number): RawImportData => {
    try {
      // Processar valores para garantir tipos corretos
      console.log(`[importService] Processando linha ${index + 1}:`, row);
      
      let valorInvestido: number;
      try {
        valorInvestido = parseFloat(String(row[valorColumn]).replace(',', '.'));
        console.log(`[importService] Valor investido processado: ${valorInvestido}`);
      } catch (e) {
        console.error(`[importService] Erro ao processar valor investido na linha ${index + 1}:`, e);
        throw new Error(`Valor investido inválido na linha ${index + 1}: ${row[valorColumn]}`);
      }
      
      let bitcoin: number;
      try {
        bitcoin = parseFloat(String(row[bitcoinColumn]).replace(',', '.'));
        console.log(`[importService] Quantidade de Bitcoin processada: ${bitcoin}`);
      } catch (e) {
        console.error(`[importService] Erro ao processar quantidade de Bitcoin na linha ${index + 1}:`, e);
        throw new Error(`Quantidade de Bitcoin inválida na linha ${index + 1}: ${row[bitcoinColumn]}`);
      }
      
      // Validar valores
      if (isNaN(valorInvestido)) {
        const erro = new Error(`Valor investido inválido na linha ${index + 1}: ${row[valorColumn]}`);
        console.error('[importService] Erro de validação:', erro);
        throw erro;
      }
      if (isNaN(bitcoin)) {
        const erro = new Error(`Quantidade de Bitcoin inválida na linha ${index + 1}: ${row[bitcoinColumn]}`);
        console.error('[importService] Erro de validação:', erro);
        throw erro;
      }
      
      // Processar data
      let dataValue = row[dataColumn];
      console.log(`[importService] Data original: ${dataValue}`);
      
      return {
        data: dataValue,
        valorInvestido,
        bitcoin,
        cotacao: cotacaoColumn ? parseFloat(String(row[cotacaoColumn]).replace(',', '.')) : undefined,
        moeda: moedaColumn ? normalizeValorMoeda(row[moedaColumn]) : 'BRL',
        origem: origemColumn ? normalizeValorOrigem(row[origemColumn]) : 'corretora'
      };
    } catch (error) {
      console.error(`[importService] Erro ao processar linha ${index + 1}:`, error);
      throw error;
    }
  });
  
  console.log('[importService] Processamento concluído com sucesso:', mappedData);
  return mappedData;
};

/**
 * Normaliza o valor da moeda para o formato aceito pelo sistema
 * @param valor Valor da moeda na planilha
 * @returns Moeda normalizada (BRL ou USD)
 */
const normalizeValorMoeda = (valor: any): 'BRL' | 'USD' => {
  const strValor = String(valor).toUpperCase().trim();
  
  if (['USD', 'DOLAR', 'DÓLAR', '$', 'US$', 'DOLLAR'].includes(strValor)) {
    return 'USD';
  }
  
  return 'BRL'; // Valor padrão
};

/**
 * Normaliza o valor da origem para o formato aceito pelo sistema
 * @param valor Valor da origem na planilha
 * @returns Origem normalizada (corretora ou p2p)
 */
const normalizeValorOrigem = (valor: any): 'corretora' | 'p2p' => {
  const strValor = String(valor).toLowerCase().trim();
  
  if (['p2p', 'peer', 'peer-to-peer', 'p2p', 'pessoal', 'pessoa-pessoa'].includes(strValor)) {
    return 'p2p';
  }
  
  return 'corretora'; // Valor padrão
};

/**
 * Converte dados brutos importados em objetos BitcoinEntry prontos para inserção
 * @param rawData Dados brutos mapeados da planilha
 * @param userId ID do usuário atual
 * @returns Array de objetos prontos para inserção no Supabase
 */
export const prepareImportedEntries = (
  rawData: RawImportData[], 
  userId: string
): { supabaseEntries: any[], appEntries: BitcoinEntry[] } => {
  console.log('[importService] Preparando dados para importação, total de linhas:', rawData.length);
  
  const supabaseEntries: any[] = [];
  const appEntries: BitcoinEntry[] = [];
  
  for (const item of rawData) {
    try {
      console.log('[importService] Processando item:', item);
      
      // Processar data no formato DD/MM/AAAA, MM/DD/AAAA ou Date
      let entryDate: Date;
      
      if (item.data instanceof Date) {
        entryDate = item.data;
        console.log('[importService] Data já é um objeto Date:', entryDate);
      } else {
        // Tentar formatos comuns
        const dateParts = String(item.data).split(/[/.-]/);
        console.log('[importService] Partes da data:', dateParts);
        
        // Verificar formato DD/MM/AAAA (ou com separadores - ou .)
        if (dateParts.length === 3) {
          // Se parece com DD/MM/AAAA (dias geralmente < 31, meses < 12)
          if (parseInt(dateParts[0]) <= 31 && parseInt(dateParts[1]) <= 12) {
            entryDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T00:00:00`);
            console.log('[importService] Data interpretada como DD/MM/AAAA:', entryDate);
          } else {
            // Assumir MM/DD/AAAA (formato americano)
            entryDate = new Date(`${dateParts[2]}-${dateParts[0]}-${dateParts[1]}T00:00:00`);
            console.log('[importService] Data interpretada como MM/DD/AAAA:', entryDate);
          }
        } else {
          // Tentar analisar como string de data
          entryDate = new Date(String(item.data));
          console.log('[importService] Data interpretada diretamente:', entryDate);
        }
      }
      
      // Verificar se a data é válida
      if (isNaN(entryDate.getTime())) {
        const erro = new Error(`Data inválida: ${item.data}`);
        console.error('[importService] Erro de validação de data:', erro);
        throw erro;
      }
      
      // Formatar para ISO String YYYY-MM-DD
      const formattedDate = entryDate.toISOString().split('T')[0];
      console.log('[importService] Data formatada:', formattedDate);
      
      // Calcular cotação se não fornecida
      const exchangeRate = item.cotacao || (item.valorInvestido / item.bitcoin);
      console.log('[importService] Cotação calculada:', exchangeRate);
      
      // Gerar ID único
      const id = uuidv4();
      
      // Objeto para inserção no Supabase
      const supabaseEntry = {
        id,
        user_id: userId,
        data_aporte: formattedDate,
        valor_investido: item.valorInvestido,
        bitcoin: item.bitcoin,
        cotacao: exchangeRate,
        moeda: item.moeda || 'BRL',
        cotacao_moeda: item.moeda || 'BRL',
        origem_aporte: item.origem || 'planilha', // Marcar origem como planilha
        origem_registro: 'planilha'  // Nova coluna: define que veio de importação
      };
      
      // Objeto BitcoinEntry para o app
      const appEntry: BitcoinEntry = {
        id,
        date: entryDate,
        amountInvested: item.valorInvestido,
        btcAmount: item.bitcoin,
        exchangeRate,
        currency: item.moeda || 'BRL',
        origin: item.origem || 'planilha', // Marcar origem como planilha
        registrationSource: 'planilha'  // Nova propriedade para rastrear a origem do registro
      };
      
      supabaseEntries.push(supabaseEntry);
      appEntries.push(appEntry);
      
      console.log('[importService] Item processado com sucesso:', { id, formattedDate });
    } catch (error) {
      console.error('[importService] Erro ao processar linha:', error);
      throw error;
    }
  }
  
  console.log('[importService] Preparação concluída, total de itens:', supabaseEntries.length);
  return { supabaseEntries, appEntries };
};

/**
 * Importa dados para o Supabase
 * @param entries Entradas preparadas para inserção
 * @returns Resultado da operação com contagem de registros inseridos
 */
export const importEntriesToSupabase = async (entries: any[]): Promise<{ count: number }> => {
  console.log('[importService] Iniciando importação para Supabase, total de registros:', entries.length);
  
  if (!entries.length) {
    const erro = new Error('Nenhum dado válido para importar');
    console.error('[importService] Erro:', erro);
    throw erro;
  }
  
  // Inserir em lotes de 100 para evitar limite de tamanho da requisição
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    console.log(`[importService] Processando lote ${Math.floor(i/batchSize) + 1}, tamanho: ${batch.length}`);
    
    const { error } = await supabase
      .from('aportes')
      .insert(batch);
    
    if (error) {
      console.error('[importService] Erro ao importar lote para Supabase:', error);
      throw new Error(`Erro ao salvar dados: ${error.message}`);
    }
    
    inserted += batch.length;
    console.log(`[importService] Lote ${Math.floor(i/batchSize) + 1} importado com sucesso, total inserido até agora: ${inserted}`);
  }
  
  console.log('[importService] Importação concluída com sucesso, total de registros:', inserted);
  return { count: inserted };
};

/**
 * Executa o processo completo de importação
 * @param file Arquivo CSV/Excel a ser importado
 * @param userId ID do usuário atual
 * @param onProgress Callback para atualização de progresso
 * @returns Resultado da importação com contagem e entradas
 */
export const importSpreadsheet = async (
  file: File,
  userId: string,
  onProgress?: (progress: number, stage: string) => void
): Promise<{ count: number, entries: any[], previewData: BitcoinEntry[] }> => {
  console.log('[importService] Iniciando processo de importação de planilha:', file.name);
  
  try {
    // Fase 1: Leitura do arquivo (25%)
    console.log('[importService] Fase 1: Leitura do arquivo');
    onProgress?.(25, 'Lendo arquivo...');
    const rawData = await readSpreadsheetFile(file);
    console.log('[importService] Arquivo lido com sucesso, linhas encontradas:', rawData.length);
    
    // ...existing code...

    // Fase 2: Processamento e validação (50%)
    onProgress?.(50, 'Processando dados...');
    const { supabaseEntries, appEntries } = prepareImportedEntries(rawData, userId);
    
    // Fase 3: Enviar dados para o webhook do n8n
    onProgress?.(75, 'Enviando dados para o webhook...');
    try {
      const webhookUrl = 'https://primary-production-3045.up.railway.app/webhook/import-satisfaction'; // Substitua pela URL do seu webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appEntries), // Enviar os dados processados
      });
    
      if (!response.ok) {
        throw new Error(`Erro ao enviar dados para o webhook: ${response.statusText}`);
      }
    
      console.log('Dados enviados com sucesso para o webhook');
    } catch (error) {
      console.error('Erro ao enviar dados para o webhook:', error);
      throw new Error('Falha ao enviar dados para o webhook');
    }
    
    // Retorna dados para pré-visualização antes de inserir
    return {
      count: appEntries.length,
      entries: appEntries,
      previewData: appEntries,
    };
    
    onProgress?.(70, 'Concluído! Visualize os dados antes de confirmar.');
    
    return {
      count: appEntries.length,
      entries: supabaseEntries, // Dados para o Supabase
      previewData: appEntries // Dados formatados para o app
    };
  } catch (error) {
    console.error('[importService] Erro durante importação:', error);
    throw error;
  }
};

/**
 * Confirma a importação após a pré-visualização
 * @param entries Entradas preparadas para inserção
 * @returns Resultado da importação
 */
export const confirmImport = async (entries: any[]): Promise<{ count: number }> => {
  console.log('[importService] Iniciando confirmação de importação, total de registros:', entries.length);
  
  try {
    // Fase 3: Importação para o Supabase
    const result = await importEntriesToSupabase(entries);
    console.log('[importService] Importação finalizada com sucesso:', result);
    
    return {
      count: result.count
    };
  } catch (error) {
    console.error('[importService] Erro ao confirmar importação:', error);
    throw error;
  }
};
