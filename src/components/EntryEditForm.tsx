/**
 * Componente EntryEditForm
 *
 * Função: Permite que o usuário edite um aporte de Bitcoin já registrado.
 * Onde é usado: Na seção de "Aportes Registrados", quando o usuário clica em "Editar".
 *
 * Integrações:
 * - Supabase: atualiza um registro existente na tabela `aportes`.
 * - Props:
 *    - entry: os dados atuais do aporte
 *    - currentRate: cotação atual do Bitcoin
 *    - onClose: fecha o modal de edição
 *    - displayUnit: unidade usada (BTC ou SATS)
 */

import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatNumber } from '@/lib/utils';
import CurrencySelector from '@/components/CurrencySelector';
import OriginSelector from '@/components/form/OriginSelector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Bitcoin, CalendarCheck, CalendarIcon, Check } from 'lucide-react';
import { AmountInput } from '@/components/form/AmountInput';
import { BtcInput } from '@/components/form/BtcInput';

interface EntryEditFormProps {
  entry: BitcoinEntry;
  currentRate: CurrentRate;
  onClose: () => void;
  displayUnit?: 'BTC' | 'SATS';
}

const EntryEditForm: React.FC<EntryEditFormProps> = ({
  entry,
  currentRate,
  onClose,
  displayUnit = 'BTC',
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Preenche os campos com os dados do aporte original
  const [amountInvested, setAmountInvested] = useState(formatNumber(entry.amountInvested));
  const [btcAmount, setBtcAmount] = useState(
    displayUnit === 'SATS'
      ? formatNumber(entry.btcAmount * 100000000, 0) // Converte BTC para SATS se necessário
      : formatNumber(entry.btcAmount, 8)
  );
  const [exchangeRate, setExchangeRate] = useState(entry.exchangeRate);
  const [exchangeRateDisplay, setExchangeRateDisplay] = useState(formatNumber(entry.exchangeRate));
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(entry.currency);
  const [origin, setOrigin] = useState<'corretora' | 'p2p'>(entry.origem_aporte || 'corretora');
  const [date, setDate] = useState<Date>(entry.date);
  const [tempDate, setTempDate] = useState<Date>(entry.date);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);

  /**
   * Converte valores inseridos com separador de milhar (ex: "1.000,50") para número float
   */
  const parseLocalNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  /**
   * Formata valor numérico para exibição como moeda (BRL ou USD)
   */
  const formatCurrency = (value: number, currencyType: 'BRL' | 'USD'): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: currencyType,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /**
   * Atualiza a moeda selecionada (BRL ou USD)
   * Também altera a cotação exibida com base na taxa atual recebida via props
   */
  const handleCurrencyChange = (newCurrency: 'BRL' | 'USD') => {
    setCurrency(newCurrency);
    if (currentRate) {
      const newRate = newCurrency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(newRate);
      setExchangeRateDisplay(formatCurrency(newRate, newCurrency));
    }
  };

  /**
   * Preenche automaticamente o campo de cotação com a taxa atual
   */
  const useCurrentRate = () => {
    if (currentRate) {
      const rate = currency === 'USD' ? currentRate.usd : currentRate.brl;
      setExchangeRate(rate);
      setExchangeRateDisplay(formatCurrency(rate, currency));
    }
  };

  /**
   * Confirma a data temporária selecionada no calendário
   */
  const confirmDateSelection = () => {
    setDate(tempDate);
    setIsCalendarOpen(false);
  };

  /**
   * Preenche com a data de hoje
   */
  const setToday = () => {
    const today = new Date();
    setDate(today);
    setTempDate(today);
    setIsCalendarOpen(false);
  };

  /**
   * Valida os dados preenchidos e envia para o Supabase
   * Atualiza o aporte na tabela `aportes`
   * Campos afetados: data_aporte, moeda, cotacao, valor_investido, bitcoin, origem_aporte
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para editar aportes.',
        variant: 'destructive',
      });
      return;
    }

    // Converte os valores inseridos para float
    let parsedAmount = parseLocalNumber(amountInvested);
    let parsedBtc = parseLocalNumber(btcAmount);
    if (displayUnit === 'SATS') parsedBtc = parsedBtc / 100000000;

    // Validações básicas para evitar dados inválidos
    if (
      isNaN(parsedAmount) ||
      isNaN(parsedBtc) ||
      isNaN(exchangeRate) ||
      exchangeRate === 0
    ) {
      toast({
        title: 'Erro nos dados',
        description: 'Por favor, verifique os valores inseridos.',
        variant: 'destructive',
      });
      return;
    }

    // Atualiza o aporte no Supabase
    const { error } = await supabase
      .from('aportes')
      .update({
        data_aporte: date.toISOString().split('T')[0],
        moeda: currency,
        cotacao_moeda: currency,
        valor_investido: parsedAmount,
        bitcoin: parsedBtc,
        cotacao: exchangeRate,
        origem_aporte: origin,
      })
      .eq('id', entry.id); // Garante que o update é feito no aporte certo

    if (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o aporte.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Aporte atualizado',
      description: 'Os dados foram atualizados com sucesso.',
    });

    onClose(); // Fecha o modal após sucesso
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      {/* Seleção de data com calendário */}
      <div className="flex flex-col space-y-1.5">
        <Label>Data do Aporte</Label>
        <div className="flex gap-4">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={calendarPopoverRef}
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal rounded-xl',
                  !date && 'text-muted-foreground'
                )}
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 rounded-md shadow-sm">
                <Calendar
                  mode="single"
                  selected={tempDate}
                  onSelect={setTempDate}
                  initialFocus
                  locale={ptBR}
                  className="rounded-md border-0 shadow-none pointer-events-auto"
                />
                <div className="flex justify-center p-2 mt-2">
                  <Button
                    type="button"
                    onClick={confirmDateSelection}
                    className="rounded-full bg-bitcoin hover:bg-bitcoin/90 text-white w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            onClick={setToday}
            className="shrink-0 rounded-xl"
          >
            <CalendarCheck className="h-4 w-4 mr-2" />
            Hoje
          </Button>
        </div>
      </div>

      {/* Seletor de moeda (BRL/USD) */}
      <CurrencySelector selectedCurrency={currency} onChange={handleCurrencyChange} />

      {/* Entradas de valores: investido e BTC */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AmountInput
          currency={currency}
          value={amountInvested}
          onChange={(val) => {
            setAmountInvested(val);
            const numeric = parseLocalNumber(val);
            if (!isNaN(numeric) && exchangeRate > 0) {
              const btc = numeric / exchangeRate;
              setBtcAmount(
                displayUnit === 'SATS'
                  ? formatNumber(btc * 100000000, 0)
                  : formatNumber(btc, 8)
              );
            }
          }}
        />

        <BtcInput displayUnit={displayUnit} value={btcAmount} onChange={setBtcAmount} />
      </div>

      {/* Cotação atual */}
      <div className="flex flex-col space-y-1.5 mt-4">
        <div className="flex justify-between">
          <Label>Cotação no momento da compra</Label>
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
            placeholder="0,00"
            value={exchangeRateDisplay}
            onChange={(e) => {
              setExchangeRateDisplay(e.target.value);
              const val = parseLocalNumber(e.target.value);
              if (!isNaN(val)) {
                setExchangeRate(val);
              }
            }}
            className="pl-8 rounded-xl"
            type="text"
            required
          />
        </div>
      </div>

      {/* Origem do aporte */}
      <OriginSelector origin={origin} onOriginChange={setOrigin} />

      {/* Ações do formulário */}
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 bg-bitcoin hover:bg-bitcoin/90 rounded-xl py-3 px-4">
          Atualizar
        </Button>
      </div>
    </form>
  );
};

export default EntryEditForm;
