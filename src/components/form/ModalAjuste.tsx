
/**
 * Modal para ajustes de saldo (saques, taxas, etc)
 * 
 * Permite registrar movimentações que afetam o saldo de Bitcoin
 * sem alterar a lógica principal de aportes
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

interface ModalAjusteProps {
  isOpen: boolean;
  onClose: () => void;
  onAjuste: (data: {
    date: Date;
    btcAmount: number;
    observacao?: string;
  }) => void;
  displayUnit: 'BTC' | 'SATS';
}

const ModalAjuste: React.FC<ModalAjusteProps> = ({
  isOpen,
  onClose,
  onAjuste,
  displayUnit
}) => {
  const [date, setDate] = useState<Date>(new Date());
  const [btcAmount, setBtcAmount] = useState('');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!date) {
      setError('A data é obrigatória');
      return;
    }

    let parsedAmount = displayUnit === 'SATS' 
      ? parseFloat(btcAmount.replace(',', '.')) / 100000000 
      : parseFloat(btcAmount.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount === 0) {
      setError('A quantidade de Bitcoin é obrigatória e deve ser diferente de zero');
      return;
    }

    // Enviar ajuste
    onAjuste({
      date,
      btcAmount: parsedAmount,
      observacao: observacao.trim() || undefined
    });

    // Resetar form
    setBtcAmount('');
    setObservacao('');
    setError(null);
    onClose();

    // Feedback visual
    toast({
      title: "Ajuste registrado",
      description: "O ajuste foi registrado com sucesso"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl px-6">
        <DialogHeader>
          <DialogTitle>Ajustar Saldo</DialogTitle>
          <DialogDescription>
            Registre saques, taxas ou outros ajustes que afetam seu saldo de Bitcoin.
            {displayUnit === 'SATS' 
              ? ' Use valores negativos para saques.'
              : ' Use valores negativos para saques.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <DatePickerField 
            date={date} 
            onDateChange={setDate}
          />

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
                placeholder={displayUnit === 'SATS' ? "-1000" : "-0.001"}
                className="pl-12 rounded-xl"
                type="text"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="observacao">Motivo/Observação (opcional)</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Taxa de transferência, Saque para custódia fria..."
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {error && (
            <FormError message={error} variant="destructive" />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
            >
              Confirmar Ajuste
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalAjuste;
