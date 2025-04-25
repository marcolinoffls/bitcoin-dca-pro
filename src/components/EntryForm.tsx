
/**
 * Componente: EntryForm
 * 
 * Função: Formulário principal para registrar e editar aportes de Bitcoin.
 * 
 * Atualizado para incluir botão de ajuste de saldo ao lado do formulário principal
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
import ModalAjuste from '@/components/form/ModalAjuste';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import SuccessToast from '@/components/ui/success-toast';
import { FormError } from '@/components/auth/FormError';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';

interface EntryFormProps {
  onAddEntry: (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: 'corretora' | 'p2p' | 'planilha' | 'ajuste'
  ) => void;
  currentRate: { usd: number; brl: number };
  editingEntry?: {
    id: string;
    date: Date;
    amountInvested: number;
    btcAmount: number;
    exchangeRate: number;
    currency: 'BRL' | 'USD';
    origin?: 'corretora' | 'p2p' | 'planilha' | 'ajuste';
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
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rateInfoMessage, setRateInfoMessage] = useState<string | null>(null);
  
  // Obter entradas de Bitcoin para cálculo do saldo atual
  const { entries = [] } = useBitcoinEntries();

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
    calculateExchangeRate,
    validateForm,
    isExchangeRateCalculated,
    reset
  } = useEntryFormLogic(editingEntry, currentRate, displayUnit);

  useEffect(() => {
    if (!editingEntry) {
      reset();
    }
  }, [editingEntry, reset]);

  const resetForm = () => {
    reset();
    setFormError(null);
    setRateInfoMessage(null);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setRateInfoMessage(null);
    
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    
    let parsedAmount = parseLocalNumber(amountInvested);
    let parsedBtc = parseLocalNumber(btcAmount);
    let parsedRate = exchangeRate;
  
    if (displayUnit === 'SATS') {
      parsedBtc = parsedBtc / 100000000;
    }
  
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("O valor investido é inválido");
      return;
    }
  
    if (isNaN(parsedBtc) || parsedBtc <= 0) {
      setFormError("A quantidade de bitcoin é inválida");
      return;
    }
  
    if (!exchangeRateDisplay.trim() || parsedRate === 0) {
      parsedRate = parsedAmount / parsedBtc;
      setRateInfoMessage("Cotação calculada automaticamente com base no valor investido e quantidade de bitcoin.");
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

  const handleAjuste = (data: { date: Date; btcAmount: number; observacao?: string }) => {
    const currentRateValue = currency === 'USD' ? currentRate.usd : currentRate.brl;
    
    onAddEntry(
      Math.abs(data.btcAmount * currentRateValue),
      data.btcAmount,
      currentRateValue,
      currency,
      data.date,
      'ajuste'
    );
  };

  // Calcula o saldo total atual de Bitcoin
  const currentBalance = entries.reduce((total, entry) => total + entry.btcAmount, 0);

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className={isMobile ? 'pb-2' : 'pb-3'}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2`}>
            <div className="h-8 w-8">
              <img 
                src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/novo-aporte.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvbm92by1hcG9ydGUucG5nIiwiaWF0IjoxNzQ0NDk3MTY4LCJleHAiOjE3NzYwMzMxNjh9.gSYsPjL3OqW6iNLDHtvyuoYh6SBlJUm30UL16I4NPI8" 
                alt="NOVO APORTE"
                className="h-full w-full object-contain"
              />
            </div>
            {editingEntry ? 'Editar Aporte' : 'Novo Aporte'}
          </CardTitle>

          {!editingEntry && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAjusteModalOpen(true)}
              className={`${isMobile ? 'text-sm h-8' : ''} text-purple-500 border-purple-500/30 hover:bg-purple-50`}
            >
              Ajustar Saldo
            </Button>
          )}
        </div>
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
            isOptional={true}
            isCalculated={isExchangeRateCalculated}
          />

          {rateInfoMessage && (
            <FormError message={rateInfoMessage} variant="warning" />
          )}

          {formError && (
            <FormError message={formError} variant="destructive" />
          )}

          <OriginSelector
            origin={origin}
            onOriginChange={handleOriginChange}
          />

          <div className="flex flex-col gap-3">
            {!editingEntry && (
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-col items-center'} gap-3`}>
                <Button 
                  type="button"
                  variant="outline"
                  className={`flex items-center justify-center gap-2 text-bitcoin border-bitcoin/50 hover:bg-bitcoin/10 rounded-xl
                    ${isMobile ? 'w-full' : 'w-[280px]'}`}
                  onClick={openSatisfactionModal}
                >
                  <Upload className="h-4 w-4" />
                  Importar do Satsfaction (P2P)
                </Button>
                
                <FormActions 
                  isEditing={!!editingEntry} 
                  displayUnit={displayUnit} 
                  onCalculateFromAmount={calculateFromAmount} 
                  onCalculateFromBtc={calculateFromBtc} 
                  onReset={resetForm}
                  className={isMobile ? '' : 'w-[280px]'}
                />
              </div>
            )}
          </div>
        </form>
      </CardContent>

      <SatisfactionImportModal 
        isOpen={isSatisfactionModalOpen} 
        onClose={() => setIsSatisfactionModalOpen(false)}
        onDataExtracted={handleDataExtracted}
      />

      <ModalAjuste
        isOpen={isAjusteModalOpen}
        onClose={() => setIsAjusteModalOpen(false)}
        onAjuste={handleAjuste}
        displayUnit={displayUnit}
        currentBalance={currentBalance}
      />

      <SuccessToast
        message="Aporte registrado com sucesso!"
        isOpen={successToastOpen}
        onClose={() => setSuccessToastOpen(false)}
        autoClose={true}
        autoCloseTime={3000}
        showBitcoin={true}
      />
    </Card>
  );
};

export default EntryForm;
