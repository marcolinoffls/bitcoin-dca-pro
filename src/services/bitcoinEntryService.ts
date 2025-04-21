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

/**
 * Busca cotação USD/BRL para uma data específica via exchangerate.host
 * @param date Data para buscar a cotação
 * @returns Taxa de câmbio ou null em caso de erro
 */
const fetchUsdBrlRate = async (date: Date): Promise<number | null> => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-');

    const response = await fetch(`https://open.er-api.com/v6/history/USD/${year}-${month}-${day}`);
    const data = await response.json();

    console.log('[fetchUsdBrlRate] Resposta da API open.er-api.com:', data);

    const rate = data?.rates?.BRL;
    if (rate) {
      console.log(`Cotação USD/BRL para ${dateStr}:`, rate);
      return rate;
    }

    console.error('[fetchUsdBrlRate] Cotação BRL não encontrada na resposta:', data);
    return null;
  } catch (error) {
    console.error('[fetchUsdBrlRate] Erro ao buscar cotação USD/BRL:', error);
    return null;
  }
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
 * Creates a new bitcoin entry in the database
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
  // Validar se a data é válida
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Data inválida para criação:', date);
    throw new Error('Data inválida fornecida para criação');
  }
  
  // Se a cotação não foi fornecida, calcula automaticamente
  let finalRate = exchangeRate;
  if (finalRate === undefined || finalRate <= 0) {
    finalRate = calculateExchangeRate(amountInvested, btcAmount);
    console.log('Cotação calculada automaticamente:', finalRate);
  }
  
  // Calcular valor em USD se a moeda for BRL
  let valorUsd = null;
  let cotacaoUsdBrl = null;
  
  try {
    if (currency === 'BRL') {
      // Buscar cotação USD/BRL histórica
      cotacaoUsdBrl = await fetchUsdBrlRate(date);
      
      if (cotacaoUsdBrl) {
        // Calcular valor em USD
        valorUsd = amountInvested / cotacaoUsdBrl;
        
        console.log('Valores calculados:', {
          cotacaoUsdBrl,
          valorUsd,
          btcUsdRate: valorUsd / btcAmount
        });
      } else {
        // Fallback: Buscar cotações atuais
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl');
        const data = await response.json();
        
        if (data.bitcoin && data.bitcoin.usd && data.bitcoin.brl) {
          cotacaoUsdBrl = data.bitcoin.brl / data.bitcoin.usd;
          valorUsd = amountInvested / cotacaoUsdBrl;
        }
      }
    } else {
      // Se já está em USD, mantém o mesmo valor
      valorUsd = amountInvested;
      cotacaoUsdBrl = 1;
    }
  } catch (error) {
    console.error('Erro ao buscar/calcular valores em USD:', error);
  }

  const newEntryId = uuidv4();
  
  const newEntry: AporteDB = {
    id: newEntryId,
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

  const { error } = await supabase
    .from('aportes')
    .insert(newEntry);

  if (error) throw error;

  return {
    id: newEntryId,
    date,
    amountInvested,
    btcAmount,
    exchangeRate: finalRate,
    currency,
    origin,
    registrationSource: 'manual' as const,
    valorUsd,
    cotacaoUsdBrl
  };
};

/**
 * Updates an existing bitcoin entry in the database
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
  // Garantir que a data é válida
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Data inválida para atualização:', date);
    throw new Error('Data inválida fornecida');
  }
  
  // Se a cotação não foi fornecida, calcula automaticamente
  let finalRate = exchangeRate;
  if (finalRate === undefined || finalRate <= 0) {
    finalRate = calculateExchangeRate(amountInvested, btcAmount);
    console.log('Cotação calculada automaticamente para atualização:', finalRate);
  }
  
  // Calcular valor em USD se a moeda for BRL
  let valorUsd = null;
  let cotacaoUsdBrl = null;
  
  try {
    if (currency === 'BRL') {
      // Buscar cotação USD/BRL histórica
      cotacaoUsdBrl = await fetchUsdBrlRate(date);
      
      if (cotacaoUsdBrl) {
        // Calcular valor em USD
        valorUsd = amountInvested / cotacaoUsdBrl;
        
        console.log('Valores calculados para atualização:', {
          cotacaoUsdBrl,
          valorUsd,
          btcUsdRate: valorUsd / btcAmount
        });
      } else {
        // Fallback: Buscar cotações atuais
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl');
        const data = await response.json();
        
        if (data.bitcoin && data.bitcoin.usd && data.bitcoin.brl) {
          cotacaoUsdBrl = data.bitcoin.brl / data.bitcoin.usd;
          valorUsd = amountInvested / cotacaoUsdBrl;
        }
      }
    } else {
      // Se já está em USD, mantém o mesmo valor
      valorUsd = amountInvested;
      cotacaoUsdBrl = 1;
    }
  } catch (error) {
    console.error('Erro ao buscar/calcular valores em USD para atualização:', error);
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

  if (error) {
    console.error('Erro ao atualizar o aporte no Supabase:', error);
    throw error;
  }
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
