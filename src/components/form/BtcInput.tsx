
/**
 * Componente BtcInput 
 * 
 * Função: Campo de entrada especializado para valores de Bitcoin/Satoshis
 * com teclado numérico otimizado para entrada decimal
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface BtcInputProps {
  displayUnit?: 'BTC' | 'SATS';
  value: string;
  onChange: (value: string) => void;
}

export const BtcInput: React.FC<BtcInputProps> = ({
  displayUnit = 'BTC',
  value,
  onChange
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\./g, ',');
    onChange(newValue);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="btcAmount">
        {displayUnit === 'BTC' ? 'Quantidade em Bitcoin' : 'Quantidade em Satoshis'}
      </Label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          {displayUnit === 'BTC' ? 'BTC' : 'SATS'}
        </span>
        <Input
          id="btcAmount"
          placeholder={displayUnit === 'BTC' ? '0,00000000' : '0'}
          value={value}
          onChange={handleInputChange}
          className="pl-12 rounded-xl"
          type="text"
          inputMode="decimal"  // Adicionado para teclado numérico
          pattern="[0-9]*,[0-9]*"  // Padrão para números decimais com vírgula
          required
        />
      </div>
    </div>
  );
};
