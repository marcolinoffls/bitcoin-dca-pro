import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface ImportResult {
  count: number;
  entries: any[];
}

interface ParsedRow {
  data_aporte: string;
  valor_investido: number;
  bitcoin: number;
  cotacao?: number;
}

const parseExcelDate = (excelDate: number): Date => {
  const secondsInDay = 24 * 60 * 60;
  const excelEpoch = new Date(Date.UTC(1899, 11, 31));
  const excelEpochMilliseconds = excelEpoch.getTime();
  return new Date(excelEpochMilliseconds + (excelDate * secondsInDay * 1000));
};

const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

const parseRow = (row: any): ParsedRow | null => {
  if (!row) return null;

  let data_aporte = row['Data'] || row['data'] || row['Data Aporte'] || row['data aporte'];
  const valor_investido = row['Valor Investido'] || row['valor investido'] || row['Valor_Investido'] || row['valor_investido'];
  const bitcoin = row['Bitcoin'] || row['bitcoin'] || row['BTC'] || row['btc'];
  const cotacao = row['Cotação'] || row['cotacao'];

  if (!data_aporte || !valor_investido || !bitcoin) {
    console.warn('Linha incompleta, ignorando:', row);
    return null;
  }

  let parsedDate: Date;

  if (typeof data_aporte === 'number') {
    parsedDate = parseExcelDate(data_aporte);
  } else {
    parsedDate = new Date(data_aporte);
  }

  if (!isValidDate(parsedDate)) {
    console.warn('Data inválida, ignorando:', data_aporte);
    return null;
  }

  const parsedValorInvestido = parseFloat(valor_investido);
  const parsedBitcoin = parseFloat(bitcoin);
  const parsedCotacao = cotacao ? parseFloat(cotacao) : undefined;

  if (isNaN(parsedValorInvestido) || isNaN(parsedBitcoin) || (cotacao && isNaN(parsedCotacao))) {
    console.warn('Valor inválido, ignorando:', row);
    return null;
  }

  return {
    data_aporte: parsedDate.toISOString().split('T')[0],
    valor_investido: parsedValorInvestido,
    bitcoin: parsedBitcoin,
    cotacao: parsedCotacao,
  };
};

const uploadEntries = async (
  userId: string,
  parsedRows: ParsedRow[],
  progressCallback: (progress: number, stage: string) => void
): Promise<ImportResult> => {
  let successCount = 0;
  const uploadedEntries = [];

  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i];

    if (!row) continue;

    const { data_aporte, valor_investido, bitcoin, cotacao } = row;

    try {
      const { error } = await supabase.from('aportes').insert([
        {
          user_id: userId,
          data_aporte,
          valor_investido,
          bitcoin,
          cotacao: cotacao || valor_investido / bitcoin,
          moeda: 'BRL',
          cotacao_moeda: 'BRL',
          origem_aporte: 'planilha',
        },
      ]);

      if (error) {
        console.error('Erro ao inserir linha no Supabase:', error);
      } else {
        successCount++;
        uploadedEntries.push(row);
      }
    } catch (dbError: any) {
      console.error('Erro ao inserir linha no Supabase:', dbError);
    }

    const progress = ((i + 1) / parsedRows.length) * 100;
    progressCallback(progress, `Enviando para o banco de dados... (${i + 1}/${parsedRows.length})`);
  }

  return {
    count: successCount,
    entries: uploadedEntries,
  };
};

export const importSpreadsheet = async (
  file: File,
  userId: string,
  progressCallback: (progress: number, stage: string) => void
): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (!rows || rows.length === 0) {
          reject(new Error('Planilha vazia ou inválida'));
          return;
        }

        const parsedRows: ParsedRow[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const parsedRow = parseRow(row);
          if (parsedRow) {
            parsedRows.push(parsedRow);
          }
          const progress = ((i + 1) / rows.length) * 20;
          progressCallback(progress, `Analisando dados... (${i + 1}/${rows.length})`);
        }

        progressCallback(20, 'Dados analisados, enviando para o banco de dados...');
        const uploadResult = await uploadEntries(userId, parsedRows, progressCallback);
        resolve(uploadResult);

      } catch (error: any) {
        if (typeof error === 'object' && error !== null && 'message' in error) {
          console.error('Erro durante importação:', error.message);
        }
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('Erro ao ler o arquivo:', error);
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};
