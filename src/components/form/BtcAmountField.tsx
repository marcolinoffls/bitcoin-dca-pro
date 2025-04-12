
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bitcoin } from 'lucide-react';

/**
 * Campo para entrada do valor em Bitcoin
 * 
 * Este componente aceita entradas no formato americano (com ponto decimal)
 * e converte automaticamente para o formato brasileiro (com vírgula)
 * para melhorar a experiência do usuário
 * 
 * @param btcAmount - valor atual do campo
 * @param onBtcAmountChange - função chamada quando o valor muda
 * @param displayUnit - unidade de exibição: BTC ou SATS (satoshis)
 */
interface BtcAmountFieldProps {
  btcAmount: string;
  onBtcAmountChange: (btcAmount: string) => void;
  displayUnit: 'BTC' | 'SATS';
}

const BtcAmountField: React.FC<BtcAmountFieldProps> = ({ btcAmount, onBtcAmountChange, displayUnit }) => {
  
  // Função para converter automaticamente pontos para vírgulas
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Substitui o ponto por vírgula para adequar ao formato brasileiro
    const formattedValue = e.target.value.replace('.', ',');
    onBtcAmountChange(formattedValue);
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
          onChange={handleAmountChange}
          className="pl-8 rounded-xl"
          type="text"
          required
        />
      </div>
    </div>
  );
};

export default BtcAmountField;
