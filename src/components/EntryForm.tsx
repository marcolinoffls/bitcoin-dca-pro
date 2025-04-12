/**
 * Componente EntryForm
 *
 * Formulário usado para registrar ou editar um aporte de Bitcoin.
 *
 * Estilo: Visual padronizado com cantos arredondados, sombra e botões laranja.
 * Modo Edição: Mostra os dados preenchidos e troca o botão para "Atualizar".
 *
 * Props:
 * - editingEntry: se presente, ativa o modo edição.
 * - onAddEntry: callback após adicionar ou atualizar.
 * - onCancelEdit: função que cancela a edição.
 * - currentRate: cotação atual do Bitcoin.
 * - displayUnit: 'BTC' ou 'SATS'.
 */

import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BitcoinEntry, CurrentRate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface EntryFormProps {
  editingEntry?: BitcoinEntry | null;
  onAddEntry: () => void;
  onCancelEdit: () => void;
  currentRate: CurrentRate;
  displayUnit: 'BTC' | 'SATS';
}

const EntryForm: React.FC<EntryFormProps> = ({
  editingEntry,
  onAddEntry,
  onCancelEdit,
  currentRate,
  displayUnit,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      data_aporte: format(new Date(), 'yyyy-MM-dd'),
      valor_investido: '',
      bitcoin: '',
      cotacao: '',
    },
  });

  const valor = watch('valor_investido');
  const cotacao = watch('cotacao');

  // Se mudar o estado de edição, preenche ou reseta
  useEffect(() => {
    if (editingEntry) {
      setValue('data_aporte', editingEntry.date.split('T')[0]);
      setValue('valor_investido', String(editingEntry.amountInvested));
      setValue('bitcoin', String(editingEntry.btcAmount));
      setValue('cotacao', String(editingEntry.exchangeRate));
    } else {
      reset();
    }
  }, [editingEntry]);

  const onSubmit = async (data: any) => {
    if (!user) return;

    const aporte = {
      data_aporte: data.data_aporte,
      valor_investido: parseFloat(data.valor_investido),
      bitcoin: parseFloat(data.bitcoin),
      cotacao: parseFloat(data.cotacao),
      user_id: user.id,
    };

    try {
      if (editingEntry) {
        await supabase.from('aportes').update(aporte).eq('id', editingEntry.id);
        toast({ title: 'Aporte atualizado com sucesso!', className: 'bg-green-500 text-white' });
        onCancelEdit();
      } else {
        await supabase.from('aportes').insert(aporte);
        toast({ title: 'Aporte registrado com sucesso!', className: 'bg-green-500 text-white' });
      }

      reset();
      onAddEntry();
    } catch (error) {
      toast({ title: 'Erro ao registrar o aporte.', variant: 'destructive' });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-gray-900 shadow rounded-2xl px-6 py-6 space-y-4"
    >
      <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
        <span>₿</span> {editingEntry ? 'Editar Aporte' : 'Registrar Novo Aporte'}
      </h2>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label>Data do Aporte</Label>
          <Input type="date" {...register('data_aporte')} className="rounded-xl" required />
        </div>
        <Button
          type="button"
          onClick={() =>
            setValue('data_aporte', format(new Date(), 'yyyy-MM-dd'))
          }
          className="mt-5 rounded-xl"
          variant="outline"
        >
          Hoje
        </Button>
      </div>

      <div>
        <Label>Valor Investido</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('valor_investido')}
          className="rounded-xl"
          required
        />
      </div>

      <div>
        <Label>Quantidade em Bitcoin</Label>
        <Input
          type="number"
          step={displayUnit === 'SATS' ? '1' : '0.00000001'}
          placeholder={displayUnit === 'SATS' ? '0' : '0,00000000'}
          {...register('bitcoin')}
          className="rounded-xl"
          required
        />
      </div>

      <div>
        <div className="flex justify-between items-center">
          <Label>Cotação no momento da compra</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() =>
              setValue('cotacao', String(displayUnit === 'USD' ? currentRate.usd : currentRate.brl))
            }
          >
            Usar cotação atual
          </Button>
        </div>
        <Input
          type="number"
          step="0.01"
          placeholder="0,00"
          {...register('cotacao')}
          className="rounded-xl"
          required
        />
      </div>

      <div className="pt-4 flex gap-4">
        {editingEntry ? (
          <>
            <Button type="submit" className="flex-1 bg-bitcoin text-white rounded-xl py-3">
              Atualizar
            </Button>
            <Button
              type="button"
              onClick={() => {
                reset();
                onCancelEdit();
              }}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="submit" className="w-full bg-bitcoin text-white rounded-xl py-3">
            Registrar
          </Button>
        )}
      </div>
    </form>
  );
};

export default EntryForm;
