
/**
 * Hook para gerenciamento de sessão do usuário
 * 
 * Este hook é responsável por:
 * 1. Detectar mudanças no estado de autenticação
 * 2. Inicializar a sessão do usuário
 * 3. Fornecer acesso ao estado da sessão atual
 */

// src/hooks/useAuthSession.ts
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast }             = useToast();

  useEffect(() => {
    console.log('🔄 Inicializando sessão de autenticação');

    const isConfirmationPage = 
      window.location.pathname.includes('reset-password') ||
      window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('type=email_change');

    const hasToken =
      window.location.hash.includes('access_token') ||
      window.location.search.includes('access_token') ||
      window.location.search.includes('token');

    // Se estamos no fluxo de reset/email-change COM token, não autocarrega sessão
    if (isConfirmationPage && hasToken) {
      console.log('Fluxo de confirmação detectado — pulando getSession');
      setLoading(false);
      return;
    }

    // Listener de mudanças de auth (login, logout, atualização)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Evento auth:', event, newSession);

      if (event === 'PASSWORD_RECOVERY') {
        setLoading(false);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        toast({ title: 'Logout efetuado', description: 'Você saiu com sucesso.' });
      } else if (event === 'USER_UPDATED' /* ou 'USER_EMAIL_UPDATE' */) {
        toast({ title: 'Perfil atualizado', description: 'Informações atualizadas.' });
      }

      setLoading(false);
    });

    // Recuperação inicial de sessão
    supabase.auth
      .getSession()
      .then(({ data: { session: newSession } }) => {
        console.log('Sessão recuperada:', !!newSession);
        setSession(newSession);
        setUser(newSession?.user ?? null);
      })
      .catch(err => {
        console.error('Erro ao getSession:', err);
        toast({ variant: 'destructive', title: 'Erro de sessão', description: err.message });
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return { session, user, loading };
}
