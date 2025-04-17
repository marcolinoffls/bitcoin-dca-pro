
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
    
    // Detectar se estamos na página de redefinição de senha ou confirmação de email
    const isConfirmationPage = window.location.pathname.includes('reset-password') || 
                              window.location.hash.includes('type=recovery') ||
                              window.location.hash.includes('type=email_change');
    
    const hasToken = window.location.hash.includes('access_token') || 
                    window.location.search.includes('access_token') || 
                    window.location.search.includes('token');
    
    // Se estamos na página de redefinição/confirmação e tem token na URL, não carregamos a sessão 
    // para não interferir no fluxo de redefinição/confirmação
    if (isConfirmationPage && hasToken) {
      console.log('Página de confirmação com token detectada. Não carregando sessão automática.');
      setLoading(false);
      return;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Evento de autenticação detectado:", event);
        
        // Para eventos de recuperação de senha ou mudança de email, não atualizamos a sessão
        // para evitar conflitos com o fluxo de redefinição
        if (event === 'PASSWORD_RECOVERY' || event === 'EMAIL_CHANGE') {
          console.log("Evento de recuperação de senha ou mudança de email detectado");
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
        } else if (event === 'EMAIL_CHANGE') {
          toast({
            title: "Email alterado",
            description: "Seu email foi alterado com sucesso.",
            variant: "default",
          });
        }
        
        setLoading(false);
      }
    );

    // Apenas carregar a sessão se não estivermos na página de redefinição/confirmação com token
    if (!isConfirmationPage || !hasToken) {
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
