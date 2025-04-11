
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ExchangeRateFieldProps {
  currency: 'BRL' | 'USD';
  exchangeRate: string;
  onExchangeRateChange: (rate: string) => void;
  onUseCurrentRate: () => void;
}

const ExchangeRateField: React.FC<ExchangeRateFieldProps> = ({ 
  currency, 
  exchangeRate, 
  onExchangeRateChange, 
  onUseCurrentRate 
}) => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex justify-between">
        <Label htmlFor="exchangeRate">Cotação no momento da compra</Label>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onUseCurrentRate} 
          className="h-6 text-xs"
        >
          Usar cotação atual
        </Button>
      </div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          {currency === 'USD' ? '$' : 'R$'}
        </span>
        <Input
          id="exchangeRate"
          placeholder="0,00"
          value={exchangeRate}
          onChange={(e) => onExchangeRateChange(e.target.value)}
          className="pl-8"
          type="text"
          required
        />
      </div>
    </div>
  );
};

export default ExchangeRateField;
