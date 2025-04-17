
/**
 * Hook para login de usuário
 * 
 * Este hook é responsável por:
 * 1. Realizar o login do usuário com e-mail e senha
 * 2. Tratar erros de autenticação
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSignIn() {
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login com:', email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('Login bem-sucedido');
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { signIn };
}
