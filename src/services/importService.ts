
import { parse as parseCsv } from 'papaparse';
import { read as readXlsx, utils as xlsxUtils } from 'xlsx';
import { BitcoinEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Serviço responsável por importar aportes de Bitcoin
 * a partir de arquivos CSV ou XLSX.
 */

/**
 * Tipo para representar os dados de um aporte após a leitura inicial do arquivo.
 * Os valores ainda precisarão ser processados para converter tipos.
 */
interface RawEntry {
  [key: string]: string;
}

/**
 * Normaliza o nome das colunas para um formato padronizado
 * independente de como elas aparecem no arquivo original
 * 
 * @param columnName Nome original da coluna no arquivo
 * @returns Nome normalizado da coluna
 */
function normalizeColumnName(columnName: string): string {
  const name = columnName.toLowerCase().trim();
  
  if (/data|date|dt/i.test(name)) {
    return 'date';
  }
  
  if (/valor|investido|investimento|amount|brl|usd|reais|dolares|valor investido/i.test(name)) {
    return 'amount';
  }
  
  if (/bitcoin|btc|satoshi|sats|satoshis/i.test(name)) {
    return 'btc';
  }
  
  if (/cotacao|preco|taxa|price|rate|cotação|exchange rate/i.test(name)) {
    return 'rate';
  }
  
  if (/moeda|currency|currenc/i.test(name)) {
    return 'currency';
  }
  
  return name;
}

/**
 * Detecta o formato de data a partir de uma string e converte para Date
 * 
 * @param dateStr String de data em formato desconhecido
 * @returns Objeto Date ou null se a conversão falhar
 */
function parseDate(dateStr: string): Date | null {
  // Limpa a string
  dateStr = dateStr.trim();
  
  // Verifica se é data no Excel (número de dias desde 1/1/1900)
  if (!isNaN(Number(dateStr)) && Number(dateStr) > 1000) {
    // Converte número de dias do Excel para timestamp JavaScript
    const excelDate = Number(dateStr);
    // Excel usa 1/1/1900 como dia 1, então precisamos ajustar
    const date = new Date(1900, 0, 1);
    date.setDate(date.getDate() + excelDate - 2); // -2 para correção do Excel
    return date;
  }
  
  // Para formato DD/MM/AAAA ou DD-MM-AAAA (brasileiro)
  const brRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/;
  if (brRegex.test(dateStr)) {
    const match = dateStr.match(brRegex);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Mês começa de 0 em JavaScript
      let year = parseInt(match[3], 10);
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      const date = new Date(year, month, day);
      return date;
    }
  }
  
  // Para formato MM/DD/AAAA (americano)
  const usRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  if (usRegex.test(dateStr)) {
    const match = dateStr.match(usRegex);
    if (match) {
      const month = parseInt(match[1], 10) - 1;
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      const date = new Date(year, month, day);
      return date;
    }
  }
  
  // Para formato AAAA-MM-DD (ISO)
  const isoRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  if (isoRegex.test(dateStr)) {
    const match = dateStr.match(isoRegex);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      
      const date = new Date(year, month, day);
      return date;
    }
  }
  
  // Tenta parse nativo do JavaScript como último recurso
  const fallbackDate = new Date(dateStr);
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }
  
  return null;
}

/**
 * Normaliza um número a partir de uma string, lidando com diferentes
 * formatos (brasileiro com vírgula, americano com ponto, etc)
 * 
 * @param value String representando um número
 * @returns Número convertido ou null se a conversão falhar
 */
function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') {
    return null;
  }
  
  // Remove todos os símbolos de moeda, espaços e outros caracteres não-numéricos
  // mantendo apenas números, pontos e vírgulas
  const sanitized = value.replace(/[^\d.,\-]/g, '');
  
  // Verifica se é formato brasileiro (vírgula como decimal)
  if (sanitized.includes(',') && !sanitized.includes('.')) {
    return parseFloat(sanitized.replace(',', '.'));
  }
  
  // Se tem vírgula como separador de milhar e ponto como decimal
  if (sanitized.includes(',') && sanitized.includes('.')) {
    // Se a vírgula vem antes do último ponto, é separador de milhar
    const lastDotIndex = sanitized.lastIndexOf('.');
    const lastCommaIndex = sanitized.lastIndexOf(',');
    
    if (lastCommaIndex < lastDotIndex) {
      return parseFloat(sanitized.replace(/,/g, ''));
    } else {
      // Caso contrário, é decimal (formato brasileiro com milhares)
      return parseFloat(sanitized.replace(/\./g, '').replace(',', '.'));
    }
  }
  
  // Formato padrão com ponto
  return parseFloat(sanitized);
}

/**
 * Processa os dados brutos do arquivo para criar entradas de Bitcoin formatadas
 * 
 * @param rawEntries Dados brutos extraídos do arquivo
 * @returns Array de entradas de Bitcoin processadas
 */
function processEntries(rawEntries: RawEntry[]): BitcoinEntry[] {
  return rawEntries
    .map((rawEntry) => {
      // Converte nomes de colunas para um formato padrão
      const normalizedEntry: Record<string, string> = {};
      Object.keys(rawEntry).forEach((key) => {
        const normalizedKey = normalizeColumnName(key);
        normalizedEntry[normalizedKey] = rawEntry[key];
      });
      
      // Extrai e converte valores
      const dateValue = normalizedEntry.date || '';
      const date = parseDate(dateValue);
      
      if (!date) {
        console.error(`Data inválida: ${dateValue}`);
        return null;
      }
      
      const amountValue = normalizedEntry.amount || '';
      const amount = parseNumber(amountValue);
      
      if (amount === null || isNaN(amount)) {
        console.error(`Valor investido inválido: ${amountValue}`);
        return null;
      }
      
      const btcValue = normalizedEntry.btc || '';
      const btcAmount = parseNumber(btcValue);
      
      if (btcAmount === null || isNaN(btcAmount)) {
        console.error(`Quantidade de BTC inválida: ${btcValue}`);
        return null;
      }
      
      // Detecção de moeda (BRL ou USD)
      let currency: 'BRL' | 'USD' = 'BRL'; // Padrão BRL
      if (normalizedEntry.currency) {
        const currencyStr = normalizedEntry.currency.toUpperCase().trim();
        if (currencyStr === 'USD' || currencyStr.includes('DOLAR') || currencyStr.includes('$')) {
          currency = 'USD';
        }
      } else if (amountValue.includes('$') && !amountValue.includes('R$')) {
        currency = 'USD';
      }
      
      // Para calcular a taxa de câmbio se não estiver presente
      let exchangeRate = 0;
      if (normalizedEntry.rate) {
        const rateValue = parseNumber(normalizedEntry.rate);
        if (rateValue !== null && !isNaN(rateValue)) {
          exchangeRate = rateValue;
        }
      }
      
      // Se não tiver taxa, calcula com base no valor e quantidade de BTC
      if (exchangeRate === 0 && btcAmount > 0) {
        exchangeRate = amount / btcAmount;
      }
      
      return {
        id: uuidv4(),
        date,
        amountInvested: amount,
        btcAmount: btcAmount,
        exchangeRate,
        currency,
        origin: 'planilha' as const // Marca a origem como planilha
      };
    })
    .filter((entry): entry is BitcoinEntry => entry !== null);
}

/**
 * Importa aportes de um arquivo CSV
 * 
 * @param file Arquivo CSV a ser importado
 * @returns Promise com as entradas processadas
 */
export function importFromCsv(file: File): Promise<BitcoinEntry[]> {
  return new Promise((resolve, reject) => {
    parseCsv(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('Erros ao parsear CSV:', results.errors);
          reject(new Error('Erro ao processar o arquivo CSV. Verifique o formato.'));
          return;
        }
        
        const entries = processEntries(results.data as RawEntry[]);
        if (entries.length === 0) {
          reject(new Error('Nenhum aporte válido encontrado no arquivo.'));
          return;
        }
        
        resolve(entries);
      },
      error: (error) => {
        console.error('Erro ao parsear CSV:', error);
        reject(new Error('Erro ao processar o arquivo CSV.'));
      }
    });
  });
}

/**
 * Importa aportes de um arquivo Excel (XLSX)
 * 
 * @param file Arquivo Excel a ser importado
 * @returns Promise com as entradas processadas
 */
export function importFromExcel(file: File): Promise<BitcoinEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target || typeof e.target.result !== 'string' && !(e.target.result instanceof ArrayBuffer)) {
          reject(new Error('Erro ao ler o arquivo Excel.'));
          return;
        }
        
        const data = e.target.result;
        const workbook = readXlsx(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsxUtils.sheet_to_json<RawEntry>(worksheet, { header: 'A' });
        
        // Se a primeira linha for cabeçalho, converte para chaves no objeto
        const hasHeader = typeof jsonData[0].A === 'string' && 
                          !jsonData[0].A.match(/^\d/) &&
                          (jsonData[0].A.toLowerCase().includes('data') || 
                           jsonData[0].A.toLowerCase().includes('date'));
        
        let processedData: RawEntry[];
        
        if (hasHeader) {
          // Usa a primeira linha como cabeçalho
          const headers = Object.values(jsonData[0]);
          processedData = xlsxUtils.sheet_to_json<RawEntry>(worksheet);
        } else {
          // Usa cabeçalhos padrão
          processedData = xlsxUtils.sheet_to_json<RawEntry>(worksheet, { header: ['date', 'amount', 'btc', 'rate'] });
        }
        
        const entries = processEntries(processedData);
        if (entries.length === 0) {
          reject(new Error('Nenhum aporte válido encontrado no arquivo.'));
          return;
        }
        
        resolve(entries);
      } catch (error) {
        console.error('Erro ao processar Excel:', error);
        reject(new Error('Erro ao processar o arquivo Excel.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo Excel.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Importa aportes de um arquivo (detecta automaticamente o formato)
 * 
 * @param file Arquivo a ser importado (CSV ou XLSX)
 * @returns Promise com as entradas processadas
 */
export async function importFromFile(file: File): Promise<BitcoinEntry[]> {
  const fileType = file.name.split('.').pop()?.toLowerCase();
  
  if (fileType === 'csv') {
    return importFromCsv(file);
  } else if (fileType === 'xlsx' || fileType === 'xls') {
    return importFromExcel(file);
  } else {
    throw new Error('Formato de arquivo não suportado. Use CSV ou XLSX.');
  }
}
