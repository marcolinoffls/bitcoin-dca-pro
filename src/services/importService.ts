
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
import { format, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Ler arquivo como ArrayBuffer
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Falha ao ler o arquivo'));
          return;
        }
        
        // Processar com a biblioteca xlsx
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Dados brutos da planilha:', jsonData);
        
        // Mapear cabeçalhos para nosso formato interno
        const mappedData = mapSpreadsheetData(jsonData);
        resolve(mappedData);
      } catch (error) {
        console.error('Erro ao processar planilha:', error);
        reject(new Error('Formato de arquivo inválido ou corrompido'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo'));
    };
    
    // Ler como array buffer
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
  const headers = Object.keys(firstRow);
  
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
  
  // Verificar colunas obrigatórias
  if (!dataColumn || !valorColumn || !bitcoinColumn) {
    const missingColumns = [];
    if (!dataColumn) missingColumns.push('Data');
    if (!valorColumn) missingColumns.push('Valor Investido');
    if (!bitcoinColumn) missingColumns.push('Bitcoin');
    
    throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
  }
  
  // Mapear todos os dados
  return jsonData.map((row: any, index: number): RawImportData => {
    // Processar valores para garantir tipos corretos
    let valorInvestido = parseFloat(String(row[valorColumn]).replace(',', '.'));
    let bitcoin = parseFloat(String(row[bitcoinColumn]).replace(',', '.'));
    
    // Validar valores
    if (isNaN(valorInvestido)) {
      throw new Error(`Valor investido inválido na linha ${index + 2}: ${JSON.stringify(row)}`);
    }
    if (isNaN(bitcoin)) {
      throw new Error(`Quantidade de Bitcoin inválida na linha ${index + 2}: ${JSON.stringify(row)}`);
    }
    
    // Processar data
    let dataValue = row[dataColumn];
    
    return {
      data: dataValue,
      valorInvestido,
      bitcoin,
      cotacao: cotacaoColumn ? parseFloat(String(row[cotacaoColumn]).replace(',', '.')) : undefined,
      moeda: moedaColumn ? normalizeValorMoeda(row[moedaColumn]) : 'BRL',
      origem: origemColumn ? normalizeValorOrigem(row[origemColumn]) : 'corretora'
    };
  });
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
 * Tenta analisar uma string de data em vários formatos comuns
 * @param dateStr String da data a ser convertida
 * @returns Date objeto ou null se não for possível converter
 */
const parseDateString = (dateStr: string): Date | null => {
  console.log(`Tentando converter string de data: "${dateStr}"`);
  
  // Se vazio ou não é string, retornar null
  if (!dateStr || typeof dateStr !== 'string') {
    console.error('Data inválida: vazia ou não é string');
    return null;
  }
  
  // Remover espaços extras
  dateStr = dateStr.trim();
  
  // Tentar diferentes formatos comuns de data
  const formatosData = [
    // Formatos DD/MM/YYYY
    'dd/MM/yyyy',
    'd/MM/yyyy',
    'dd/M/yyyy',
    'd/M/yyyy',
    // Formatos DD-MM-YYYY
    'dd-MM-yyyy',
    'd-MM-yyyy',
    'dd-M-yyyy',
    'd-M-yyyy',
    // Formatos DD.MM.YYYY
    'dd.MM.yyyy',
    'd.MM.yyyy',
    'dd.M.yyyy',
    'd.M.yyyy',
    // Formatos USA MM/DD/YYYY
    'MM/dd/yyyy',
    'M/dd/yyyy',
    'MM/d/yyyy',
    'M/d/yyyy',
    // Formatos ISO
    'yyyy-MM-dd',
    'yyyy/MM/dd',
    'yyyy.MM.dd'
  ];
  
  // Tentar cada formato
  for (const formatoData of formatosData) {
    try {
      const parsedDate = parse(dateStr, formatoData, new Date());
      
      // Verificar se a data é válida e recente (posterior a 1970)
      if (isValid(parsedDate) && parsedDate.getFullYear() > 1970 && parsedDate.getFullYear() < 2100) {
        console.log(`Data convertida com sucesso usando formato ${formatoData}: ${parsedDate.toISOString()}`);
        return parsedDate;
      }
    } catch (error) {
      // Continua tentando outros formatos
    }
  }
  
  // Se chegou aqui, tentar como timestamp ou formato nativo de Date
  try {
    // Verificar se é um timestamp (número)
    if (!isNaN(Number(dateStr))) {
      const timestamp = Number(dateStr);
      const dateParsed = new Date(timestamp);
      
      if (isValid(dateParsed) && dateParsed.getFullYear() > 1970 && dateParsed.getFullYear() < 2100) {
        return dateParsed;
      }
    }
    
    // Tentar como formato de data nativo
    const dateParsed = new Date(dateStr);
    if (isValid(dateParsed) && dateParsed.getFullYear() > 1970 && dateParsed.getFullYear() < 2100) {
      return dateParsed;
    }
  } catch (error) {
    console.error('Erro ao converter data:', error);
  }
  
  console.error(`Não foi possível converter a data: "${dateStr}"`);
  return null;
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
): { supabaseEntries: any[], appEntries: BitcoinEntry[], invalidRows: {row: number, reason: string}[] } => {
  const supabaseEntries: any[] = [];
  const appEntries: BitcoinEntry[] = [];
  const invalidRows: {row: number, reason: string}[] = [];
  
  for (let i = 0; i < rawData.length; i++) {
    try {
      const item = rawData[i];
      
      // Processar e validar a data
      let entryDate: Date | null = null;
      
      // Se já for um objeto Date
      if (item.data instanceof Date && isValid(item.data)) {
        entryDate = item.data;
      } else {
        // Tentar converter a string para data
        entryDate = parseDateString(String(item.data));
      }
      
      // Verificar se a data é válida
      if (!entryDate) {
        invalidRows.push({
          row: i + 2, // +2 porque temos o cabeçalho (1) e o array é 0-indexed
          reason: `Data inválida: "${item.data}"`
        });
        continue; // Pular para o próximo item
      }
      
      // Verificar se a data está dentro de um intervalo razoável (1990-2100)
      if (entryDate.getFullYear() < 1990 || entryDate.getFullYear() > 2100) {
        invalidRows.push({
          row: i + 2,
          reason: `Ano fora de intervalo válido: ${entryDate.getFullYear()}`
        });
        continue;
      }
      
      // Formatação segura para ISO String (YYYY-MM-DD)
      const formattedDate = format(entryDate, 'yyyy-MM-dd');
      
      // Validar valores numéricos
      if (item.valorInvestido <= 0) {
        invalidRows.push({
          row: i + 2,
          reason: 'Valor investido deve ser maior que zero'
        });
        continue;
      }
      
      if (item.bitcoin <= 0) {
        invalidRows.push({
          row: i + 2,
          reason: 'Quantidade de Bitcoin deve ser maior que zero'
        });
        continue;
      }
      
      // Calcular cotação se não fornecida
      const exchangeRate = item.cotacao || (item.valorInvestido / item.bitcoin);
      
      if (exchangeRate <= 0 || !isFinite(exchangeRate)) {
        invalidRows.push({
          row: i + 2,
          reason: 'Cotação inválida ou resultou em valor inválido'
        });
        continue;
      }
      
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
        origem_aporte: item.origem || 'planilha' // Marcar origem como planilha
      };
      
      // Objeto BitcoinEntry para o app
      const appEntry: BitcoinEntry = {
        id,
        date: entryDate,
        amountInvested: item.valorInvestido,
        btcAmount: item.bitcoin,
        exchangeRate,
        currency: item.moeda || 'BRL',
        origin: 'planilha' // Marcar origem como planilha
      };
      
      supabaseEntries.push(supabaseEntry);
      appEntries.push(appEntry);
    } catch (error) {
      console.error(`Erro ao processar linha ${i + 2}:`, error);
      invalidRows.push({
        row: i + 2,
        reason: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  }
  
  return { supabaseEntries, appEntries, invalidRows };
};

/**
 * Importa dados para o Supabase
 * @param entries Entradas preparadas para inserção
 * @returns Resultado da operação com contagem de registros inseridos
 */
export const importEntriesToSupabase = async (entries: any[]): Promise<{ count: number }> => {
  if (!entries.length) {
    throw new Error('Nenhum dado válido para importar');
  }
  
  // Inserir em lotes de 100 para evitar limite de tamanho da requisição
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('aportes')
      .insert(batch);
    
    if (error) {
      console.error('Erro ao importar lote para Supabase:', error);
      throw new Error(`Erro ao salvar dados: ${error.message}`);
    }
    
    inserted += batch.length;
  }
  
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
): Promise<{ count: number, entries: BitcoinEntry[], invalidRows?: {row: number, reason: string}[] }> => {
  try {
    // Fase 1: Leitura do arquivo (25%)
    onProgress?.(25, 'Lendo arquivo...');
    const rawData = await readSpreadsheetFile(file);
    
    // Fase 2: Processamento e validação (50%)
    onProgress?.(50, 'Processando dados...');
    const { supabaseEntries, appEntries, invalidRows } = prepareImportedEntries(rawData, userId);
    
    // Se não houver nenhuma entrada válida, lançar erro
    if (supabaseEntries.length === 0) {
      throw new Error('Nenhum dado válido encontrado na planilha. Por favor, verifique o formato.');
    }
    
    // Fase 3: Importação para o Supabase (75%)
    onProgress?.(75, 'Enviando ao servidor...');
    const result = await importEntriesToSupabase(supabaseEntries);
    
    // Fase 4: Concluído (100%)
    onProgress?.(100, 'Concluído!');
    
    return {
      count: result.count,
      entries: appEntries,
      invalidRows: invalidRows.length > 0 ? invalidRows : undefined
    };
  } catch (error) {
    console.error('Erro durante importação:', error);
    throw error;
  }
};

