
/**
 * Campo para informar a cotação do Bitcoin no momento da compra.
 * Permite entrada de valores com vírgula ou ponto como separador decimal.
 * 
 * Atualização:
 * - Agora é opcional, com indicação visual
 * - Mostra indicador quando o valor foi calculado automaticamente
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Info } from 'lucide-react';

interface ExchangeRateFieldProps {
  currency: 'BRL' | 'USD';
  exchangeRate: number | string;
  onExchangeRateChange: (rate: string) => void;
  displayValue: string;
  isOptional?: boolean;
  isCalculated?: boolean;
}

const ExchangeRateField: React.FC<ExchangeRateFieldProps> = ({ 
  currency, 
  onExchangeRateChange, 
  displayValue,
  isOptional = false,
  isCalculated = false
}) => {
  // Aceita tanto vírgula quanto ponto como separador decimal e normaliza para o formato brasileiro
  const handleInputChange = (value: string) => {
    // Remove todos os caracteres que não sejam números, vírgula ou ponto
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Substitui pontos por vírgulas para o formato brasileiro
    const formattedValue = cleanedValue.replace(/\./g, ',');
    
    onExchangeRateChange(formattedValue);
  };

  return (
    <div className="flex flex-col space-y-3 mt-6">
      <div className="flex justify-between items-center">
        <Label htmlFor="exchangeRate" className="flex items-center gap-1">
          Cotação no momento da compra
          {isOptional && <span className="text-muted-foreground text-xs ml-1">(opcional)</span>}
        </Label>
      </div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          {currency === 'USD' ? '$' : 'R$'}
        </span>
        <Input
          id="exchangeRate"
          placeholder="0,00"
          value={displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className={`pl-8 rounded-xl focus-visible:ring-bitcoin focus-visible:border-bitcoin transition-all
            ${isCalculated ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}
          type="text"
          inputMode="decimal"
          required={!isOptional}
        />
        {isCalculated && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Info size={18} className="text-amber-600" />
          </div>
        )}
      </div>
      {isCalculated && (
        <p className="text-xs text-amber-600 mt-1">
          Cotação calculada automaticamente com base no valor investido e quantidade de bitcoin.
        </p>
      )}
    </div>
  );
};

export default ExchangeRateField;
