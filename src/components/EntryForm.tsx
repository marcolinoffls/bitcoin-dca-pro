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

  // Importa a lógica do formulário (centraliza os estados e handlers)
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

  // Abrir o modal de importação do Satisfaction
  const openSatisfactionModal = () => {
    setIsSatisfactionModalOpen(true);
  };

  // Fechar o modal de importação do Satisfaction
  const closeSatisfactionModal = () => {
    setIsSatisfactionModalOpen(false);
  };

  /**
   * Processa os dados extraídos do Satisfaction e preenche o formulário
   */
  const handleDataExtracted = (data: {
    exchangeRate?: number;
    amountInvested?: number;
    btcAmount?: number;
    date?: Date;
  }) => {
    // Definir origem como P2P
    handleOriginChange('p2p');
    
    // Preencher taxa de câmbio se disponível
    if (data.exchangeRate) {
      setExchangeRate(data.exchangeRate);
      handleExchangeRateChange(formatNumber(data.exchangeRate));
    }
    
    // Preencher valor investido se disponível
    if (data.amountInvested) {
      setAmountInvested(formatNumber(data.amountInvested));
    }
    
    // Preencher quantidade de Bitcoin se disponível
    if (data.btcAmount) {
      // Formatar conforme a unidade de exibição (BTC ou SATS)
      if (displayUnit === 'SATS') {
        const sats = Math.round(data.btcAmount * 100000000);
        setBtcAmount(formatNumber(sats, 0));
      } else {
        setBtcAmount(formatNumber(data.btcAmount, 8));
      }
    }
    
    // Preencher a data se disponível
    if (data.date) {
      setDate(data.date);
    }
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className={isMobile ? 'pb-2' : 'pb-3'}>
        <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-2`}>
          {/* Novo ícone para o card de Novo Aporte */}
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
          />

          {/* Origem (Corretora ou P2P) */}
          <OriginSelector
            origin={origin}
            onOriginChange={handleOriginChange}
          />

          {/* Ações: Calcular, Resetar, Confirmar */}
          <div className={`flex flex-col gap-3 mt-6`}>
            {/* Mostrar botão de importar apenas quando não estiver em modo de edição */}
            {!editingEntry && (
              <Button 
                type="button"
                variant="outline"
                className="flex items-center justify-center gap-2 text-bitcoin border-bitcoin/50 hover:bg-bitcoin/10"
                onClick={openSatisfactionModal}
              >
                <Upload className="h-4 w-4" />
                Importar do Satisfaction (P2P)
              </Button>
            )}
            
            {/* Componente FormActions existente */}
            <FormActions 
              isEditing={!!editingEntry} 
              displayUnit={displayUnit} 
              onCalculateFromAmount={calculateFromAmount} 
              onCalculateFromBtc={calculateFromBtc} 
              onReset={resetForm} 
            />
          </div>
        </form>
      </CardContent>

      {/* Modal de importação do Satisfaction */}
      <SatisfactionImportModal 
        isOpen={isSatisfactionModalOpen} 
        onClose={closeSatisfactionModal} 
        onDataExtracted={handleDataExtracted}
      />
    </Card>
  );
};

export default EntryForm;
