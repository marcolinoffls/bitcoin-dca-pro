
/**
 * Hook para gerenciamento de sessão do usuário
 * 
 * Este hook é responsável por:
 * 1. Detectar mudanças no estado de autenticação
 * 2. Inicializar a sessão do usuário
 * 3. Fornecer acesso ao estado da sessão atual
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
    console.log('Inicializando sessão de autenticação');
    
    // Detectar se estamos na página de redefinição de senha
    const isResetPasswordPage = window.location.pathname.includes('reset-password');
    const hasAccessToken = window.location.hash.includes('access_token') || 
                           window.location.search.includes('access_token') || 
                           window.location.search.includes('token');
    
    // Se estamos na página de redefinição e tem token na URL, não carregamos a sessão 
    // para não interferir no fluxo de redefinição
    if (isResetPasswordPage && hasAccessToken) {
      console.log('Página de redefinição de senha com token detectada. Não carregando sessão automática.');
      setLoading(false);
      return;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Evento de autenticação detectado:", event);
        
        // Para eventos de recuperação de senha, não atualizamos a sessão
        // para evitar conflitos com o fluxo de redefinição
        if (event === 'PASSWORD_RECOVERY') {
          console.log("Evento de recuperação de senha detectado");
          setLoading(false);
          return;
        }
        
        // Para outros eventos, atualizamos a sessão normalmente
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Feedback para o usuário
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Logout efetuado",
            description: "Você saiu com sucesso.",
          });
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Perfil atualizado",
            description: "Suas informações foram atualizadas com sucesso.",
          });
        }
        
        setLoading(false);
      }
    );

    // Apenas carregar a sessão se não estivermos na página de redefinição com token
    if (!isResetPasswordPage || !hasAccessToken) {
      supabase.auth.getSession().then(({ data: { session: newSession } }) => {
        console.log('Sessão recuperada na inicialização:', newSession ? 'Sim' : 'Não');
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, [toast]);

  return { session, user, loading };
}
