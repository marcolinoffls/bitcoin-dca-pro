
/**
 * Fornece as funções para interagir com os aportes de Bitcoin no Supabase
 * - Busca todos os aportes
 * - Cria novos aportes
 * - Atualiza aportes existentes
 * - Exclui aportes
 * 
 * Atualizações:
 * - Adicionado suporte à nova coluna origem_registro para rastrear aportes criados manualmente e por importação
 * - Corrigido problema de atualização da data não ser persistida corretamente
 * - Adicionados logs para monitorar as conversões de data
 * - Melhorada a manipulação dos valores para conversão correta entre string e number
 * - Adicionada verificação extra para garantir que a data seja formatada corretamente
 * - Melhorada a validação e conversão de datas para garantir persistência no Supabase
 * - Corrigido problema de timezone, forçando o horário local ao interpretar datas
 * - Atualizado para suportar novos tipos de origem (planilha) nos aportes
 * - Adicionado suporte a cotação opcional com cálculo automático
 * - Corrigida a tipagem para compatibilidade com o Supabase
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
      registrationSource: entry.origem_registro as 'manual' | 'planilha'
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
    console.log('Cotação calculada automaticamente para novo aporte:', finalRate);
  }
  
  // Formata a data para o formato ISO (YYYY-MM-DD)
  const formattedDate = date.toISOString().split('T')[0];
  console.log('Data sendo enviada para criação:', formattedDate);
  
  const newEntryId = uuidv4();
  
  // Criando objeto que corresponde ao tipo esperado pela tabela do Supabase
  const newEntry: AporteDB = {
    id: newEntryId,
    user_id: userId,
    data_aporte: formattedDate,
    moeda: currency,
    cotacao_moeda: currency,
    valor_investido: amountInvested,
    bitcoin: btcAmount,
    cotacao: finalRate,
    origem_aporte: origin,
    origem_registro: 'manual' // Registros criados via formulário são 'manual'
  };

  const { error } = await supabase
    .from('aportes')
    .insert(newEntry);

  if (error) {
    throw error;
  }

  return {
    id: newEntryId,
    date,
    amountInvested,
    btcAmount,
    exchangeRate: finalRate,
    currency,
    origin,
    registrationSource: 'manual'
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
  // Garantir que a data é um objeto Date válido
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Data inválida para atualização:', date);
    throw new Error('Data inválida fornecida para atualização');
  }
  
  // Se a cotação não foi fornecida, calcula automaticamente
  let finalRate = exchangeRate;
  if (finalRate === undefined || finalRate <= 0) {
    finalRate = calculateExchangeRate(amountInvested, btcAmount);
    console.log('Cotação calculada automaticamente para atualização:', finalRate);
  }
  
  // Formata a data para o formato ISO (YYYY-MM-DD)
  const formattedDate = date.toISOString().split('T')[0];
  console.log('Data sendo enviada para atualização:', formattedDate, 'Objeto Date original:', date);
  
  // Criando objeto que corresponde ao tipo esperado pela tabela do Supabase para update
  const updateData: Omit<AporteDB, 'id' | 'user_id' | 'origem_registro' | 'created_at'> = {
    data_aporte: formattedDate,
    moeda: currency,
    cotacao_moeda: currency,
    valor_investido: amountInvested,
    bitcoin: btcAmount,
    cotacao: finalRate,
    origem_aporte: origin
    // Não atualizamos origem_registro para preservar a origem do registro
  };
  
  console.log('Dados completos sendo enviados para atualização:', updateData);
  
  const { error, data } = await supabase
    .from('aportes')
    .update(updateData)
    .eq('id', entryId)
    .select();

  if (error) {
    console.error('Erro ao atualizar o aporte no Supabase:', error);
    throw error;
  } else {
    console.log('Aporte atualizado com sucesso no Supabase:', entryId);
    console.log('Resposta do Supabase após atualização:', data);
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
