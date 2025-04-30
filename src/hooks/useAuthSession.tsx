// src/hooks/useAuthSession.ts

/**
 * Hook para gerenciamento da sessão de autenticação com Supabase
 *
 * Responsabilidades:
 * - Detectar e reagir a mudanças no estado de autenticação (login/logout/update)
 * - Inicializar sessão existente ao carregar o app
 * - Evitar conflitos com fluxos especiais como recuperação de senha
 * - Expor os dados do usuário e sessão para uso global
 */

import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verifica se a URL indica um fluxo de recuperação de senha ou email
    const isConfirmationPage =
      window.location.pathname.includes('reset-password') ||
      window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('type=email_change');

    // Verifica se há tokens na URL
    const hasToken =
      window.location.hash.includes('access_token') ||
      window.location.search.includes('access_token') ||
      window.location.search.includes('token');

    // ⚠️ Se estiver em fluxo de recuperação, evita getSession para não conflitar com tokens da URL
    if (isConfirmationPage && hasToken) {
      setLoading(false);
      return;
    }

    // 📡 Listener que reage a eventos como login/logout/update
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Eventos úteis: SIGNED_IN, SIGNED_OUT, USER_UPDATED, PASSWORD_RECOVERY, etc.

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Notificações para o usuário conforme o tipo de evento
      if (event === 'SIGNED_OUT') {
        toast({
          title: 'Logout efetuado',
          description: 'Você saiu da sua conta com sucesso.',
        });
      }

      if (event === 'USER_UPDATED') {
        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram atualizadas.',
        });
      }

      setLoading(false);
    });

    // 🔄 Recupera a sessão existente (caso exista) ao inicializar o app
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => {
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
      })
      .catch(err => {
        // ❌ Não expõe mensagem detalhada ao usuário final em produção
        console.error('[Supabase] Erro ao recuperar sessão');
        toast({
          title: 'Erro de autenticação',
          description: 'Não foi possível recuperar sua sessão.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return {
    session,
    user,
    loading,
  };
}
