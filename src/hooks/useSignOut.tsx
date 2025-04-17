
/**
 * Hook para logout de usuário
 * 
 * Este hook é responsável por:
 * 1. Realizar o logout do usuário
 * 2. Tratar erros no processo de logout
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSignOut() {
  const { toast } = useToast();

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { signOut };
}
