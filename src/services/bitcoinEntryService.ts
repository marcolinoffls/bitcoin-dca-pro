
/**
 * Fornece as funções para interagir com os aportes de Bitcoin no Supabase
 * 
 * Atualizações:
 * - Adicionado suporte ao cálculo e armazenamento do valor em USD usando cotação histórica
 * - Implementada lógica para obtenção de cotação histórica USD/BRL via múltiplas APIs
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
 * Formata uma data para o formato YYYYMMDD (para API AwesomeAPI)
 * @param date Data a ser formatada
 * @returns String no formato YYYYMMDD
 */
const formatDateForAwesomeAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Formata uma data para o formato YYYY-MM-DD (para API ExchangeRate.host)
 * @param date Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
const formatDateForExchangeRateAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Obtém a cotação histórica USD/BRL para uma data específica
 * Tenta múltiplas APIs com fallback
 * @param date Data para obter a cotação
 * @returns Cotação USD/BRL para a data especificada
 */
const getHistoricalUsdBrlRate = async (date: Date): Promise<number> => {
  try {
    // Primeiro tenta a AwesomeAPI
    const formattedDate = formatDateForAwesomeAPI(date);
    console.log(`Buscando cotação USD/BRL via AwesomeAPI para a data: ${formattedDate}`);
    
    const awesomeApiUrl = `https://economia.awesomeapi.com.br/json/daily/USD-BRL/1?start_date=${formattedDate}&end_date=${formattedDate}`;
    const awesomeApiResponse = await fetch(awesomeApiUrl);
    
    if (awesomeApiResponse.ok) {
      const awesomeApiData = await awesomeApiResponse.json();
      
      if (Array.isArray(awesomeApiData) && awesomeApiData.length > 0) {
        const rate = parseFloat(awesomeApiData[0].bid);
        if (!isNaN(rate) && rate > 0) {
          console.log(`Cotação USD/BRL obtida via AwesomeAPI: ${rate}`);
          return rate;
        }
      }
    }
    
    // Se falhar, tenta a ExchangeRate.host
    const exchangeRateDate = formatDateForExchangeRateAPI(date);
    console.log(`Buscando cotação USD/BRL via ExchangeRate.host para a data: ${exchangeRateDate}`);
    
    const exchangeRateUrl = `https://api.exchangerate.host/${exchangeRateDate}?base=USD&symbols=BRL`;
    const exchangeRateResponse = await fetch(exchangeRateUrl);
    
    if (exchangeRateResponse.ok) {
      const exchangeRateData = await exchangeRateResponse.json();
      
      if (exchangeRateData.rates && exchangeRateData.rates.BRL) {
        const rate = parseFloat(exchangeRateData.rates.BRL);
        if (!isNaN(rate) && rate > 0) {
          console.log(`Cotação USD/BRL obtida via ExchangeRate.host: ${rate}`);
          return rate;
        }
      }
    }
    
    // Se ambas as APIs falharem, usa o CoinGecko como último recurso
    console.log('Buscando cotação USD/BRL via CoinGecko como fallback');
    const coinGeckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl';
    const coinGeckoResponse = await fetch(coinGeckoUrl);
    
    if (coinGeckoResponse.ok) {
      const coinGeckoData = await coinGeckoResponse.json();
      
      if (coinGeckoData.bitcoin && coinGeckoData.bitcoin.usd && coinGeckoData.bitcoin.brl) {
        const rate = coinGeckoData.bitcoin.brl / coinGeckoData.bitcoin.usd;
        console.log(`Cotação USD/BRL obtida via CoinGecko: ${rate}`);
        return rate;
      }
    }
    
    // Se todas as tentativas falharem, loga o erro e retorna um valor padrão
    throw new Error("Não foi possível obter a cotação USD/BRL para a data especificada");
    
  } catch (error) {
    console.error('Erro ao obter cotação histórica USD/BRL:', error);
    // Retorna um valor padrão em caso de erro (5.0 é um fallback razoável para USD/BRL)
    return 5.0;
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
      // Obter cotação histórica USD/BRL para a data do aporte
      cotacaoUsdBrl = await getHistoricalUsdBrlRate(date);
      console.log(`Cotação USD/BRL para ${date.toISOString().split('T')[0]}: ${cotacaoUsdBrl}`);
      
      // Calcular valor em USD
      valorUsd = amountInvested / cotacaoUsdBrl;
      
      console.log('Valores calculados:', {
        cotacaoUsdBrl,
        valorUsd,
        cotacaoBtcUsd: valorUsd / btcAmount
      });
    } else {
      // Se já está em USD, mantém o mesmo valor
      valorUsd = amountInvested;
      // Para entradas em USD, buscar a cotação USD/BRL para registro
      cotacaoUsdBrl = await getHistoricalUsdBrlRate(date);
    }
  } catch (error) {
    console.error('Erro ao calcular valores em USD:', error);
    // Em caso de erro, usa valores nulos
    valorUsd = null;
    cotacaoUsdBrl = null;
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
      // Obter cotação histórica USD/BRL para a data do aporte
      cotacaoUsdBrl = await getHistoricalUsdBrlRate(date);
      console.log(`Cotação USD/BRL para ${date.toISOString().split('T')[0]}: ${cotacaoUsdBrl}`);
      
      // Calcular valor em USD
      valorUsd = amountInvested / cotacaoUsdBrl;
      
      console.log('Valores calculados para atualização:', {
        cotacaoUsdBrl,
        valorUsd,
        cotacaoBtcUsd: valorUsd / btcAmount
      });
    } else {
      // Se já está em USD, mantém o mesmo valor
      valorUsd = amountInvested;
      // Para entradas em USD, buscar a cotação USD/BRL para registro
      cotacaoUsdBrl = await getHistoricalUsdBrlRate(date);
    }
  } catch (error) {
    console.error('Erro ao calcular valores em USD para atualização:', error);
    // Em caso de erro, usa valores nulos
    valorUsd = null;
    cotacaoUsdBrl = null;
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
