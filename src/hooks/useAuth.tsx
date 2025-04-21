
/**
 * Hook de autenticação que gerencia o estado de autenticação do usuário
 * Este hook contém toda a lógica para:
 * 1. Login e logout do usuário
 * 2. Cadastro de novos usuários
 * 3. Detecção de mudanças no estado de autenticação
 * 4. Fornecimento do estado de autenticação para o restante da aplicação
 */
// src/hooks/useAuth.ts

import { createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

import { useAuthSession } from './useAuthSession';
import { useSignIn } from './useSignIn';
import { useSignUp } from './useSignUp';
import { useSignOut } from './useSignOut';
import { usePasswordReset } from './usePasswordReset';

type AuthContextType = {
  /** sessão supabase */
  session: Session | null;
  /** usuário logado */
  user: User | null;
  /** indicador de carregamento */
  loading: boolean;

  /** login com email/senha */
  signIn: (email: string, password: string) => Promise<void>;
  /** cadastro com email/senha */
  signUp: (email: string, password: string) => Promise<void>;
  /** logout */
  signOut: () => Promise<void>;
  /** enviar link de reset de senha */
  resetPassword: (email: string) => Promise<void>;
  /** recupera sessão após callback OAuth (Google, etc.) */
  recoverSessionFromCallback: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // hooks individuais
  const { session, user, loading } = useAuthSession();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut } = useSignOut();
  const { resetPassword } = usePasswordReset();

  // recuperar sessão pós-OAuth
  const recoverSessionFromCallback = async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      console.error('Falha ao recuperar sessão pós-login social:', error);
      return null;
    }

    return data.session.user;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        recoverSessionFromCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
