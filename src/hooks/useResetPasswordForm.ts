
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

  /**
   * Valida o formato e requisitos da senha
   * Retorna true se a senha for válida, false caso contrário
   */
  const validatePassword = () => {
    setPasswordError('');

    // Verificar se o token é válido
    if (!accessToken) {
      setPasswordError('Link inválido ou expirado. Por favor, solicite uma nova redefinição de senha.');
      return false;
    }
    
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

  /**
   * Verifica se um token parece ser válido por sua estrutura
   * Não garante que o token seja aceito pelo Supabase, apenas checa o formato
   */
  const tokenPareceTerFormatoValido = (token: string): boolean => {
    // Tokens JWT normalmente têm formato específico (3 partes separadas por pontos)
    const partes = token.split('.');
    
    // Verifica se tem 3 partes e se cada parte parece base64
    if (partes.length !== 3) {
      console.log("Token não tem 3 partes separadas por pontos");
      return false;
    }
    
    // Verificação básica de formato
    const formatoBase64Regex = /^[A-Za-z0-9_-]+$/;
    const todasPartesValidam = partes.every(parte => 
      formatoBase64Regex.test(parte) && parte.length > 10
    );
    
    console.log("Validação de formato de token:", todasPartesValidam);
    return todasPartesValidam;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificação básica da senha antes de prosseguir
    if (!validatePassword()) return;
    
    // Verificação de formato do token
    if (!accessToken || !tokenPareceTerFormatoValido(accessToken)) {
      setPasswordError('Link inválido ou expirado. Por favor, solicite uma nova redefinição de senha.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Tentando definir a sessão com o token");
      console.log("Token de acesso recebido:", accessToken ? "Presente (primeiro 10 caracteres: " + accessToken.substring(0, 10) + "...)" : "Ausente");
      
      // Definir a sessão com o token
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
      
      // Atualizar a senha
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        console.error("Erro ao atualizar a senha:", error);
        throw error;
      }
      
      // Senha atualizada com sucesso
      console.log("Senha atualizada com sucesso");
      toast({
        title: "Senha atualizada com sucesso",
        description: "Sua senha foi redefinida. Agora você pode fazer login com sua nova senha.",
        variant: "success",
      });
      
      // Encerrar a sessão atual para garantir que o usuário faça login com a nova senha
      await supabase.auth.signOut();
      
      // Redirecionar para a página de login
      navigate('/auth');
    } catch (error: any) {
      console.error('Erro ao redefinir a senha:', error);
      
      // Tratamento de erros específicos
      let errorMessage = 'Ocorreu um erro ao redefinir a senha. Por favor, tente novamente.';
      
      if (error.message?.includes('JWT') || error.message?.includes('token') || error.message?.includes('expired')) {
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
