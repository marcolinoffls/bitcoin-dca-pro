
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AmountFieldProps {
  currency: 'BRL' | 'USD';
  amount: string;
  onAmountChange: (amount: string) => void;
}

const AmountField: React.FC<AmountFieldProps> = ({ currency, amount, onAmountChange }) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="amount">Valor Investido</Label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          {currency === 'USD' ? '$' : 'R$'}
        </span>
        <Input
          id="amount"
          placeholder="0,00"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="pl-8"
          type="text"
          required
        />
      </div>
    </div>
  );
};

export default AmountField;
