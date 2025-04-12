
/**
 * Componente para entrada do valor em Bitcoin ou Satoshis
 * 
 * Função: Permite que o usuário digite o valor de BTC adquirido
 * e converte automaticamente pontos (.) para vírgulas (,)
 * para compatibilidade com o formato brasileiro
 * 
 * Atualização:
 * - Melhorada a manipulação dos valores para conversão correta entre string e number
 * - Adicionado console.log para depuração do formato de número
 * - Melhorada a consistência da formatação
 * - Garantido o envio correto dos valores numéricos
 * - Corrigido o tratamento de pontos e vírgulas para consistência com outros campos
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
  // Função que converte pontos para vírgulas ao digitar
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Substitui pontos por vírgulas para compatibilidade com formato brasileiro
    const value = e.target.value.replace(/\./g, ',');
    console.log('Valor BTC formatado:', value);
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
          required
        />
      </div>
    </div>
  );
};

export default BtcAmountField;
