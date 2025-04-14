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
 * - Adicionado feedback visual e sonoro ao registrar um aporte com sucesso
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePickerField from '@/components/form/DatePickerField';
import CurrencyField from '@/components/form/CurrencyField';
import AmountField from '@/components/form/AmountField';
import BtcAmountField from '@/components/form/BtcAmountField';
import ExchangeRateField from '@/components/form/ExchangeRateField';
import OriginSelector from '@/components/form/OriginSelector';
import FormActions from '@/components/form/FormActions';
import { useEntryFormLogic } from '@/components/form/EntryFormLogic';
import { useIsMobile } from '@/hooks/use-mobile';
import SatisfactionImportModal from '@/components/form/SatisfactionImportModal';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import SuccessToast from '@/components/ui/success-toast';

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
  const [isSatisfactionModalOpen, setIsSatisfactionModalOpen] = useState(false);
  const [successToastOpen, setSuccessToastOpen] = useState(false);

  const {
    amountInvested,
    setAmountInvested,
    btcAmount,
    setBtcAmount,
    exchangeRate,
    exchangeRateDisplay,
    handleExchangeRateChange,
    setExchangeRate,
    currency,
    origin,
    date,
    setDate,
    parseLocalNumber,
    handleCurrencyChange,
    handleOriginChange,
    calculateFromAmount,
    calculateFromBtc,
    reset
  } = useEntryFormLogic(editingEntry, currentRate, displayUnit);

  useEffect(() => {
    if (!editingEntry) {
      reset();
    }
  }, [editingEntry, reset]);

  const resetForm = () => {
    reset();
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedAmount = parseLocalNumber(amountInvested);
    let parsedBtc = parseLocalNumber(btcAmount);

    if (displayUnit === 'SATS') {
      parsedBtc = parsedBtc / 100000000;
    }

    const parsedRate = exchangeRate;

    if (isNaN(parsedAmount) || isNaN(parsedBtc) || isNaN(parsedRate) || parsedRate === 0) {
      return;
    }

    onAddEntry(parsedAmount, parsedBtc, parsedRate, currency, date, origin);
    
    if (!editingEntry) {
      setSuccessToastOpen(true);
    }

    resetForm();
  };

  const openSatisfactionModal = () => {
    setIsSatisfactionModalOpen(true);
  };

  const closeSatisfactionModal = () => {
    setIsSatisfactionModalOpen(false);
  };

  const closeSuccessToast = () => {
    setSuccessToastOpen(false);
  };

  const handleDataExtracted = (data: {
    exchangeRate?: number;
    amountInvested?: number;
    btcAmount?: number;
    date?: Date;
  }) => {
    handleOriginChange('p2p');
    
    if (data.exchangeRate) {
      setExchangeRate(data.exchangeRate);
      handleExchangeRateChange(formatNumber(data.exchangeRate));
    }
    
    if (data.amountInvested) {
      setAmountInvested(formatNumber(data.amountInvested));
    }
    
    if (data.btcAmount) {
      if (displayUnit === 'SATS') {
        const sats = Math.round(data.btcAmount * 100000000);
        setBtcAmount(formatNumber(sats, 0));
      } else {
        setBtcAmount(formatNumber(data.btcAmount, 8));
      }
    }
    
    if (data.date) {
      setDate(data.date);
    }
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className={isMobile ? 'pb-2' : 'pb-3'}>
        <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2`}>
          <div className="h-8 w-8">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/novo-aporte.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvbm92by1hcG9ydGUucG5nIiwiaWF0IjoxNzQ0NDk3MTY4LCJleHAiOjE3NzYwMzMxNjh9.gSYsPjL3OqW6iNLDHtvyuoYh6SBlJUm30UL16I4NPI8" 
              alt="Novo Aporte"
              className="h-full w-full object-contain"
            />
          </div>
          {editingEntry ? 'Editar Aporte' : 'Novo Aporte'}
        </CardTitle>
      </CardHeader>

      <CardContent className={isMobile ? 'pb-3' : ''}>
        <form onSubmit={handleSubmit} className={`space-y-${isMobile ? '3' : '4'}`}>
          <DatePickerField 
            date={date} 
            onDateChange={setDate} 
          />

          <CurrencyField 
            currency={currency} 
            onCurrencyChange={handleCurrencyChange} 
          />

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

          <ExchangeRateField 
            currency={currency} 
            exchangeRate={exchangeRate}
            displayValue={exchangeRateDisplay}
            onExchangeRateChange={handleExchangeRateChange} 
          />

          <OriginSelector
            origin={origin}
            onOriginChange={handleOriginChange}
          />

          <div className="flex flex-col gap-3">
            {!editingEntry && (
              <div className={`${isMobile ? 'flex flex-col gap-3' : 'flex justify-end gap-4'}`}>
                <Button 
                  type="button"
                  variant="outline"
                  className={`flex items-center justify-center gap-2 text-bitcoin border-bitcoin/50 hover:bg-bitcoin/10
                    ${isMobile ? 'w-full' : 'w-1/3'}`}
                  onClick={openSatisfactionModal}
                >
                  <Upload className="h-4 w-4" />
                  Importar do Satisfaction (P2P)
                </Button>
                
                <FormActions 
                  isEditing={!!editingEntry} 
                  displayUnit={displayUnit} 
                  onCalculateFromAmount={calculateFromAmount} 
                  onCalculateFromBtc={calculateFromBtc} 
                  onReset={resetForm}
                  className={isMobile ? '' : 'w-1/3'}
                />
              </div>
            )}
          </div>
        </form>
      </CardContent>

      <SatisfactionImportModal 
        isOpen={isSatisfactionModalOpen} 
        onClose={closeSatisfactionModal} 
        onDataExtracted={handleDataExtracted}
      />

      <SuccessToast
        message="Aporte registrado com sucesso!"
        isOpen={successToastOpen}
        onClose={closeSuccessToast}
        autoClose={true}
        autoCloseTime={3000}
        showBitcoin={true}
      />
    </Card>
  );
};

export default EntryForm;
