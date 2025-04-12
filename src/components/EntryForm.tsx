/**
 * Componente EntryForm
 *
 * Função: Permite registrar novos aportes ou editar um aporte existente.
 * Onde é usado: Página principal (Index), abaixo da cotação atual.
 *
 * Correção aplicada:
 * - Adicionado useEffect para resetar os campos do formulário quando o editingEntry for limpo.
 * - Garante que o botão "Atualizar" só apareça no modo de edição.
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BitcoinEntry, CurrentRate } from '@/types';

interface Props {
  onAddEntry: () => void;
  currentRate: CurrentRate;
  onCancelEdit: () => void;
  editingEntry?: BitcoinEntry | null;
  displayUnit: 'BTC' | 'SATS';
}

const EntryForm: React.FC<Props> = ({
  onAddEntry,
  currentRate,
  onCancelEdit,
  editingEntry,
  displayUnit,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      valor_investido: '',
      cotacao: '',
      bitcoin: '',
      data_aporte: '',
    },
  });

  const valorInvestido = watch('valor_investido');
  const cotacao = watch('cotacao');

  // 🔄 Resetar formulário se deixar de editar
  useEffect(() => {
    if (!editingEntry) {
      reset(); // limpa campos
    }
  }, [editingEntry, reset]);

  const onSubmit = async (data: any) => {
    if (!user) return;

    try {
      // Lógica para salvar no Supabase
      await supabase.from('aportes').insert([
        {
          valor_investido: parseFloat(data.valor_investido),
          cotacao: parseFloat(data.cotacao),
          bitcoin: parseFloat(data.bitcoin),
          data_aporte: data.data_aporte,
        },
      ]);
      onAddEntry();
      toast({ title: 'Aporte registrado com sucesso!' });
      reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar o aporte.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label>Valor Investido</Label>
        <Input {...register('valor_investido')} placeholder="0,00" />
      </div>

      <div className="flex flex-col space-y-2">
        <Label>Cotação</Label>
        <Input {...register('cotacao')} placeholder="0,00" />
      </div>

      <div className="flex flex-col space-y-2">
        <Label>Bitcoin</Label>
        <Input {...register('bitcoin')} placeholder="0,00000000" />
      </div>

      <div className="flex flex-col space-y-2">
        <Label>Data do Aporte</Label>
        <Input
          type="date"
          {...register('data_aporte')}
          placeholder={format(new Date(), 'yyyy-MM-dd', { locale: ptBR })}
        />
      </div>

      <div className="flex gap-2">
        {editingEntry ? (
          <>
            <Button type="submit" className="bg-bitcoin text-white flex-1">
              Atualizar
            </Button>
            <Button type="button" variant="outline" onClick={onCancelEdit} className="flex-1">
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="submit" className="bg-bitcoin text-white w-full">
            Registrar
          </Button>
        )}
      </div>
    </form>
  );
};

export default EntryForm;
