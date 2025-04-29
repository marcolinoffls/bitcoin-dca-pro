/**
 * Hook para logout de usuário com verificação de sessão
 * 
 * Este hook:
 * 1. Verifica se o usuário ainda tem sessão ativa
 * 2. Executa o logout de forma segura
 * 3. Trata erros comuns, como sessão expirada
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSignOut() {
  const { toast } = useToast();

  const signOut = async () => {
    try {
      // Verifica se ainda existe uma sessão válida
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: 'Sessão já finalizada',
          description: 'Você já está deslogado.',
        });
        return;
      }

      // Tenta realizar o logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('✅ Logout realizado com sucesso');

    } catch (error: any) {
      const message = error?.message?.toLowerCase?.() || '';

      if (message.includes('session_not_found')) {
        toast({
          title: 'Sessão não encontrada',
          description: 'Sua sessão expirou ou já foi encerrada. Recarregue a página se necessário.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao sair',
          description: error.message,
          variant: 'destructive',
        });
      }

      console.error('❌ Erro no logout:', error);
    }
  };

  return { signOut };
}
