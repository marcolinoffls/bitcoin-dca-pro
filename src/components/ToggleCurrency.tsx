
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DollarSign } from 'lucide-react';

interface ToggleCurrencyProps {
  selectedCurrency: 'BRL' | 'USD';
  onToggle: (value: 'BRL' | 'USD') => void;
  className?: string;
}

const ToggleCurrency = ({
  selectedCurrency,
  onToggle,
  className,
}: ToggleCurrencyProps) => {
  return (
    <div className={`inline-flex ${className}`}>
      <ToggleGroup
        type="single"
        value={selectedCurrency}
        onValueChange={(value: string) => {
          if (value === 'BRL' || value === 'USD') {
            onToggle(value);
          }
        }}
        className="rounded-full border border-border overflow-hidden p-0.5 shadow-sm bg-background"
      >
        <ToggleGroupItem
          value="BRL"
          aria-label="Mostrar em Reais"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 data-[state=on]:bg-bitcoin data-[state=on]:text-white data-[state=on]:shadow-sm ${
            selectedCurrency === 'BRL' ? 'data-[state=on]' : ''
          }`}
        >
          <span className="mr-1.5">R$</span>
          <span>BRL</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="USD"
          aria-label="Mostrar em Dólares"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 data-[state=on]:bg-bitcoin data-[state=on]:text-white data-[state=on]:shadow-sm ${
            selectedCurrency === 'USD' ? 'data-[state=on]' : ''
          }`}
        >
          <span className="mr-1.5">$</span>
          <span>USD</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ToggleCurrency;
