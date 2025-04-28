import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateTotalBitcoin } from '@/services/bitcoin';
import { useIsMobile } from '@/hooks/use-mobile';

interface BitcoinTotalCardProps {
  entries: any[];
  isLoading: boolean;
}

const BitcoinTotalCard: React.FC<BitcoinTotalCardProps> = ({ entries, isLoading }) => {
  const totalBitcoin = calculateTotalBitcoin(entries);
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Total Bitcoin</CardTitle>
      </CardHeader>
      <CardContent className="aspect-square grid place-items-center">
        {isLoading ? (
          <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
        ) : (
          <div className="text-3xl font-bold">
            {totalBitcoin.toFixed(8)}
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              BTC
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BitcoinTotalCard;
