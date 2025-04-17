/**
 * usePasswordReset - Hook para recuperação de senha de usuário
 * 
 * Responsabilidades:
 * - Validar o formato do email
 * - Enviar o email de solicitação de redefinição de senha via Supabase
 * - Exibir feedback amigável ao usuário
 * - Tratar e categorizar erros comuns (timeout, SMTP, email inválido etc)
 * 
 * Boas práticas:
 * - Sem logging sensível em produção (proteção à privacidade)
 * - Mensagem genérica para não revelar se o email existe na base
 * - Código modular, fácil de ler e estender
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePasswordReset() {
  // Hook de toast para exibir mensagens amigáveis ao usuário
  const { toast } = useToast();

  /**
   * resetPassword
   * Função principal para acionar o fluxo de recuperação de senha.
   * 
   * @param email - Email do usuário que será enviado o link de recuperação
   */
  const resetPassword = async (email: string) => {
    try {
      // 1. Validação simples do campo de email
      // (pode ser expandida após para validação mais robusta com regex)
      if (!email || !email.includes('@')) {
        throw new Error('Email inválido');
      }

      // 2. Construção da URL de redirecionamento após o reset
      // Esta será usada pelo Supabase para redirecionar o usuário depois de redefinir a senha
      const baseUrl = window.location.origin; // Ex: https://bitcoindcapro.com
      const resetRedirectUrl = `${baseUrl}/reset-password`; // Deve ser mesmo domínio permitido no painel Supabase

      // 3. Função utilitária para adicionar timeout nas promessas
      // Evita que o usuário fique esperando indefinidamente caso o servidor não responda
      const withTimeout = <T>(promise: Promise<T>, ms = 10000) =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout ao enviar email")), ms)
          ),
        ]);

      // 4. Chama o método do Supabase para recuperação de senha, aplicando timeout
      // A resposta não revela se o email existe ou não, por segurança!
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: resetRedirectUrl,
        }),
        10000      // Timeout em milissegundos (10 segundos)
      );

      // 5. Tratamento de possíveis erros no envio de email
      // SMTP: erro de servidor de e-mail
      if (error) {
        if (error.message?.match(/smtp|email|mail/i)) {
          throw new Error('Erro no servidor de email. Nossa equipe foi notificada.');
        }
        throw error;
      }

      // 6. Exibe uma mensagem positiva para o usuário, SEM nunca revelar se o email existe no sistema :)
      toast({
        title: "Solicitação recebida",
        description: "Se este email estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de spam.",
        duration: 8000,
      });

    } catch (error: any) {
      // 7. Mensagem padrão do erro para o usuário
      // Nunca revela informações sensíveis
      let mensagemErro = 'Ocorreu um erro inesperado. Tente novamente em alguns minutos.';

      // Categoriza tipo de erro para resposta mais amigável
      if (error.message === 'Timeout ao enviar email') {
        mensagemErro = 'O servidor está demorando para responder. Tente novamente.';
      } else if (error.message === 'Erro no servidor de email. Nossa equipe foi notificada.') {
        mensagemErro = error.message;
      } else if (error.message === 'Email inválido') {
        mensagemErro = 'Por favor, forneça um email válido.';
      }
      // Outros casos (genérico)

      toast({
        title: "Informação",
        description: mensagemErro,
        variant: "destructive", // Exibe com destaque para erros/críticos
        duration: 8000,
      });

      // Em produção: não loga erros sensíveis no console!
      // Se quiser log em dev: condicione pelo NODE_ENV
      // if (process.env.NODE_ENV === 'development') {
      //   console.error(error);
      // }
    }
  };

  // 8. Expõe a função resetPassword para ser usada nos componentes
  return { resetPassword };
}