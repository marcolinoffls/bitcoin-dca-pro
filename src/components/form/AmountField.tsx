
/**
 * Campo para preencher o valor investido.
 * Exibe "R$" ou "$" à esquerda e permite valores numéricos com vírgula ou ponto como separador decimal.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface AmountFieldProps {
  currency: 'BRL' | 'USD';
  amount: string;
  onAmountChange: (amount: string) => void;
}

const AmountField: React.FC<AmountFieldProps> = ({ currency, amount, onAmountChange }) => {
  // Aceita tanto vírgula quanto ponto como separador decimal e normaliza para o formato brasileiro
  const handleInputChange = (value: string) => {
    // Remove todos os caracteres que não sejam números, vírgula ou ponto
    const cleanedValue = value.replace(/[^\d.,]/g, '');
    
    // Substitui pontos por vírgulas para o formato brasileiro
    const formattedValue = cleanedValue.replace(/\./g, ',');
    
    onAmountChange(formattedValue);
  };

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
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-9 rounded-xl"
          type="text"
          inputMode="decimal"
          required
        />
      </div>
    </div>
  );
};

export default AmountField;
