/**
 * Fornece as funções para interagir com os aportes de Bitcoin no Supabase
 * 
 * Atualizações:
 * - Adicionado suporte ao cálculo e armazenamento do valor em USD
 * - Implementada lógica para registro da cotação USD/BRL
 * - Removido tipo "exchange" das origens permitidas
 */

import { BitcoinEntry, CurrentRate, Origin, AporteDB } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converte string de data para objeto Date, forçando o fuso horário local
 * @param dateString String de data no formato 'YYYY-MM-DD'
 * @returns Objeto Date com o fuso horário local
 */
const parseLocalDate = (dateString: string): Date => {
  // Adiciona o horário T00:00:00 para forçar a interpretação no fuso horário local
  const localDate = new Date(`${dateString}T00:00:00`);
  console.log(`Convertendo data string ${dateString} para objeto Date: ${localDate}`);
  return localDate;
};

/**
 * Calcula a cotação automaticamente baseada no valor investido e quantidade de BTC
 * @param amountInvested Valor investido
 * @param btcAmount Quantidade de BTC
 * @returns Cotação calculada
 */
const calculateExchangeRate = (amountInvested: number, btcAmount: number): number => {
  if (amountInvested <= 0 || btcAmount <= 0) {
    throw new Error("Valores inválidos para cálculo da cotação");
  }
  return amountInvested / btcAmount;
};

// Cache local para evitar requisições repetidas
const cotacaoCache: Record<string, number> = {};

/**
 * Busca a cotação USD/BRL para uma data específica via AwesomeAPI.
 * Estratégia:
 * 1. Busca cotação no dia
 * 2. Se não houver, tenta média entre dia anterior e posterior
 * 3. Se apenas uma estiver disponível, usa ela
 * 4. Se ambas falharem, tenta novamente o dia posterior como último recurso
 */
export const fetchUsdBrlRate = async (date: Date): Promise<number | null> => {
  const toApiDate = (d: Date) => {
    const [year, month, day] = d.toISOString().split('T')[0].split('-');
    return `${year}${month}${day}`; // YYYYMMDD
  };

  const baseDateStr = toApiDate(date);
  if (cotacaoCache[baseDateStr]) return cotacaoCache[baseDateStr];

  const fetchRate = async (d: string): Promise<number | null> => {
    try {
      const url = `https://economia.awesomeapi.com.br/json/daily/USD-BRL/?start_date=${d}&end_date=${d}&limit=1`;
      const res = await fetch(url);
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0 && json[0].bid) {
        return parseFloat(json[0].bid);
      }
    } catch {
      // falha silenciosa
    }
    return null;
  };

  // 1. Tenta data exata
  const exactRate = await fetchRate(baseDateStr);
  if (exactRate) {
    cotacaoCache[baseDateStr] = exactRate;
    return exactRate;
  }

  // 2. Tenta anterior e posterior
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const [prevRate, nextRate] = await Promise.all([
    fetchRate(toApiDate(prevDate)),
    fetchRate(toApiDate(nextDate))
  ]);

  if (prevRate && nextRate) {
    const average = (prevRate + nextRate) / 2;
    cotacaoCache[baseDateStr] = average;
    return average;
  }

  if (prevRate) {
    cotacaoCache[baseDateStr] = prevRate;
    return prevRate;
  }

  if (nextRate) {
    cotacaoCache[baseDateStr] = nextRate;
    return nextRate;
  }

  // 3. Tenta o próximo dia novamente
  const fallbackDate = new Date(nextDate);
  fallbackDate.setDate(fallbackDate.getDate() + 1);
  const fallbackRate = await fetchRate(toApiDate(fallbackDate));
  if (fallbackRate) {
    cotacaoCache[baseDateStr] = fallbackRate;
    return fallbackRate;
  }

  return null;
};


/**
 * Fetches all bitcoin entries from the database
 */
export const fetchBitcoinEntries = async () => {
  const { data, error } = await supabase
    .from('aportes')
    .select('*')
    .order('data_aporte', { ascending: false });

  if (error) {
    throw error;
  }

  // Convert Supabase data to app's BitcoinEntry format
  const formattedEntries: BitcoinEntry[] = data?.map(entry => {
    // Garantir que a data seja um objeto Date válido com fuso horário local
    const entryDate = parseLocalDate(entry.data_aporte);
    console.log(`Convertendo data do aporte ${entry.id}: ${entry.data_aporte} para objeto Date: ${entryDate}`);
    
    return {
      id: entry.id,
      date: entryDate,
      amountInvested: Number(entry.valor_investido),
      btcAmount: Number(entry.bitcoin),
      exchangeRate: Number(entry.cotacao),
      currency: entry.moeda as 'BRL' | 'USD',
      origin: entry.origem_aporte as Origin,
      registrationSource: entry.origem_registro as 'manual' | 'planilha',
      valorUsd: entry.valor_usd || undefined,
      cotacaoUsdBrl: entry.cotacao_usd_brl || undefined,
    };
  }) || [];
  
  return formattedEntries;
};

/**
 * Cria um novo aporte manual de Bitcoin com cálculo automático do valor em USD
 * e da cotação USD/BRL com base na data do aporte.
 */
export const createBitcoinEntry = async (
  userId: string,
  amountInvested: number,
  btcAmount: number,
  exchangeRate: number | undefined,
  currency: 'BRL' | 'USD',
  date: Date,
  origin: Origin
) => {
  // Valida a data recebida
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida para criação');
  }

  // Calcula a cotação se não foi informada
  const finalRate = exchangeRate && exchangeRate > 0
    ? exchangeRate
    : calculateExchangeRate(amountInvested, btcAmount);

  let valorUsd = null;
  let cotacaoUsdBrl = null;

  // Para aportes em BRL, buscar a cotação histórica USD/BRL
  if (currency === 'BRL') {
    cotacaoUsdBrl = await fetchUsdBrlRate(date);
    if (cotacaoUsdBrl) valorUsd = amountInvested / cotacaoUsdBrl;
  } else {
    // Se aporte já for em USD
    valorUsd = amountInvested;
    cotacaoUsdBrl = 1;
  }

  const newEntry: AporteDB = {
    id: uuidv4(),
    user_id: userId,
    data_aporte: date.toISOString().split('T')[0],
    valor_investido: amountInvested,
    bitcoin: btcAmount,
    cotacao: finalRate,
    moeda: currency,
    cotacao_moeda: currency,
    origem_aporte: origin,
    origem_registro: 'manual',
    valor_usd: valorUsd,
    cotacao_usd_brl: cotacaoUsdBrl
  };

  // Envia para o Supabase
  const { error } = await supabase.from('aportes').insert(newEntry);
  if (error) throw error;

  return {
    ...newEntry,
    date,
    exchangeRate: finalRate,
    registrationSource: 'manual' as const
  };
};

/**
 * Atualiza um aporte de Bitcoin existente no Supabase
 * com cálculo opcional da cotação e campos USD.
 */
export const updateBitcoinEntry = async (
  entryId: string,
  amountInvested: number,
  btcAmount: number,
  exchangeRate: number | undefined,
  currency: 'BRL' | 'USD',
  date: Date,
  origin: Origin
) => {
  // Valida a data
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Data inválida fornecida');
  }

  // Calcula cotação se não fornecida
  const finalRate = exchangeRate && exchangeRate > 0
    ? exchangeRate
    : calculateExchangeRate(amountInvested, btcAmount);

  let valorUsd = null;
  let cotacaoUsdBrl = null;

  if (currency === 'BRL') {
    cotacaoUsdBrl = await fetchUsdBrlRate(date);
    if (cotacaoUsdBrl) valorUsd = amountInvested / cotacaoUsdBrl;
  } else {
    valorUsd = amountInvested;
    cotacaoUsdBrl = 1;
  }

  const updateData = {
    data_aporte: date.toISOString().split('T')[0],
    valor_investido: amountInvested,
    bitcoin: btcAmount,
    cotacao: finalRate,
    moeda: currency,
    cotacao_moeda: currency,
    origem_aporte: origin,
    valor_usd: valorUsd,
    cotacao_usd_brl: cotacaoUsdBrl
  };

  const { error } = await supabase
    .from('aportes')
    .update(updateData)
    .eq('id', entryId);

  if (error) throw error;
};

/**
 * Deletes a bitcoin entry from the database
 */
export const deleteBitcoinEntry = async (entryId: string) => {
  const { error } = await supabase
    .from('aportes')
    .delete()
    .eq('id', entryId);

  if (error) {
    throw error;
  }
};

/**
 * Deletes all entries with registration source 'planilha'
 */
export const deleteAllSpreadsheetEntries = async () => {
  const { error } = await supabase
    .from('aportes')
    .delete()
    .eq('origem_registro', 'planilha');

  if (error) {
    throw error;
  }
};

/**
 * Atualiza os campos valor_usd e cotacao_usd_brl para entradas retroativas com valores nulos
 */
export const atualizarEntradasRetroativas = async () => {
  const { data: entries, error } = await supabase
    .from('aportes')
    .select('id, data_aporte, valor_investido, bitcoin, valor_usd, cotacao_usd_brl, moeda')
    .or('valor_usd.is.null,cotacao_usd_brl.is.null') // Corrigido aqui
    .eq('moeda', 'BRL');

  if (error) {
    console.error('Erro ao buscar aportes retroativos:', error);
    return;
  }

  for (const entry of entries) {
    try {
      const date = new Date(`${entry.data_aporte}T00:00:00`);
      const cotacaoUsdBrl = await fetchUsdBrlRate(date);
      if (!cotacaoUsdBrl || entry.bitcoin <= 0) continue;

      const valorUsd = entry.valor_investido / cotacaoUsdBrl;

      const { error: updateError } = await supabase
        .from('aportes')
        .update({
          valor_usd: valorUsd,
          cotacao_usd_brl: cotacaoUsdBrl,
        })
        .eq('id', entry.id);

      if (updateError) {
        console.error(`Erro ao atualizar aporte ${entry.id}:`, updateError);
      } else {
        console.log(`Aporte ${entry.id} atualizado com valor_usd: ${valorUsd} e cotacao_usd_brl: ${cotacaoUsdBrl}`);
      }
    } catch (err) {
      console.error(`Erro ao processar aporte ${entry.id}:`, err);
    }
  }
};
