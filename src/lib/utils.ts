
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um número com vírgula como separador decimal e ponto como separador de milhar
 * @param value O número a ser formatado (se for undefined, retorna '0')
 * @param decimals O número de casas decimais
 * @returns String formatada com vírgula como separador decimal e ponto como separador de milhar
 */
export function formatNumber(value: number | undefined, decimals: number = 2): string {
  // Verifica se o valor é undefined ou null
  if (value === undefined || value === null) {
    return '0,00';
  }
  
  // Formata com separador de milhar e casas decimais específicas
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
