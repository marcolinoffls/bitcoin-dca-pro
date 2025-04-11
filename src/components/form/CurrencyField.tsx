
import React from 'react';
import { Label } from '@/components/ui/label';
import CurrencySelector from '@/components/CurrencySelector';

interface CurrencyFieldProps {
  currency: 'BRL' | 'USD';
  onCurrencyChange: (currency: 'BRL' | 'USD') => void;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({ currency, onCurrencyChange }) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="currency">Moeda</Label>
      <CurrencySelector
        selectedCurrency={currency}
        onChange={onCurrencyChange}
        buttonType="button"
      />
    </div>
  );
};

export default CurrencyField;
