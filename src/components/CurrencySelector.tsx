
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  selectedCurrency: 'BRL' | 'USD';
  onChange: (currency: 'BRL' | 'USD') => void;
  className?: string;
  buttonType?: "button" | "submit" | "reset"; // Add buttonType prop
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onChange,
  className,
  buttonType = "button", // Default to "button"
}) => {
  return (
    <div className={cn('flex space-x-1 rounded-md bg-muted p-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('USD')}
        className={cn(
          'flex-1 text-xs font-normal',
          selectedCurrency === 'USD' && 'bg-white shadow-sm dark:bg-btcblue'
        )}
        type={buttonType} // Add type attribute
      >
        USD ($)
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('BRL')}
        className={cn(
          'flex-1 text-xs font-normal',
          selectedCurrency === 'BRL' && 'bg-white shadow-sm dark:bg-btcblue'
        )}
        type={buttonType} // Add type attribute
      >
        BRL (R$)
      </Button>
    </div>
  );
};

export default CurrencySelector;
