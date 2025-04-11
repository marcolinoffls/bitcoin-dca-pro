
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Bitcoin } from 'lucide-react';

interface BtcAmountFieldProps {
  btcAmount: string;
  onBtcAmountChange: (btcAmount: string) => void;
  displayUnit: 'BTC' | 'SATS';
}

const BtcAmountField: React.FC<BtcAmountFieldProps> = ({ btcAmount, onBtcAmountChange, displayUnit }) => {
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
          onChange={(e) => onBtcAmountChange(e.target.value)}
          className="pl-8"
          type="text"
          required
        />
      </div>
    </div>
  );
};

export default BtcAmountField;
