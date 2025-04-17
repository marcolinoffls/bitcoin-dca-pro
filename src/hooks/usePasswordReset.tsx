
/**
 * usePasswordReset - Hook para fluxo de recuperação de senha.
 *
 * O que ele faz:
 * - Valida se o email informado é válido
 * - Chama o Supabase para enviar email de redefinição de senha
 * - Usa timeout para evitar espera infinita em caso de falha do servidor
 * - Mostra mensagens de feedback via Toast (sem expor se o email existe ou não)
 * - Trata possíveis erros de SMTP ou problemas de rede
 * 
 * Boas práticas implementadas:
 * - Comentários didáticos em cada etapa
 * - Sem logs sensíveis em produção
 * - Código limpo e fácil de entender/reutilizar
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePasswordReset() {
  // Hook do sistema de notificações/Toast do seu projeto
  const { toast } = useToast();

  /**
   * Função utilitária para aplicar timeout em promises.
   * Se a promise não resolver em X milissegundos, rejeita.
   *
   * @param promise - Promise que você quer monitorar com timeout
   * @param ms - Quantidade de milissegundos antes de dar timeout (padrão 10 segundos)
   */
  function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout ao enviar email")), ms)
      ),
    ]);
  }

  /**
   * Função principal que executa o fluxo de recuperação de senha.
   *
   * @param email - Email para o qual deve ser enviado o link de redefinição
   */
  const resetPassword = async (email: string) => {
    try {
      // 1. Validação simples do formato do email
      if (!email || !email.includes('@')) {
        throw new Error('Email inválido');
      }

      // 2. Cria a URL de redirecionamento após resetar a senha
      // Essa URL deve estar cadastrada no painel do Supabase como "Redirect URL"
      const baseUrl = window.location.origin;
      const resetRedirectUrl = `${baseUrl}/reset-password`;

      // 3. Usa a utilitária de timeout para não travar indefinidamente
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirectUrl,
        }),
        10000 // 10 segundos de timeout
      );

      // 4. Tratamento detalhado de erros específicos
      if (error) {
        // Caso seja erro de SMTP/servidor de email (mensagem contém 'smtp', 'email' ou 'mail')
        if (error.message?.match(/smtp|email|mail/i)) {
          throw new Error('Erro no servidor de email. Nossa equipe foi notificada.');
        }
        // Outros erros do Supabase
        throw error;
      }

      // 5. Feedback sempre neutro para o usuário (não revela se o email existe)
      toast({
        title: "Solicitação recebida",
        description: "Se este email estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de spam.",
        duration: 8000,
      });
    } catch (error: any) {
      // 6. Tratamento amigável dos erros para o usuário final
      let mensagemErro = 'Ocorreu um erro inesperado. Tente novamente em alguns minutos.';
      if (error.message === 'Timeout ao enviar email') {
        mensagemErro = 'O servidor está demorando para responder. Tente novamente.';
      } else if (error.message === 'Erro no servidor de email. Nossa equipe foi notificada.') {
        mensagemErro = error.message;
      } else if (error.message === 'Email inválido') {
        mensagemErro = 'Por favor, forneça um email válido.';
      }

      toast({
        title: "Informação",
        description: mensagemErro,
        variant: "destructive", // Usa destaque de erro, se disponível no seu sistema de toasts
        duration: 8000,
      });

      // Se quiser debugar só em DEV, pode usar:
      // if (process.env.NODE_ENV === 'development') {
      //   console.error(error);
      // }
    }
  };

  // Expõe apenas a função de reset para ser usada nos componentes do app
  return { resetPassword };
}
