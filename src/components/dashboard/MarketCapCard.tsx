
/**
 * Card de Market Cap do Bitcoin
 * Exibe a capitalização de mercado atual em USD e BRL
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { useBitcoinRate } from '@/hooks/useBitcoinRate';

const MarketCapCard = () => {
  // Valor mockado inicial - será substituído por dados da API
  const marketCap = {
    usd: 850000000000,
    brl: 4250000000000,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Cap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">USD</p>
            <p className="text-2xl font-bold">
              ${formatNumber(marketCap.usd)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">BRL</p>
            <p className="text-2xl font-bold">
              R${formatNumber(marketCap.brl)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { MarketCapCard };
