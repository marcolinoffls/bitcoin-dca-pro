
/**
 * Serviço para transformação de dados importados
 * 
 * Responsável por converter os dados recebidos do N8N
 * para o formato usado pela aplicação
 */

import { BitcoinEntry, Origin } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface WebhookResponseItem {
  id?: string;
  date: string;
  amountInvested: string | number;
  btcAmount: string | number;
  exchangeRate: string | number;
  currency?: 'BRL' | 'USD';
  origin?: Origin;
}

/**
 * Converte dados do webhook para o formato BitcoinEntry
 */
export const transformWebhookData = (
  webhookData: WebhookResponseItem[]
): BitcoinEntry[] => {
  return webhookData.map((item): BitcoinEntry => ({
    id: item.id || uuidv4(),
    date: new Date(item.date),
    amountInvested: Number(item.amountInvested),
    btcAmount: Number(item.btcAmount),
    exchangeRate: Number(item.exchangeRate),
    currency: item.currency || 'BRL',
    origin: item.origin || 'planilha',
    registrationSource: 'planilha'
  }));
};

