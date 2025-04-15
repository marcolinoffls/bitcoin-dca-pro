
import { useState } from 'react';
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

  const validatePassword = () => {
    setPasswordError('');
    
    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    if (!accessToken) {
      setPasswordError('Link inválido ou expirado. Por favor, solicite uma nova redefinição de senha.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Tentando definir a sessão com o token");
      console.log("Token de acesso recebido:", accessToken ? "Presente" : "Ausente");
      
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });

      if (sessionError) {
        console.error("Erro ao definir a sessão:", sessionError);
        
        if (sessionError.message?.includes('JWT')) {
          throw new Error('Link expirado. Por favor, solicite uma nova redefinição de senha.');
        }
        throw sessionError;
      }

      console.log("Sessão definida com sucesso, atualizando senha");
      
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        console.error("Erro ao atualizar a senha:", error);
        throw error;
      }
      
      toast({
        title: "Senha atualizada com sucesso",
        description: "Sua senha foi redefinida. Agora você pode fazer login com sua nova senha.",
        variant: "success",
      });
      
      navigate('/auth');
    } catch (error: any) {
      console.error('Erro ao redefinir a senha:', error);
      
      let errorMessage = 'Ocorreu um erro ao redefinir a senha. Por favor, tente novamente.';
      
      if (error.message?.includes('JWT') || error.message?.includes('token')) {
        errorMessage = 'Link expirado ou inválido. Por favor, solicite uma nova redefinição de senha.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.';
      } else if (error.message?.includes('User not found') || error.message?.includes('Invalid user')) {
        errorMessage = 'Usuário não encontrado. O link pode ter expirado.';
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
