
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Bitcoin, CoinIcon } from 'lucide-react';

interface ToggleDisplayUnitProps {
  displayUnit: 'BTC' | 'SATS';
  onToggle: (value: 'BTC' | 'SATS') => void;
  className?: string;
}

const ToggleDisplayUnit = ({
  displayUnit,
  onToggle,
  className,
}: ToggleDisplayUnitProps) => {
  return (
    <div className={`inline-flex ${className}`}>
      <ToggleGroup
        type="single"
        value={displayUnit}
        onValueChange={(value: string) => {
          if (value === 'BTC' || value === 'SATS') {
            onToggle(value);
          }
        }}
        className="rounded-full border border-border overflow-hidden p-0.5 shadow-sm bg-background"
      >
        <ToggleGroupItem
          value="BTC"
          aria-label="Mostrar em Bitcoin"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 data-[state=on]:bg-bitcoin data-[state=on]:text-white data-[state=on]:shadow-sm ${
            displayUnit === 'BTC' ? 'data-[state=on]' : ''
          }`}
        >
          <Bitcoin className="h-4 w-4 mr-1.5" />
          <span>BTC</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="SATS"
          aria-label="Mostrar em Satoshis"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 data-[state=on]:bg-bitcoin data-[state=on]:text-white data-[state=on]:shadow-sm ${
            displayUnit === 'SATS' ? 'data-[state=on]' : ''
          }`}
        >
          <CoinIcon className="h-4 w-4 mr-1.5" />
          <span>SATS</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ToggleDisplayUnit;
