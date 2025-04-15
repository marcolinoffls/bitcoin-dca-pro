
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PasswordResetFormProps {
  accessToken: string | null;
  isTokenLoading: boolean;
}

/**
 * Componente de formulário para redefinição de senha
 * Este componente lida com:
 * 1. Validação da nova senha
 * 2. Atualização da senha no Supabase
 * 3. Feedback visual do processo
 */
const PasswordResetForm = ({ accessToken, isTokenLoading }: PasswordResetFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Alterna a visibilidade da senha
  const toggleShowPassword = () => setShowPassword(!showPassword);

  // Valida a senha inserida
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

  // Manipula o envio do formulário de redefinição de senha
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
      
      // Adicionando mais logs para debug
      console.log("Token de acesso recebido:", accessToken ? "Presente" : "Ausente");
      
      // Tente definir a sessão com o token fornecido
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });

      if (sessionError) {
        console.error("Erro ao definir a sessão:", sessionError);
        
        // Tratamento específico para erros de token
        if (sessionError.message?.includes('JWT')) {
          throw new Error('Link expirado. Por favor, solicite uma nova redefinição de senha.');
        }
        throw sessionError;
      }

      console.log("Sessão definida com sucesso, atualizando senha");
      
      // Atualize a senha do usuário
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        console.error("Erro ao atualizar a senha:", error);
        throw error;
      }
      
      // Exiba um toast de sucesso
      toast({
        title: "Senha atualizada com sucesso",
        description: "Sua senha foi redefinida. Agora você pode fazer login com sua nova senha.",
        variant: "success",
      });
      
      // Navegue para a página de autenticação
      navigate('/auth');
    } catch (error: any) {
      console.error('Erro ao redefinir a senha:', error);
      
      // Tratamento de erro melhorado com mensagens mais claras
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

  // Exibir loading enquanto o token está sendo carregado
  if (isTokenLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  // Se não houver token, exibir mensagem de erro amigável
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

  // Renderize o formulário de redefinição de senha
  return (
    <form onSubmit={handleResetPassword}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="new-password" 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 pr-10 rounded-lg"
              disabled={!accessToken || isSubmitting}
              minLength={6}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={toggleShowPassword}
              className="absolute right-0 top-0 h-10 w-10 p-0 text-muted-foreground"
              disabled={!accessToken || isSubmitting}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Esconder senha" : "Mostrar senha"}</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A senha deve ter pelo menos 6 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="confirm-password" 
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="pl-10 pr-10 rounded-lg"
              disabled={!accessToken || isSubmitting}
              minLength={6}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={toggleShowPassword}
              className="absolute right-0 top-0 h-10 w-10 p-0 text-muted-foreground"
              disabled={!accessToken || isSubmitting}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Esconder senha" : "Mostrar senha"}</span>
            </Button>
          </div>
        </div>
        
        {passwordError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full bg-bitcoin hover:bg-bitcoin/90 rounded-lg py-3 mt-4"
          disabled={!accessToken || isSubmitting || !password || !confirmPassword || password.length < 6}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Atualizando...
            </span>
          ) : 'Redefinir Senha'}
        </Button>
      </div>
    </form>
  );
};

export default PasswordResetForm;
