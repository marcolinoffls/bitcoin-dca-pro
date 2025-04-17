import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook personalizado para gerenciar o formulário de redefinição de senha
 * 
 * Este hook contém:
 * 1. Estados do formulário (senha, confirmação, erros)
 * 2. Lógica de validação
 * 3. Lógica de submissão e atualização da senha
 */
export const useResetPasswordForm = (accessToken: string | null) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Valida o formato e requisitos da senha
   * Retorna true se a senha for válida, false caso contrário
   */
  const validatePassword = () => {
    setPasswordError('');
    
    // Verificar comprimento mínimo
    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    // Verificar correspondência entre senha e confirmação
    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return false;
    }
    
    // Senha válida
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação básica da senha antes de prosseguir
    if (!validatePassword()) return;
    
    // Verificar se temos o token de acesso
    if (!accessToken) {
      setPasswordError('Token de redefinição ausente ou inválido. Por favor, solicite uma nova redefinição de senha.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Iniciando processo de redefinição de senha");
      
      // Correção: passar o token corretamente para updateUser
      const { error } = await supabase.auth.updateUser(
        { password: password },
        // Remove o objeto de opções com token
        { redirectTo: `${window.location.origin}/auth` }
      );
      
      if (error) {
        console.error("Erro ao atualizar senha:", error.message);
        throw error;
      }
      
      // Senha atualizada com sucesso
      console.log("Senha atualizada com sucesso");
      toast({
        title: "Senha atualizada com sucesso",
        description: "Sua senha foi redefinida. Agora você pode fazer login com sua nova senha.",
        variant: "default",
      });
      
      // Encerrar a sessão atual para garantir que o usuário faça login com a nova senha
      await supabase.auth.signOut();
      
      // Redirecionar para a página de login
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao redefinir a senha:', error);
      
      // Tratamento de erros específicos
      let errorMessage = 'Ocorreu um erro ao redefinir a senha. Por favor, tente novamente.';
      
      if (error.message?.includes('JWT') || 
          error.message?.includes('token') || 
          error.message?.includes('expired') || 
          error.message?.includes('invalid')) {
        errorMessage = 'Link expirado ou inválido. Por favor, solicite uma nova redefinição de senha.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.';
      } else if (error.message?.includes('User not found') || error.message?.includes('Invalid user')) {
        errorMessage = 'Usuário não encontrado. O link pode ter expirado.';
      } else if (error.message?.includes('stronger password') || error.message?.includes('Password should')) {
        errorMessage = 'A senha não atende aos requisitos de segurança. Use uma combinação de letras, números e caracteres especiais.';
      } else if (error.message && error.message !== '{}' && error.message !== '!') {
        errorMessage = error.message;
      }
      
      setPasswordError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    passwordError,
    handleResetPassword
  };
};
