
/**
 * Campo para informar a cotação do Bitcoin no momento da compra.
 * Removido o botão para preencher com a cotação atual automaticamente.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ExchangeRateFieldProps {
  currency: 'BRL' | 'USD';
  exchangeRate: number | string;
  onExchangeRateChange: (rate: string) => void;
  displayValue: string;
}

const ExchangeRateField: React.FC<ExchangeRateFieldProps> = ({ 
  currency, 
  onExchangeRateChange, 
  displayValue 
}) => {
  return (
    <div className="flex flex-col space-y-3 mt-6">
      <div className="flex justify-between items-center">
        <Label htmlFor="exchangeRate">Cotação no momento da compra</Label>
      </div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          {currency === 'USD' ? '$' : 'R$'}
        </span>
        <Input
          id="exchangeRate"
          placeholder="0,00"
          value={displayValue}
          onChange={(e) => onExchangeRateChange(e.target.value)}
          className="pl-8 rounded-xl focus-visible:ring-bitcoin focus-visible:border-bitcoin transition-all"
          type="text"
          inputMode="decimal"
          required
        />
      </div>
    </div>
  );
};

export default ExchangeRateField;
