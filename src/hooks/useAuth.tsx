
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
      console.log("Ambiente:", process.env.NODE_ENV);
      
      // Validar email antes de tentar enviar
      if (!email || !email.includes('@')) {
        console.error("Email inválido fornecido:", email);
        throw new Error('Email inválido');
      }
  
      // Verificar se o email existe na base antes de tentar resetar
      console.log("Verificando se o email existe na base de dados...");
      const { data: signInCheck, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
      
      console.log("Resultado da verificação de email:", 
        signInError ? `Erro: ${signInError.message}` : "Email verificado");
      
      // Configurar URL de redirecionamento com log detalhado
      const baseUrl = window.location.origin;
      const resetRedirectUrl = `${baseUrl}/reset-password`;
      console.log("URL de redirecionamento completa:", resetRedirectUrl);
      
      // Log das configurações de email (para debug)
      console.log("Configurações do processo de reset:");
      console.log("- URL de redirecionamento:", resetRedirectUrl);
      console.log("- Provedor SMTP configurado:", Boolean(process.env.SUPABASE_SMTP));
      
      // Adicionar timeout para evitar espera infinita
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error("Timeout atingido ao tentar enviar email");
          reject(new Error('Timeout ao enviar email'));
        }, 10000);
      });
  
      console.log("Iniciando tentativa de envio com timeout de 10s");
      
      // Opções melhoradas para o reset de senha
      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl,
        options: {
          data: {
            email_subject: 'Recuperação de Senha - Bitcoin DCA Pro',
            email_template: 'reset-password'
          }
        }
      });
  
      const { data, error } = await Promise.race([resetPromise, timeoutPromise]);
  
      // Log da resposta completa
      console.log("Resposta completa do Supabase:", {
        data: data ? "Dados presentes" : "Sem dados",
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : "Sem erros"
      });
      
      if (error) {
        console.error("=== Detalhes do erro do Supabase ===");
        console.error("Código:", error.status);
        console.error("Mensagem:", error.message);
        console.error("Detalhes:", error.details);
        
        // Verificar se é erro de SMTP
        if (error.message?.includes('SMTP') || error.message?.includes('email') || error.message?.includes('mail')) {
          console.error("ERRO DETECTADO NO SISTEMA DE EMAIL");
          throw new Error('Erro no servidor de email. Nossa equipe foi notificada.');
        }
        
        throw error;
      }
  
      console.log("=== Solicitação de reset concluída com sucesso ===");
      
      toast({
        title: "Solicitação recebida",
        description: "Se este email estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de spam.",
        duration: 8000,
      });
  
    } catch (error: any) {
      console.error("=== Erro detalhado do processo ===");
      console.error("Tipo:", typeof error);
      console.error("Nome:", error.name);
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);
  
      let mensagemErro = '';
      if (error.message === 'Timeout ao enviar email') {
        mensagemErro = 'O servidor está demorando para responder. Tente novamente.';
      } else if (error.message?.includes('SMTP') || error.message === 'Erro no servidor de email. Nossa equipe foi notificada.') {
        mensagemErro = 'Erro no servidor de email. Nossa equipe foi notificada.';
        console.error("ERRO CRÍTICO SMTP:", error);
      } else if (error.message === 'Email inválido') {
        mensagemErro = 'Por favor, forneça um email válido.';
      } else if (error.message?.includes('not found') || error.message?.includes('não encontrado')) {
        // Por segurança, não revelamos se o email existe ou não
        mensagemErro = 'Se este email estiver cadastrado, você receberá as instruções em breve.';
      } else if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
        mensagemErro = 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.';
      } else {
        mensagemErro = 'Ocorreu um erro inesperado. Tente novamente em alguns minutos.';
      }
  
      toast({
        title: "Informação",
        description: mensagemErro,
        variant: "destructive",
        duration: 8000,
      });
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
