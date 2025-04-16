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
    
    const signUp = async (email: string, password: string) => {
      try {
        console.log('Iniciando processo de signup para:', email);
        
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        
        if (error) {
          console.error('Erro no signup:', error);
          throw error;
        }
    
        console.log('Resposta do signup:', data);
        
        // Verifica se o usuário foi criado mas precisa confirmar email
        if (data?.user && !data.user.confirmed_at) {
          toast({
            title: "Cadastro realizado com sucesso",
            description: "Verifique seu email para confirmar o cadastro. Pode levar alguns minutos e não esqueça de verificar sua caixa de spam.",
            duration: 6000,
          });
        }
      } catch (error: any) {
        console.error('Erro detalhado:', error);
        
        let mensagemErro = 'Erro ao criar conta. ';
        if (error.message.includes('Email rate limit exceeded')) {
          mensagemErro += 'Muitas tentativas. Aguarde alguns minutos.';
        } else if (error.message.includes('User already registered')) {
          mensagemErro += 'Este email já está cadastrado.';
        } else if (error.message.includes('Authentication failed')) {
          mensagemErro += 'Falha no servidor de email. Contate o suporte.';
        } else {
          mensagemErro += error.message;
        }
    
        toast({
          title: "Erro no cadastro",
          description: mensagemErro,
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
      console.log("Enviando solicitação de redefinição de senha para:", email);
      
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
      
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha. Lembre-se de verificar a pasta de spam caso não encontre o email.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro completo ao enviar email de redefinição:", error);
      
      let mensagemErro = '';
      
      if (!error.message || error.message === '{}' || error.message === '!') {
        mensagemErro = 'Ocorreu um erro ao enviar o email de redefinição. Por favor, verifique se o email está correto e tente novamente.';
      } else if (error.message.includes('rate limit')) {
        mensagemErro = 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.';
      } else if (error.message.includes('Unable to validate email address')) {
        mensagemErro = 'Email inválido. Por favor, verifique se o endereço está correto.';
      } else if (error.message.includes('not found')) {
        mensagemErro = 'Email não encontrado. Verifique se digitou corretamente ou crie uma nova conta.';
      } else if (error.message.includes('Authentication failed') || error.message.includes('Bad username / password')) {
        mensagemErro = 'Problema com o servidor de email. Por favor, entre em contato com o suporte informando este erro: "Falha na configuração SMTP".';
      } else {
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
