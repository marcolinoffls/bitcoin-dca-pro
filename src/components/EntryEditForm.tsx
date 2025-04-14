
/**
 * Componente: EntryEditForm
 * 
 * Formulário para edição de aportes existentes.
 * Permite alterar todos os campos (data, valor, quantidade, cotação, moeda e origem).
 * 
 * É chamado pelo EntriesList quando o usuário clica no botão de editar.
 */
import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useBitcoinEntries } from "@/hooks/useBitcoinEntries";
import { BitcoinEntry, CurrentRate, Origin } from "@/types";
import { formatNumber } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OriginSelector from "./form/OriginSelector";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';

interface EntryEditFormProps {
  entry: BitcoinEntry;
  currentRate: CurrentRate;
  onClose: () => void;
  displayUnit: 'BTC' | 'SATS';
}

const EntryEditForm: React.FC<EntryEditFormProps> = ({ 
  entry,
  currentRate,
  onClose,
  displayUnit
}) => {
  const { user } = useAuth();
  const { updateEntry } = useBitcoinEntries();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [date, setDate] = useState<Date>(new Date(entry.date));
  const [amount, setAmount] = useState<string>(entry.amountInvested.toString());
  const [bitcoinAmount, setBitcoinAmount] = useState<string>(entry.btcAmount.toString());
  const [exchangeRate, setExchangeRate] = useState<string>(entry.exchangeRate.toString());
  const [currency, setCurrency] = useState<'BRL' | 'USD'>(entry.currency);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Garantindo que o valor de origem seja sempre 'corretora' ou 'p2p'
  const initialOrigin: Origin = entry.origin === "corretora" || entry.origin === "p2p" 
    ? entry.origin 
    : "corretora";
  
  const [origin, setOrigin] = useState<Origin>(initialOrigin);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      
      setIsUpdating(true);
      
      const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
      const numericBitcoinAmount = parseFloat(bitcoinAmount.replace(/\./g, '').replace(',', '.'));
      const numericExchangeRate = parseFloat(exchangeRate.replace(/\./g, '').replace(',', '.'));
      
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("O valor investido deve ser um número positivo");
      }
      
      if (isNaN(numericBitcoinAmount) || numericBitcoinAmount <= 0) {
        throw new Error("A quantidade de Bitcoin deve ser um número positivo");
      }
      
      if (isNaN(numericExchangeRate) || numericExchangeRate <= 0) {
        throw new Error("A cotação deve ser um número positivo");
      }
      
      await updateEntry(entry.id, {
        date,
        amountInvested: numericAmount,
        btcAmount: numericBitcoinAmount,
        exchangeRate: numericExchangeRate,
        currency,
        origin
      });
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Aporte atualizado",
        description: "Os dados do aporte foram atualizados com sucesso!",
        variant: "success",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Erro ao atualizar aporte:", error);
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o aporte",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  useEffect(() => {
    // Calcular a cotação automaticamente se o usuário alterar o valor ou a quantidade
    if (amount && bitcoinAmount) {
      try {
        const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
        const numericBitcoinAmount = parseFloat(bitcoinAmount.replace(/\./g, '').replace(',', '.'));
        
        if (!isNaN(numericAmount) && !isNaN(numericBitcoinAmount) && numericBitcoinAmount > 0) {
          const calculatedRate = numericAmount / numericBitcoinAmount;
          setExchangeRate(formatCurrencyValue(calculatedRate));
        }
      } catch (error) {
        console.error("Erro ao calcular cotação:", error);
      }
    }
  }, [amount, bitcoinAmount]);

  // Funções para formatação de valores
  const formatCurrencyValue = (value: number): string => {
    return formatNumber(value, 2);
  };

  const handleAmountChange = (value: string) => {
    // Remover qualquer caractere que não seja número ou vírgula/ponto
    const cleanedValue = value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
    
    // Formatar para exibição
    const formattedValue = cleanedValue ? formatCurrencyValue(parseFloat(cleanedValue)) : '';
    
    setAmount(formattedValue);
  };

  const handleBitcoinAmountChange = (value: string) => {
    // Remover qualquer caractere que não seja número ou vírgula/ponto
    const cleanedValue = value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
    
    // Formatar para exibição
    const formattedValue = cleanedValue ? formatNumber(parseFloat(cleanedValue), 8) : '';
    
    setBitcoinAmount(formattedValue);
  };

  const handleExchangeRateChange = (value: string) => {
    // Remover qualquer caractere que não seja número ou vírgula/ponto
    const cleanedValue = value.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.');
    
    // Formatar para exibição
    const formattedValue = cleanedValue ? formatCurrencyValue(parseFloat(cleanedValue)) : '';
    
    setExchangeRate(formattedValue);
  };

  const handleSwitchToBtcValue = () => {
    try {
      const currentValueBRL = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
      let newValueBTC = 0;
      
      if (currency === 'BRL') {
        // Converter de BRL para BTC usando a cotação atual
        newValueBTC = currentValueBRL / currentRate.brl;
      } else {
        // Converter de USD para BTC usando a cotação atual
        newValueBTC = currentValueBRL / currentRate.usd;
      }
      
      if (!isNaN(newValueBTC)) {
        setBitcoinAmount(formatBitcoinValue(newValueBTC));
      }
    } catch (error) {
      console.error("Erro ao converter para BTC:", error);
    }
  };

  // Função para formatar valor de Bitcoin
  const formatBitcoinValue = (value: number): string => {
    return formatNumber(value, 8);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const formatBtcLabel = () => {
    if (displayUnit === 'SATS') {
      return 'Satoshis';
    }
    return 'Bitcoin (BTC)';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-2">
      <div className="space-y-3">
        <div className="grid gap-2">
          <Label htmlFor="date">Data do aporte</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
                id="date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DatePicker
                selected={date}
                onChange={(date: Date) => setDate(date)}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                inline
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="amount">{currency === 'BRL' ? 'Valor investido (R$)' : 'Valor investido ($)'}</Label>
          <div className="flex space-x-2">
            <Input
              id="amount"
              placeholder={currency === 'BRL' ? "Ex: 1.000,00" : "Ex: 200.00"}
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="text-right"
            />
            <Tabs value={currency} onValueChange={(value) => setCurrency(value as 'BRL' | 'USD')} className="w-[120px]">
              <TabsList className="grid grid-cols-2 h-10">
                <TabsTrigger value="BRL" className="text-xs">BRL</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="btcAmount">{formatBtcLabel()}</Label>
            <Button 
              type="button" 
              variant="link" 
              className="text-xs h-auto p-0 text-bitcoin hover:text-bitcoin/80"
              onClick={handleSwitchToBtcValue}
            >
              Usar cotação atual
            </Button>
          </div>
          <Input
            id="btcAmount"
            placeholder={displayUnit === 'SATS' ? "Ex: 1.000.000" : "Ex: 0,00520000"}
            value={bitcoinAmount}
            onChange={(e) => handleBitcoinAmountChange(e.target.value)}
            className="text-right"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="exchangeRate">
            {currency === 'BRL' ? 'Cotação (R$ por BTC)' : 'Cotação ($ por BTC)'}
          </Label>
          <Input
            id="exchangeRate"
            placeholder={currency === 'BRL' ? "Ex: 320.000,00" : "Ex: 64,000.00"}
            value={exchangeRate}
            onChange={(e) => handleExchangeRateChange(e.target.value)}
            className="text-right"
          />
        </div>
        
        <OriginSelector origin={origin} onOriginChange={setOrigin} />
      </div>

      <div className="flex gap-2 pt-4 justify-between">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isUpdating} className="flex-1 bg-bitcoin hover:bg-bitcoin/90">
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Atualizar"
          )}
        </Button>
      </div>
    </form>
  );
};

export default EntryEditForm;
