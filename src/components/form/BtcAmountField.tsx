
/**
 * Componente para entrada do valor em Bitcoin ou Satoshis
 * 
 * Função: Permite que o usuário digite o valor de BTC adquirido
 * com teclado numérico otimizado para entrada decimal
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface BtcAmountFieldProps {
  btcAmount: string;
  onBtcAmountChange: (value: string) => void;
  displayUnit?: 'BTC' | 'SATS';
}

const BtcAmountField: React.FC<BtcAmountFieldProps> = ({
  btcAmount,
  onBtcAmountChange,
  displayUnit = 'BTC'
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\./g, ',');
    onBtcAmountChange(value);
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
          value={btcAmount}
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

export default BtcAmountField;
