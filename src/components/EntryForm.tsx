/**
 * Componente EntryForm
 *
 * Função: Formulário principal para registrar um novo aporte de Bitcoin.
 * - Quando `editingEntry` está presente, entra no modo de edição.
 * - Caso contrário, registra um novo aporte no Supabase.
 *
 * Onde é usado: Página principal (Index).
 *
 * Integrações:
 * - Supabase: insere novo registro na tabela `aportes`.
 * - Props:
 *   - editingEntry: usado para entrar no modo edição
 *   - onCancelEdit: função para cancelar a edição
 *   - onAddEntry: callback após adicionar
 *   - currentRate: cotação atual do Bitcoin
 *   - displayUnit: unidade exibida (BTC ou SATS)
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BitcoinEntry, CurrentRate } from '@/types';
import { format } from 'date-fns';

interface EntryFormProps {
  onAddEntry: () => void;
  onCancelEdit: () => void;
  editingEntry?: BitcoinEntry | null;
  currentRate: CurrentRate;
  displayUnit: 'BTC' | 'SATS';
}

const EntryForm: React.FC<EntryFormProps> = ({
  onAddEntry,
  onCancelEdit,
  editingEntry,
  currentRate,
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
      data_aporte: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const valorInvestido = watch('valor_investido');
  const cotacao = watch('cotacao');

  // 🔄 Sempre que sair do modo de edição, limpa o formulário
  useEffect(() => {
    if (!editingEntry) {
      reset();
    }
  }, [editingEntry, reset]);

  // Envia os dados para o Supabase
  const onSubmit = async (data: any) => {
    if (!user) return;

    try {
      await supabase.from('aportes').insert([
        {
          valor_investido: parseFloat(data.valor_investido),
          cotacao: parseFloat(data.cotacao),
          bitcoin: parseFloat(data.bitcoin),
          data_aporte: data.data_aporte,
        },
      ]);

      toast({
        title: 'Aporte registrado com sucesso!',
        className: 'bg-green-500 text-white',
      });

      reset();
      onAddEntry();
    } catch (error) {
      toast({
        title: 'Erro ao registrar aporte',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-6 space-y-4"
    >
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="valor_investido">Valor Investido</Label>
        <Input
          id="valor_investido"
          placeholder="0,00"
          {...register('valor_investido')}
          className="rounded-xl"
          required
        />
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="cotacao">Cotação (R$)</Label>
        <Input
          id="cotacao"
          placeholder="0,00"
          {...register('cotacao')}
          className="rounded-xl"
          required
        />
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="bitcoin">{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</Label>
        <Input
          id="bitcoin"
          placeholder={displayUnit === 'SATS' ? '0' : '0,00000000'}
          {...register('bitcoin')}
          className="rounded-xl"
          required
        />
      </div>

      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="data_aporte">Data do Aporte</Label>
        <Input
          type="date"
          id="data_aporte"
          {...register('data_aporte')}
          className="rounded-xl"
          required
        />
      </div>

      {/* Botões de ação */}
      <div className="flex gap-4 pt-2">
        {editingEntry ? (
          <>
            <Button
              type="submit"
              className="flex-1 bg-bitcoin hover:bg-bitcoin/90 text-white rounded-xl py-2"
            >
              Atualizar
            </Button>
            <Button
              type="button"
              onClick={onCancelEdit}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            className="w-full bg-bitcoin hover:bg-bitcoin/90 text-white rounded-xl py-3"
          >
            Registrar
          </Button>
        )}
      </div>
    </form>
  );
};

export default EntryForm;
