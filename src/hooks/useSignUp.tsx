
/**
 * Hook para cadastro de usuário
 * 
 * Este hook é responsável por:
 * 1. Realizar o cadastro de novos usuários
 * 2. Tratar erros no processo de cadastro
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSignUp() {
  const { toast } = useToast();

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Verifique seu email para confirmar o cadastro.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { signUp };
}
