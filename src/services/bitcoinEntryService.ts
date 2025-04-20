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
import { fetchUsdBrlRate } from '@/services/bitcoinService';

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
    // Buscar cotações atuais
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl');
    const data = await response.json();
    
    if (data.bitcoin && data.bitcoin.usd && data.bitcoin.brl) {
      if (currency === 'BRL') {
        // Calcular e salvar cotação USD/BRL
        cotacaoUsdBrl = data.bitcoin.brl / data.bitcoin.usd;
        // Calcular valor em USD
        valorUsd = amountInvested / cotacaoUsdBrl;
        
        console.log('Valores calculados:', {
          cotacaoUsdBrl,
          valorUsd,
          btcUsdRate: valorUsd / btcAmount
        });
      } else {
        // Se já está em USD, mantém o mesmo valor
        valorUsd = amountInvested;
        cotacaoUsdBrl = 1;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar cotação USD/BRL:', error);
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
    .insert([newEntry]);

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
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl');
    const data = await response.json();
    
    if (data.bitcoin && data.bitcoin.usd && data.bitcoin.brl) {
      if (currency === 'BRL') {
        cotacaoUsdBrl = data.bitcoin.brl / data.bitcoin.usd;
        valorUsd = amountInvested / cotacaoUsdBrl;
        
        console.log('Valores calculados para atualização:', {
          cotacaoUsdBrl,
          valorUsd,
          btcUsdRate: valorUsd / btcAmount
        });
      } else {
        valorUsd = amountInvested;
        cotacaoUsdBrl = 1;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar cotação USD/BRL para atualização:', error);
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
