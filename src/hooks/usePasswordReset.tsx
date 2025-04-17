
/**
 * Hook para recuperação de senha
 * 
 * Este hook é responsável por:
 * 1. Enviar emails de recuperação de senha
 * 2. Validar formato de email
 * 3. Tratar erros do processo de recuperação
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function usePasswordReset() {
  const { toast } = useToast();

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
      
      // Corrigindo: Remover a propriedade 'options' não suportada
      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetRedirectUrl,
      });
  
      // Corrigindo: Extrair corretamente a propriedade 'error' do resultado
      const result = await Promise.race([resetPromise, timeoutPromise]) as any;
      const error = result?.error;
  
      // Log da resposta completa
      console.log("Resposta completa do Supabase:", {
        data: result?.data ? "Dados presentes" : "Sem dados",
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

  return { resetPassword };
}
