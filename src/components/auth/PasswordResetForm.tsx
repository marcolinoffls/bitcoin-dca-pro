
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';
import { PasswordField } from './PasswordField';
import { FormError } from './FormError';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Formulário de redefinição de senha
 * 
 * Este componente é responsável por:
 * 1. Validar o token recebido com o Supabase
 * 2. Exibir campos para nova senha somente se o token for válido
 * 3. Validar e processar a alteração de senha
 * 4. Mostrar feedback visual do processo
 */
interface PasswordResetFormProps {
  accessToken: string | null;
  isTokenLoading: boolean;
}

const PasswordResetForm = ({ accessToken, isTokenLoading }: PasswordResetFormProps) => {
  const navigate = useNavigate();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    passwordError,
    handleResetPassword
  } = useResetPasswordForm(accessToken);

  // Validar o token no Supabase antes de mostrar o formulário
  useEffect(() => {
    const validateTokenWithSupabase = async () => {
      if (!accessToken) {
        setIsTokenValid(false);
        setIsValidating(false);
        return;
      }

      try {
        console.log("Validando token com Supabase...");
        const { data, error } = await supabase.auth.getUser(accessToken);
        
        if (error || !data.user) {
          console.error("Erro ao validar token:", error?.message);
          setIsTokenValid(false);
        } else {
          console.log("Token validado com sucesso!");
          setIsTokenValid(true);
        }
      } catch (error) {
        console.error("Exceção ao validar token:", error);
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    if (accessToken) {
      validateTokenWithSupabase();
    } else {
      setIsTokenValid(false);
      setIsValidating(false);
    }
  }, [accessToken]);

  // Verificar se as senhas são iguais
  const passwordsMatch = password === confirmPassword;
  const passwordMinLength = password.length >= 6;
  const confirmError = confirmPassword && !passwordsMatch ? 'As senhas não coincidem' : '';

  // Exibir loading enquanto o token está sendo carregado ou validado
  if (isTokenLoading || isValidating) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  // Se o token não for válido, exibir mensagem de erro
  if (!accessToken || !isTokenValid) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Link inválido ou expirado. Por favor, solicite uma nova redefinição de senha.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={() => navigate('/auth')}
          className="w-full bg-bitcoin hover:bg-bitcoin/90 rounded-lg py-3"
        >
          Voltar para a página de login
        </Button>
      </div>
    );
  }

  // Exibir formulário de redefinição de senha apenas se o token for válido
  return (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div className="space-y-4">
        <PasswordField
          id="new-password"
          label="Nova Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          disabled={isSubmitting}
          hint="A senha deve ter pelo menos 6 caracteres"
        />

        <PasswordField
          id="confirm-password"
          label="Confirmar Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          disabled={isSubmitting}
          error={confirmError}
        />
        
        {passwordError && <FormError message={passwordError} />}

        <Button 
          type="submit" 
          className="w-full bg-bitcoin hover:bg-bitcoin/90 rounded-lg py-3 mt-6"
          disabled={isSubmitting || !password || !passwordMinLength || !confirmPassword || !passwordsMatch}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Atualizando senha...
            </span>
          ) : 'Redefinir Senha'}
        </Button>
      </div>
    </form>
  );
};

export default PasswordResetForm;
