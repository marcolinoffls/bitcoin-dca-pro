/**
 * Componente: EntryForm
 * 
 * Função: Formulário principal para registrar e editar aportes de Bitcoin.
 * - Se estiver em modo de edição (`editingEntry`), exibe os dados para editar.
 * - Caso contrário, exibe o formulário em branco para novo aporte.
 * 
 * Integrações:
 * - Usa lógica centralizada em `useEntryFormLogic` para controlar os estados e cálculos.
 * - Usa componentes reutilizáveis para cada parte do formulário.
 * 
 * Estilo:
 * - Preserva o layout original com sombra, borda, padding e ícone Bitcoin.
 * 
 * Correção aplicada:
 * - Agora, ao cancelar a edição, o formulário principal é **resetado** e retorna ao modo original.
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bitcoin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import DatePickerField from '@/components/form/DatePickerField';
import CurrencyField from '@/components/form/CurrencyField';
import AmountField from '@/components/form/AmountField';
import BtcAmountField from '@/components/form/BtcAmountField';
import ExchangeRateField from '@/components/form/ExchangeRateField';
import OriginSelector from '@/components/form/OriginSelector';
import FormActions from '@/components/form/FormActions';
import { useEntryFormLogic } from '@/components/form/EntryFormLogic';

interface EntryFormProps {
  onAddEntry: (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p'
  ) => void;
  currentRate: { usd: number; brl: number };
  editingEntry?: {
    id: string;
    date: Date;
    amountInvested: number;
    btcAmount: number;
    exchangeRate: number;
    currency: 'BRL' | 'USD';
    origin?: 'corretora' | 'p2p';
  };
  onCancelEdit?: () => void;
  displayUnit?: 'BTC' | 'SATS';
}

const EntryForm: React.FC<EntryFormProps> = ({ 
  onAddEntry, 
  currentRate, 
  editingEntry, 
  onCancelEdit,
  displayUnit = 'BTC'
}) => {
  const isMobile = useIsMobile();

  // Importa a lógica do formulário (centraliza os estados e handlers)
  const {
    amountInvested,
    setAmountInvested,
    btcAmount,
    setBtcAmount,
    exchangeRate,
    exchangeRateDisplay,
    handleExchangeRateChange,
    currency,
    origin,
    date,
    setDate,
    parseLocalNumber,
    handleCurrencyChange,
    handleOriginChange,
    calculateFromAmount,
    calculateFromBtc,
    useCurrentRate,
    reset
  } = useEntryFormLogic(editingEntry, currentRate, displayUnit);

  // Corrige o bug: limpa o formulário quando o modo de edição é encerrado
  useEffect(() => {
    if (!editingEntry) {
      reset(); // reseta os campos
    }
  }, [editingEntry, reset]);

  // Função que reseta o formulário e informa o fim da edição
  const resetForm = () => {
    reset();
    if (onCancelEdit) {
      onCancelEdit(); // atualiza estado global
    }
  };

  // Envia os dados preenchidos
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedAmount = parseLocalNumber(amountInvested);
    let parsedBtc = parseLocalNumber(btcAmount);

    // Converte de SATS para BTC se necessário
    if (displayUnit === 'SATS') {
      parsedBtc = parsedBtc / 100000000;
    }

    const parsedRate = exchangeRate;

    // Validação básica
    if (isNaN(parsedAmount) || isNaN(parsedBtc) || isNaN(parsedRate) || parsedRate === 0) {
      return;
    }

    // Executa ação de criar ou editar
    onAddEntry(parsedAmount, parsedBtc, parsedRate, currency, date, origin);

    // Limpa formulário após envio
    resetForm();
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className={isMobile ? 'pb-2' : 'pb-3'}>
        <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2`}>
          <Bitcoin className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-bitcoin`} />
          {editingEntry ? 'Editar Aporte' : 'Registrar Novo Aporte'}
        </CardTitle>
      </CardHeader>

      <CardContent className={isMobile ? 'pb-3' : ''}>
        <form onSubmit={handleSubmit} className={`space-y-${isMobile ? '3' : '4'}`}>
          {/* Campo de Data */}
          <DatePickerField 
            date={date} 
            onDateChange={setDate} 
          />

          {/* Seleção de moeda (USD ou BRL) */}
          <CurrencyField 
            currency={currency} 
            onCurrencyChange={handleCurrencyChange} 
          />

          {/* Valores: Investimento e BTC */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AmountField 
              currency={currency} 
              amount={amountInvested} 
              onAmountChange={setAmountInvested} 
            />
            <BtcAmountField 
              btcAmount={btcAmount} 
              onBtcAmountChange={setBtcAmount} 
              displayUnit={displayUnit} 
            />
          </div>

          {/* Cotação de BTC */}
          <ExchangeRateField 
            currency={currency} 
            exchangeRate={exchangeRate}
            displayValue={exchangeRateDisplay}
            onExchangeRateChange={handleExchangeRateChange} 
            onUseCurrentRate={useCurrentRate} 
          />

          {/* Origem (Corretora ou P2P) */}
          <OriginSelector
            origin={origin}
            onOriginChange={handleOriginChange}
          />

          {/* Ações: Calcular, Resetar, Confirmar */}
          <FormActions 
            isEditing={!!editingEntry} 
            displayUnit={displayUnit} 
            onCalculateFromAmount={calculateFromAmount} 
            onCalculateFromBtc={calculateFromBtc} 
            onReset={resetForm} 
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default EntryForm;
