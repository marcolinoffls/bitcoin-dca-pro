
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoveRight, Plus, Loader2, X } from "lucide-react";
import AmountField from './form/AmountField';
import BtcAmountField from './form/BtcAmountField';
import ExchangeRateField from './form/ExchangeRateField';
import CurrencyField from './form/CurrencyField';
import OriginSelector from './form/OriginSelector';
import DatePickerField from './form/DatePickerField';
import FormActions from './form/FormActions';
import { Origin, BitcoinEntry, CurrentRate } from '@/types';
import { validateForm, calculateExchangeRate } from './form/EntryFormLogic';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Componente: EntryForm
 * 
 * Formulário para adicionar novos aportes de Bitcoin.
 * Permite inserir todos os dados necessários: data, valor, quantidade, cotação, etc.
 * 
 * Exibido na área principal da dashboard.
 */
interface EntryFormProps {
  onAddEntry: (
    amountInvested: number,
    btcAmount: number,
    exchangeRate: number,
    currency: 'BRL' | 'USD',
    date: Date,
    origin: Origin
  ) => void;
  onCancelEdit: () => void;
  currentRate: CurrentRate;
  displayUnit: 'BTC' | 'SATS';
  editingEntry?: BitcoinEntry | null;
}

const EntryForm: React.FC<EntryFormProps> = ({
  onAddEntry,
  onCancelEdit,
  currentRate,
  displayUnit,
  editingEntry
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para cada campo do formulário
  const [date, setDate] = useState<Date>(new Date());
  const [amountInvested, setAmountInvested] = useState<string>('');
  const [btcAmount, setBtcAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<string>('');
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [origin, setOrigin] = useState<Origin>('corretora');
  
  // Efeito para preencher o formulário com dados do aporte em edição
  useEffect(() => {
    if (editingEntry) {
      setDate(new Date(editingEntry.date));
      setAmountInvested(editingEntry.amountInvested.toString());
      setBtcAmount(editingEntry.btcAmount.toString());
      setExchangeRate(editingEntry.exchangeRate.toString());
      setCurrency(editingEntry.currency);
      
      // Garantir que origin seja apenas 'corretora' ou 'p2p'
      const validOrigin: Origin = editingEntry.origin === 'corretora' || editingEntry.origin === 'p2p' 
        ? editingEntry.origin 
        : 'corretora';
      
      setOrigin(validOrigin);
    }
  }, [editingEntry]);
  
  // Limpar formulário
  const resetForm = () => {
    setDate(new Date());
    setAmountInvested('');
    setBtcAmount('');
    setExchangeRate('');
    setCurrency('BRL');
    setOrigin('corretora');
  };

  // Manipulador de submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Evitar duplo envio
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Validação de dados antes do envio
      const {
        numericAmount,
        numericBtcAmount,
        numericExchangeRate
      } = validateForm(amountInvested, btcAmount, exchangeRate);
      
      // Enviar dados para o componente pai
      onAddEntry(
        numericAmount,
        numericBtcAmount,
        numericExchangeRate,
        currency,
        date,
        origin
      );
      
      // Feedback ao usuário
      toast({
        title: "Aporte registrado",
        description: "Os dados foram salvos com sucesso!",
        variant: "success",
      });
      
      // Limpar formulário após envio bem-sucedido
      if (!editingEntry) {
        resetForm();
      } else {
        onCancelEdit(); // Sair do modo de edição
      }
    } catch (error) {
      // Feedback de erro ao usuário
      toast({
        title: "Erro ao registrar aporte",
        description: error instanceof Error ? error.message : "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar a cotação quando valor ou quantidade mudam
  const updateExchangeRate = () => {
    try {
      const { calculatedRate } = calculateExchangeRate(amountInvested, btcAmount);
      if (calculatedRate) {
        setExchangeRate(calculatedRate);
      }
    } catch (error) {
      console.error("Erro ao calcular cotação:", error);
    }
  };

  // Usar a cotação atual do mercado
  const useCurrentMarketRate = () => {
    // Usar a cotação do par selecionado (BRL ou USD)
    const currentMarketRate = currency === 'BRL' ? currentRate.brl : currentRate.usd;
    
    // Atualizar o campo de cotação
    if (currentMarketRate) {
      setExchangeRate(currentMarketRate.toString());
    }
  };

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <CardHeader className="bg-white pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {editingEntry ? (
            <>
              <MoveRight size={18} className="text-bitcoin" />
              Editar Aporte
            </>
          ) : (
            <>
              <Plus size={18} className="text-bitcoin" />
              Novo Aporte
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <DatePickerField date={date} onDateChange={setDate} />
              
              <AmountField
                value={amountInvested}
                onValueChange={setAmountInvested}
                currency={currency}
                onCurrencyChange={setCurrency}
                onBlur={updateExchangeRate}
              />
            </div>
            
            <div className="space-y-4">
              <BtcAmountField
                value={btcAmount}
                onValueChange={setBtcAmount}
                onBlur={updateExchangeRate}
                currentRate={currentRate}
                currency={currency}
                amount={amountInvested}
                displayUnit={displayUnit}
              />
              
              <ExchangeRateField
                value={exchangeRate}
                onValueChange={setExchangeRate}
                currency={currency}
                onUseCurrentRate={useCurrentMarketRate}
              />
              
              <OriginSelector
                origin={origin}
                onOriginChange={setOrigin}
              />
            </div>
          </div>

          <FormActions
            isSubmitting={isSubmitting}
            isEditing={!!editingEntry}
            onCancel={editingEntry ? onCancelEdit : resetForm}
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default EntryForm;
