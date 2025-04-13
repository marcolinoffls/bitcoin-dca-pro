
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
 * - Removido o botão "Usar cotação atual" para evitar inconsistências
 * - Campos de valor e quantidade de BTC são totalmente independentes
 * - Adicionado suporte para origem "planilha"
 */

import React, { useEffect, useState } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import DatePickerField from '@/components/form/DatePickerField';
import CurrencyField from '@/components/form/CurrencyField';
import AmountField from '@/components/form/AmountField';
import BtcAmountField from '@/components/form/BtcAmountField';
import ExchangeRateField from '@/components/form/ExchangeRateField';
import OriginSelector from '@/components/form/OriginSelector';
import FormActions from '@/components/form/FormActions';
import { useEntryFormLogic } from '@/components/form/EntryFormLogic';
import { useIsMobile } from '@/hooks/use-mobile';

interface EntryFormProps {
  onAddEntry: (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p' | 'planilha'
  ) => void;
  currentRate: { usd: number; brl: number };
  editingEntry?: {
    id: string;
    date: Date;
    amountInvested: number;
    btcAmount: number;
    exchangeRate: number;
    currency: 'BRL' | 'USD';
    origin?: 'corretora' | 'p2p' | 'planilha';
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
    // Renomeamos a variável `origin` que vem do hook para evitar conflito
    origin: entryOrigin,
    date,
    setDate,
    parseLocalNumber,
    handleCurrencyChange,
    // Renomeamos o handler que vem do hook para evitar conflito
    handleOriginChange: entryHandleOriginChange,
    calculateFromAmount,
    calculateFromBtc,
    reset
  } = useEntryFormLogic(editingEntry, currentRate, displayUnit);

  // Estado de origin local com suporte para "planilha"
  const [origin, setOrigin] = useState<'corretora' | 'p2p' | 'planilha'>(
    (editingEntry?.origin || 'corretora') as 'corretora' | 'p2p' | 'planilha'
  );

  // Corrige o bug: limpa o formulário quando o modo de edição é encerrado
  useEffect(() => {
    if (!editingEntry) {
      reset(); // reseta os campos
    } else if (editingEntry.origin) {
      // Se estiver editando, atualiza a origem com o valor do aporte
      setOrigin(editingEntry.origin as 'corretora' | 'p2p' | 'planilha');
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

  // Handler para atualizar a origem (incluindo "planilha")
  const handleOriginChange = (newOrigin: 'corretora' | 'p2p' | 'planilha') => {
    setOrigin(newOrigin);
    // Atualiza também no hook se o tipo for compatível 
    if (newOrigin === 'corretora' || newOrigin === 'p2p') {
      entryHandleOriginChange(newOrigin);
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="pb-4 px-0">
        <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2`}>
          {/* Ícone para o card de Registrar Novo Aporte */}
          <div className="h-8 w-8 flex-shrink-0">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/novo-aporte.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvbm92by1hcG9ydGUucG5nIiwiaWF0IjoxNzQ0NDk3MTY4LCJleHAiOjE3NzYwMzMxNjh9.gSYsPjL3OqW6iNLDHtvyuoYh6SBlJUm30UL16I4NPI8" 
              alt="Novo Aporte"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="flex-grow text-left">
            {editingEntry ? 'Editar Aporte' : 'Registrar Novo Aporte'}
          </span>
        </CardTitle>
      </CardHeader>

      <div className="px-0">
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          />

          {/* Origem (Corretora, P2P ou Planilha) */}
          <OriginSelector
            origin={origin}
            onOriginChange={handleOriginChange}
          />

          {/* Ações: Calcular, Resetar, Confirmar */}
          <div className="pt-2">
            <FormActions 
              isEditing={!!editingEntry} 
              displayUnit={displayUnit} 
              onCalculateFromAmount={calculateFromAmount} 
              onCalculateFromBtc={calculateFromBtc} 
              onReset={resetForm} 
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntryForm;
