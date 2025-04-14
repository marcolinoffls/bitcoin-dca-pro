
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BitcoinEntry, CurrentRate } from '@/types';
import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { calculateTotalBitcoin } from '@/services/bitcoinService';
import { Badge } from '@/components/ui/badge';
import { useBalanceVisibility } from '@/hooks/useBalanceVisibility';

interface BitcoinTotalCardProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
}

const BitcoinTotalCard: React.FC<BitcoinTotalCardProps> = ({
  entries,
  currentRate,
  selectedCurrency,
  displayUnit,
}) => {
  const { isVisible, toggleVisibility } = useBalanceVisibility();
  
  const totalBitcoin = calculateTotalBitcoin(entries);
  const formattedTotalBitcoin = displayUnit === 'SATS' 
    ? formatNumber(totalBitcoin * 100000000, 0)
    : formatNumber(totalBitcoin, 8);
  
  const currentRateValue = selectedCurrency === 'USD' ? currentRate?.usd || 0 : currentRate?.brl || 0;
  const currencySymbol = selectedCurrency === 'USD' ? '$' : 'R$';
  const totalValueCurrent = totalBitcoin * currentRateValue;
  
  const totalInvested = entries.reduce((total, entry) => {
    const entryValue = entry.amountInvested;
    if (entry.currency !== selectedCurrency && currentRate) {
      const conversionRate = currentRate.usd / currentRate.brl;
      return total + (entry.currency === 'USD' 
        ? entryValue * (1 / conversionRate) 
        : entryValue * conversionRate);
    }
    return total + entryValue;
  }, 0);
  
  const percentChange = totalInvested > 0 
    ? ((totalValueCurrent - totalInvested) / totalInvested) * 100 
    : 0;
  
  const isPositiveChange = percentChange >= 0;

  return (
    <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 h-[200px]">
      <CardContent className="p-5 h-full relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0">
              <img 
                src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYml0Y29pbi5wbmciLCJpYXQiOjE3NDQ0OTI3ODgsImV4cCI6MTc3NjAyODc4OH0.lrqzizN8_y_ZR8PExIB_XH6xBoqeG0OvxlwMbv0TtF0" 
                alt="Bitcoin"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">
                {displayUnit === 'SATS' ? 'SATS' : 'BTC'}
              </h3>
              <p className="text-sm text-gray-500">Bitcoin</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <Badge 
                className={`${
                  isPositiveChange 
                    ? 'bg-green-100 text-green-600 hover:bg-green-100' 
                    : 'bg-red-100 text-red-600 hover:bg-red-100'
                } flex items-center gap-0.5 px-2 py-1 border-0`}
              >
                {isPositiveChange 
                  ? <ArrowUp className="h-3 w-3" /> 
                  : <ArrowDown className="h-3 w-3" />}
                {Math.abs(percentChange).toFixed(1)}%
              </Badge>
            )}
            
            <button 
              onClick={toggleVisibility}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              title={isVisible ? "Ocultar saldo" : "Mostrar saldo"}
              aria-label={isVisible ? "Ocultar saldo" : "Mostrar saldo"}
            >
              {isVisible ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        <div className="h-px w-full bg-gray-100 my-3"></div>
        
        <div className="flex justify-between items-end mt-4 h-full">
          <div className="relative w-full">
            <div className="absolute top-0 left-0 w-full">
              <p className="text-xs text-gray-400 mb-1">Portfólio</p>
              <div className="h-[40px] relative">
                <p className={`absolute top-0 left-0 text-2xl font-bold transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                  {currencySymbol} {formatNumber(totalValueCurrent)}
                </p>
                <p className={`absolute top-0 left-0 text-2xl font-bold transition-all duration-300 ${isVisible ? 'opacity-0' : 'opacity-100'}`}>
                  ●●●●
                </p>
              </div>
              <div className="h-[20px] relative mt-1">
                <p className={`absolute top-0 left-0 text-xs text-gray-400 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                  Total investido: {currencySymbol} {formatNumber(totalInvested)}
                </p>
                <p className={`absolute top-0 left-0 text-xs text-gray-400 transition-all duration-300 ${isVisible ? 'opacity-0' : 'opacity-100'}`}>
                  Total investido: ●●●●
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right h-[40px] relative">
            <p className={`absolute top-0 right-0 font-semibold transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              {formattedTotalBitcoin} {displayUnit}
            </p>
            <p className={`absolute top-0 right-0 font-semibold transition-all duration-300 ${isVisible ? 'opacity-0' : 'opacity-100'}`}>
              ●●●●
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BitcoinTotalCard;

