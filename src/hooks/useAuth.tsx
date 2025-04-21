
/**
 * Hook de autenticação que gerencia o estado de autenticação do usuário
 * Este hook contém toda a lógica para:
 * 1. Login e logout do usuário
 * 2. Cadastro de novos usuários
 * 3. Detecção de mudanças no estado de autenticação
 * 4. Fornecimento do estado de autenticação para o restante da aplicação
 */

import { createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useAuthSession } from './useAuthSession';
import { useSignIn } from './useSignIn';
import { useSignUp } from './useSignUp';
import { useSignOut } from './useSignOut';
import { usePasswordReset } from './usePasswordReset';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  recoverSessionFromCallback: () => Promise<User | null>; // novo

};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Compor os hooks individuais
  const { session, user, loading } = useAuthSession();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut } = useSignOut();
  const { resetPassword } = usePasswordReset();

    // ✅ ADICIONE AQUI:
  const recoverSessionFromCallback = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      console.error("Falha ao recuperar sessão pós-login social:", error);
      return null;
    }

    return data.session.user;
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword,
      recoverSessionFromCallback 
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
