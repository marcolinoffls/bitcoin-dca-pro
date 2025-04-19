
/**
 * Página de callback para autenticação OAuth com Google
 * 
 * Esta página é responsável por:
 * 1. Processar o retorno da autenticação do Google
 * 2. Verificar se a sessão foi criada com sucesso
 * 3. Redirecionar para a página principal ou voltar para o login com erro
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Processar a sessão após o redirecionamento do OAuth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          toast({
            title: "Login realizado com sucesso",
            description: "Bem-vindo ao Bitcoin DCA Pro!",
            variant: "default",
          });
          navigate('/', { replace: true });
        } else {
          throw new Error('Sessão não encontrada após autenticação');
        }
      } catch (error: any) {
        console.error('Erro no callback de autenticação:', error);
        toast({
          title: "Erro na autenticação",
          description: "Não foi possível completar o login com Google. Tente novamente.",
          variant: "destructive",
        });
        navigate('/auth', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  // Tela de carregamento enquanto processa o callback
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
    </div>
  );
};

export default AuthCallback;
