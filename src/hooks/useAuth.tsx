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
    console.log('Inicializando provedor de autenticação');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Evento de autenticação detectado:", event);
        
        const isResetPasswordPage = window.location.pathname.includes('reset-password');
        
        if (event !== 'PASSWORD_RECOVERY') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Logout efetuado",
            description: "Você saiu com sucesso.",
          });
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log("Evento de recuperação de senha detectado");
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Perfil atualizado",
            description: "Suas informações foram atualizadas com sucesso.",
          });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: newSession } }) => {
      const isResetPasswordPage = window.location.pathname.includes('reset-password');
      
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

  const resetPassword = async (email: string) => {
    try {
      console.log("=== Início do processo de recuperação de senha ===");
      console.log("Email:", email);
      
      // Configurar URL de redirecionamento
      const baseUrl = window.location.origin;
      const resetRedirectUrl = `${baseUrl}/reset-password`;
      console.log("URL de redirecionamento:", resetRedirectUrl);
  
      // Enviar email de recuperação diretamente, sem verificação prévia por segurança
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl,
      });
  
      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }
  
      console.log("Solicitação de reset enviada com sucesso");
      
      // Mensagem genérica por segurança, não confirmamos se o email existe
      toast({
        title: "Email enviado",
        description: "Se este email estiver cadastrado, você receberá as instruções para redefinir sua senha. Verifique também sua pasta de spam.",
        duration: 6000,
        variant: "success",
      });
  
    } catch (error: any) {
      console.error("=== Erro no processo de recuperação ===");
      console.error("Tipo do erro:", typeof error);
      console.error("Mensagem:", error.message);
      console.error("Erro completo:", error);
  
      let mensagemErro = '';
      
      // Tratamento de erro melhorado, sem revelar se o email existe
      if (error.message?.includes('rate limit')) {
        mensagemErro = 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.';
      } else if (error.message?.includes('Invalid email')) {
        mensagemErro = 'Email inválido. Verifique o endereço informado.';
      } else if (error.message?.includes('SMTP')) {
        mensagemErro = 'Erro no servidor de email. Por favor, tente novamente em alguns minutos.';
        console.error("ERRO CRÍTICO: Falha no SMTP");
      } else {
        mensagemErro = 'Ocorreu um erro inesperado. Tente novamente em alguns minutos.';
      }
  
      toast({
        title: "Não foi possível enviar o email",
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
