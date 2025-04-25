
/**
 * Modal para ajustes de saldo (saques, taxas, etc) e definição de saldo total
 * 
 * Permite:
 * 1. Registrar movimentações que afetam o saldo de Bitcoin (modo ajuste)
 * 2. Definir um novo saldo total, gerando um ajuste automático (modo saldo total)
 */
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DatePickerField from './DatePickerField';
import { FormError } from '@/components/auth/FormError';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ModalAjusteProps {
  isOpen: boolean;
  onClose: () => void;
  onAjuste: (data: {
    date: Date;
    btcAmount: number;
    observacao?: string;
  }) => void;
  displayUnit: 'BTC' | 'SATS';
  currentBalance: number; // Saldo atual em BTC
}

type AdjustmentMode = 'manual' | 'total';

const ModalAjuste: React.FC<ModalAjusteProps> = ({
  isOpen,
  onClose,
  onAjuste,
  displayUnit,
  currentBalance
}) => {
  // Estado para controlar o modo de ajuste
  const [mode, setMode] = useState<AdjustmentMode>('manual');
  
  // Estados comuns
  const [date, setDate] = useState<Date>(new Date());
  const [btcAmount, setBtcAmount] = useState('');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Estado específico para o modo total
  const [newTotalBalance, setNewTotalBalance] = useState('');

  const resetForm = () => {
    setBtcAmount('');
    setNewTotalBalance('');
    setObservacao('');
    setError(null);
    setMode('manual');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação da data
    if (!date) {
      setError('A data é obrigatória');
      return;
    }

    try {
      let adjustmentAmount: number;

      if (mode === 'manual') {
        // Modo manual: usa o valor informado diretamente
        adjustmentAmount = displayUnit === 'SATS' 
          ? parseFloat(btcAmount.replace(',', '.')) / 100000000 
          : parseFloat(btcAmount.replace(',', '.'));

        if (isNaN(adjustmentAmount) || adjustmentAmount === 0) {
          setError('A quantidade de Bitcoin é obrigatória e deve ser diferente de zero');
          return;
        }
      } else {
        // Modo total: calcula a diferença entre o novo total e o saldo atual
        const newTotal = displayUnit === 'SATS'
          ? parseFloat(newTotalBalance.replace(',', '.')) / 100000000
          : parseFloat(newTotalBalance.replace(',', '.'));

        if (isNaN(newTotal)) {
          setError('Por favor, informe um valor válido para o novo saldo total');
          return;
        }

        // Calcula a diferença
        adjustmentAmount = newTotal - currentBalance;

        if (adjustmentAmount === 0) {
          setError('O novo saldo é igual ao saldo atual. Nenhum ajuste necessário.');
          return;
        }

        // No modo total, sempre adiciona a observação padrão
        if (!observacao.trim()) {
          setObservacao('Ajuste automático após redefinição de saldo');
        }
      }

      // Envia o ajuste
      onAjuste({
        date,
        btcAmount: adjustmentAmount,
        observacao: observacao.trim() || undefined
      });

      // Feedback e reset
      toast({
        title: mode === 'manual' ? "Ajuste registrado" : "Saldo total atualizado",
        description: mode === 'manual' 
          ? "O ajuste foi registrado com sucesso"
          : "O saldo total foi atualizado com sucesso"
      });

      resetForm();
      onClose();
    } catch (err) {
      setError('Erro ao processar o ajuste. Verifique os valores informados.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl px-6 h-[520px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'manual' ? 'Ajustar Saldo' : 'Definir Saldo Total'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'manual' 
              ? 'Registre saques, taxas ou outros ajustes que afetam seu saldo de Bitcoin.'
              : 'Informe seu saldo atual de Bitcoin para gerar um ajuste automático.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="manual" 
          value={mode} 
          onValueChange={(value) => setMode(value as AdjustmentMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual">Ajuste Manual</TabsTrigger>
            <TabsTrigger value="total">Definir Saldo Total</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <DatePickerField 
              date={date} 
              onDateChange={setDate}
            />

            {mode === 'manual' ? (
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="btcAmount">
                  {displayUnit === 'BTC' ? 'Quantidade em Bitcoin' : 'Quantidade em Satoshis'}
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                    {displayUnit === 'BTC' ? 'BTC' : 'SATS'}
                  </span>
                  <Input
                    id="btcAmount"
                    value={btcAmount}
                    onChange={(e) => setBtcAmount(e.target.value)}
                    placeholder={displayUnit === 'SATS' ? "-1000" : "-0.0001"}
                    className="pl-12 rounded-xl"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="newTotalBalance">
                  {displayUnit === 'BTC' ? 'Saldo Total em Bitcoin' : 'Saldo Total em Satoshis'}
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                    {displayUnit === 'BTC' ? 'BTC' : 'SATS'}
                  </span>
                  <Input
                    id="newTotalBalance"
                    value={newTotalBalance}
                    onChange={(e) => setNewTotalBalance(e.target.value)}
                    placeholder={displayUnit === 'SATS' ? "100000" : "0.045236255"}
                    className="pl-12 rounded-xl"
                    type="text"
                    inputMode="decimal"
                  />
                </div>
                  <p className="text-sm text-muted-foreground min-h-[1.25rem]">
                    {mode === 'total' && (
                      displayUnit === 'BTC' 
                        ? `Saldo atual: ${currentBalance.toFixed(8)} BTC`
                        : `Saldo atual: ${(currentBalance * 100000000).toFixed(0)} SATS`
                    )}
                  </p>
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="observacao">Motivo/Observação {mode === 'manual' ? '(opcional)' : ''}</Label>
              <Textarea
                id="observacao"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder={mode === 'manual' 
                  ? "Ex: Taxa de transferência, Saque para custódia fria..."
                  : "Ex: Correção após conferência de saldo"}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            {error && (
              <FormError message={error} variant="destructive" />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
              >
                {mode === 'manual' ? 'Confirmar Ajuste' : 'Atualizar Saldo'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ModalAjuste;
