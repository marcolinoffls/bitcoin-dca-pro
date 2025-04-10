
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CurrencySelector from '@/components/CurrencySelector';
import { Bitcoin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface EntryFormProps {
  onAddEntry: (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD'
  ) => void;
  currentRate: { usd: number; brl: number };
}

const EntryForm: React.FC<EntryFormProps> = ({ onAddEntry, currentRate }) => {
  const [amountInvested, setAmountInvested] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [formMode, setFormMode] = useState<'amount' | 'rate'>('amount');

  // Função para converter string com vírgula para número
  const parseLocalNumber = (value: string): number => {
    return parseFloat(value.replace(',', '.'));
  };

  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    setCurrency(newCurrency);
    
    // Atualizar a taxa de câmbio com base na moeda selecionada
    if (formMode === 'rate' && currentRate) {
      setExchangeRate(
        formatNumber(newCurrency === 'USD' ? currentRate.usd : currentRate.brl)
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseLocalNumber(amountInvested);
    const parsedBtc = parseLocalNumber(btcAmount);
    const parsedRate = parseLocalNumber(exchangeRate);
    
    if (isNaN(parsedAmount) || isNaN(parsedBtc) || isNaN(parsedRate)) {
      return;
    }
    
    onAddEntry(parsedAmount, parsedBtc, parsedRate, currency);
    
    // Limpar o formulário
    setAmountInvested('');
    setBtcAmount('');
    setExchangeRate('');
  };

  const calculateFromAmount = () => {
    const amount = parseLocalNumber(amountInvested);
    const rate = parseLocalNumber(exchangeRate);
    
    if (!isNaN(amount) && !isNaN(rate) && rate > 0) {
      const btc = amount / rate;
      setBtcAmount(formatNumber(btc, 8));
    }
  };

  const calculateFromBtc = () => {
    const btc = parseLocalNumber(btcAmount);
    const rate = parseLocalNumber(exchangeRate);
    
    if (!isNaN(btc) && !isNaN(rate)) {
      const amount = btc * rate;
      setAmountInvested(formatNumber(amount));
    }
  };

  const useCurrentRate = () => {
    if (currentRate) {
      const rate = currency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(formatNumber(rate));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <Bitcoin className="h-6 w-6 text-bitcoin" />
          Registrar Novo Aporte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="currency">Moeda</Label>
            <CurrencySelector
              selectedCurrency={currency}
              onChange={handleCurrencyChange}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="amount">Valor Investido</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                  {currency === 'USD' ? '$' : 'R$'}
                </span>
                <Input
                  id="amount"
                  placeholder="0,00"
                  value={amountInvested}
                  onChange={(e) => setAmountInvested(e.target.value)}
                  className="pl-8"
                  type="text"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="btcAmount">Quantidade de Bitcoin</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                  <Bitcoin className="h-4 w-4" />
                </span>
                <Input
                  id="btcAmount"
                  placeholder="0,00000000"
                  value={btcAmount}
                  onChange={(e) => setBtcAmount(e.target.value)}
                  className="pl-8"
                  type="text"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="exchangeRate">Cotação no momento da compra</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={useCurrentRate} 
                className="h-6 text-xs"
              >
                Usar cotação atual
              </Button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                {currency === 'USD' ? '$' : 'R$'}
              </span>
              <Input
                id="exchangeRate"
                placeholder="0,00"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="pl-8"
                type="text"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={calculateFromAmount}
              className="col-span-1"
            >
              Calcular BTC a partir do valor
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={calculateFromBtc}
              className="col-span-1"
            >
              Calcular valor a partir do BTC
            </Button>
            <Button 
              type="submit" 
              className="col-span-1 bg-bitcoin hover:bg-bitcoin-dark"
            >
              Registrar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EntryForm;
