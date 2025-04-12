
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um número com vírgula como separador decimal e ponto como separador de milhar
 * @param value O número a ser formatado
 * @param decimals O número de casas decimais
 * @returns String formatada com vírgula como separador decimal e ponto como separador de milhar
 */
export function formatNumber(value: number, decimals: number = 2): string {
  // Formata com separador de milhar e casas decimais específicas
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formata um valor numérico como moeda
 * @param value Valor a ser formatado
 * @param currency Moeda (BRL ou USD)
 * @returns String formatada como valor monetário
 */
export function formatCurrency(value: number, currency: 'BRL' | 'USD'): string {
  const formatter = new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(value);
}
