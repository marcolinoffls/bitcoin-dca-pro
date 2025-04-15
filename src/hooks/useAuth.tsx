
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook de autenticação que gerencia o estado de autenticação do usuário
 * Este hook contém toda a lógica para:
 * 1. Login e logout do usuário
 * 2. Cadastro de novos usuários
 * 3. Detecção de mudanças no estado de autenticação
 * 4. Fornecimento do estado de autenticação para o restante da aplicação
 */

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Log para depuração
    console.log('Inicializando provedor de autenticação');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Evento de autenticação detectado:", event);
        
        // Verifique se a URL atual é de redefinição de senha para tratar de forma especial
        const isResetPasswordPage = window.location.pathname.includes('reset-password');
        
        // Não atualize a sessão para PASSWORD_RECOVERY, isso é tratado separadamente
        if (event !== 'PASSWORD_RECOVERY') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        
        // Eventos específicos que exigem feedback visual
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Logout efetuado",
            description: "Você saiu com sucesso.",
          });
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log("Evento de recuperação de senha detectado");
          // Não exibimos toast aqui para não confundir o usuário
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Perfil atualizado",
            description: "Suas informações foram atualizadas com sucesso.",
          });
        }
      }
    );

    // Verificação de sessão existente na inicialização
    supabase.auth.getSession().then(({ data: { session: newSession } }) => {
      const isResetPasswordPage = window.location.pathname.includes('reset-password');
      
      // Em páginas de redefinição de senha com token no hash, não restauramos a sessão
      // para permitir o processamento correto do token
      if (!isResetPasswordPage || !window.location.hash.includes('access_token')) {
        console.log('Sessão recuperada na inicialização:', newSession ? 'Sim' : 'Não');
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login com:', email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('Login bem-sucedido');
      // Sem toast de login bem-sucedido, isso evita conflitos com outras mensagens
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

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

  // Função melhorada para solicitar redefinição de senha
  const resetPassword = async (email: string) => {
    try {
      console.log("Enviando solicitação de redefinição de senha para:", email);
      
      // Obtém a URL base do site atual para garantir que o redirecionamento funcione corretamente
      const baseUrl = window.location.origin;
      const resetRedirectUrl = `${baseUrl}/reset-password`;
      
      console.log("URL de redirecionamento configurada:", resetRedirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl,
      });
      
      if (error) {
        console.error("Erro na API do Supabase:", error);
        throw error;
      }
      
      // Exibe mensagem de sucesso se não houver erros
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha. Lembre-se de verificar a pasta de spam caso não encontre o email.",
        variant: "success", // Usar variante de sucesso para destacar a mensagem positiva
      });
    } catch (error: any) {
      console.error("Erro completo ao enviar email de redefinição:", error);
      
      // Tratamento de erros melhorado com mensagens mais amigáveis
      let mensagemErro = '';
      
      if (!error.message || error.message === '{}' || error.message === '!') {
        // Para erros com mensagens vazias ou inválidas
        mensagemErro = 'Ocorreu um erro ao enviar o email de redefinição. Por favor, verifique se o email está correto e tente novamente.';
      } else if (error.message.includes('rate limit')) {
        // Para erros de limite de taxa
        mensagemErro = 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.';
      } else if (error.message.includes('Unable to validate email address')) {
        // Para erros de validação de email
        mensagemErro = 'Email inválido. Por favor, verifique se o endereço está correto.';
      } else if (error.message.includes('not found')) {
        // Caso específico de email não encontrado
        mensagemErro = 'Email não encontrado. Verifique se digitou corretamente ou crie uma nova conta.';
      } else {
        // Para outros erros com mensagem válida
        mensagemErro = error.message;
      }
      
      toast({
        title: "Erro ao enviar email",
        description: mensagemErro,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
