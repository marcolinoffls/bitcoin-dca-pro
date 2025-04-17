
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';
import { PasswordField } from './PasswordField';
import { FormError } from './FormError';

/**
 * Formulário de redefinição de senha
 * 
 * Este componente é responsável por:
 * 1. Receber o token validado de ResetPassword.tsx
 * 2. Exibir campos para nova senha
 * 3. Validar e processar a alteração de senha
 * 4. Mostrar feedback visual do processo
 */
interface PasswordResetFormProps {
  accessToken: string | null;
  isTokenLoading: boolean;
}

const PasswordResetForm = ({ accessToken, isTokenLoading }: PasswordResetFormProps) => {
  const navigate = useNavigate();
  
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

  // Verificar se as senhas são iguais
  const passwordsMatch = password === confirmPassword;
  const passwordMinLength = password.length >= 8;
  const confirmError = confirmPassword && !passwordsMatch ? 'As senhas não coincidem' : '';

  // Exibir loading enquanto o token está sendo carregado
  if (isTokenLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  // Se o token não for válido, exibir mensagem de erro
  if (!accessToken) {
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

  // Exibir formulário de redefinição de senha
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
          hint="A senha deve ter pelo menos 8 caracteres, incluir maiúsculas, minúsculas, número e símbolo"
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
