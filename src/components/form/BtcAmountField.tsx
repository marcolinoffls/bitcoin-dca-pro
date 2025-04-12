
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bitcoin } from 'lucide-react';

interface BtcAmountFieldProps {
  btcAmount: string;
  onBtcAmountChange: (btcAmount: string) => void;
  displayUnit: 'BTC' | 'SATS';
}

/**
 * Componente que renderiza o campo de entrada para quantidade de Bitcoin ou Satoshis
 * 
 * @param btcAmount - Valor atual do campo
 * @param onBtcAmountChange - Função chamada quando o valor muda
 * @param displayUnit - Unidade a ser exibida (BTC ou SATS)
 */
const BtcAmountField: React.FC<BtcAmountFieldProps> = ({ btcAmount, onBtcAmountChange, displayUnit }) => {
  // Função que converte pontos para vírgulas durante a digitação
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Converte automaticamente pontos para vírgulas
    const newValue = e.target.value.replace(/\./g, ',');
    onBtcAmountChange(newValue);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="btcAmount">{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</Label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
          <Bitcoin className="h-4 w-4" />
        </span>
        <Input
          id="btcAmount"
          placeholder={displayUnit === 'SATS' ? "0" : "0,00000000"}
          value={btcAmount}
          onChange={handleChange}
          className="pl-8 rounded-xl"
          type="text"
          required
        />
      </div>
    </div>
  );
};

export default BtcAmountField;
