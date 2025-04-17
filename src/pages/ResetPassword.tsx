import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

/**
 * Formulário de redefinição de senha
 * 
 * Props:
 * - accessToken: token da URL para validar redefinição
 * - isTokenLoading: controle de loading do token
 */
export default function PasswordResetForm({
  accessToken,
  isTokenLoading
}: {
  accessToken: string | null;
  isTokenLoading: boolean;
}) {
  const navigate = useNavigate();

  // Estados do formulário
  const [tokenValidated, setTokenValidated] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  // 1. Validação do token recebido da URL junto ao Supabase
  useEffect(() => {
    const validateToken = async () => {
      if (!accessToken) return;
      try {
        const { data, error } = await supabase.auth.getUser(accessToken);
        // Token é válido se encontrar usuário
        setTokenValidated(!!data?.user && !error);
      } catch {
        setTokenValidated(false);
      }
    };
    validateToken();
  }, [accessToken]);

  // 2. Função de submit seguro da senha nova
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    // Validação antes do envio
    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('As senhas não conferem.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Chamada para atualizar senha usando o token do Supabase (segurança garantida)
      const { error } = await supabase.auth.updateUser(
        { password },
        { accessToken }
      );

      if (error) {
        setFormError('Não foi possível redefinir a senha. O link pode ter expirado.');
        setIsSubmitting(false);
        return;
      }

      setFormSuccess(true);
      // Após o sucesso, pode redirecionar para login após alguns segundos, se desejar
      setTimeout(() => {
        navigate('/auth');
      }, 2500);
    } catch {
      setFormError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Render - Loading do token
  if (isTokenLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  // 4. Render - Token inválido ou expirado; não mostra form
  if (!accessToken || !tokenValidated) {
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
          Voltar para o login
        </Button>
      </div>
    );
  }

  // 5. Render - Formulário de redefinição de senha
  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Redefinir Senha</h2>
      {formSuccess ? (
        <Alert variant="success">
          Senha redefinida com sucesso! Você será redirecionado ao login.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Campo nova senha */}
            <div>
              <label htmlFor="new-password" className="block text-sm mb-1 font-medium">
                Nova Senha
              </label>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                className="input w-full rounded p-2 border"
                placeholder="Digite sua nova senha"
                value={password}
                autoComplete="new-password"
                disabled={isSubmitting}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                A senha deve ter pelo menos 6 caracteres.
              </div>
            </div>

            {/* Campo confirmação */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm mb-1 font-medium">
                Confirmar Senha
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="input w-full rounded p-2 border"
                placeholder="Digite novamente a nova senha"
                value={confirmPassword}
                autoComplete="new-password"
                disabled={isSubmitting}
                onChange={e => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {/* Mostrar ou esconder senha */}
            <div>
              <label className="text-xs flex items-center gap-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(v => !v)}
                  disabled={isSubmitting}
                />
                Mostrar senha
              </label>
            </div>
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-bitcoin hover:bg-bitcoin/90 rounded-lg py-3"
            disabled={
              isSubmitting ||
              !password ||
              !confirmPassword ||
              password.length < 6 ||
              password !== confirmPassword
            }
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Atualizando senha...
              </span>
            ) : (
              'Redefinir Senha'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}