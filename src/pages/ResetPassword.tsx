
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ResetPasswordHeader from '@/components/auth/ResetPasswordHeader';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

/**
 * Página que o usuário acessa ao clicar no link de redefinição de senha.
 * O link enviado pelo Supabase (PKCE) tem a forma:
 *   /reset-password?code=<AUTH_CODE>&type=recovery
 *
 * Passos:
 * 1.  Lê o parâmetro ?code.
 * 2.  Usa supabase.auth.exchangeCodeForSession(code) → cria sessão automaticamente.
 * 3.  Se deu certo, exibe o formulário para o usuário definir uma nova senha.
 */
export default function ResetPassword() {
  const { search } = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);   // Spinner enquanto valida link
  const [isValid, setIsValid] = useState<boolean>();  // true/false após validação

  /** Efetua a troca do código PKCE pela sessão */
  useEffect(() => {
    const run = async () => {
      setIsLoading(true);

      const params = new URLSearchParams(search);
      const code = params.get('code');

      if (!code) {               // ✅  nova condição
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // Token pode ter sido consumido no preview do e‑mail.
        const sess = (await supabase.auth.getSession()).data.session;
        if (sess) {
          navigate('/set-password', { replace: true });
          return;                 // encerra a função aqui
        }
        setIsValid(false);        // não há sessão -> mostra alerta
      } else {
        // Sessão criada agora -> segue para definir senha
        navigate('/set-password', { replace: true });
        return;                   // encerra para não rodar setIsLoading depois
      }
      
      setIsLoading(false);  // executa apenas se não houve redirect acima
    };

    run();
  }, [search, navigate]);

  /** UI para link inválido / expirado */
  const ErrorState = () => (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Link expirado ou inválido. Solicite uma nova redefinição.
        </AlertDescription>
      </Alert>

      <Button onClick={() => navigate('/auth')} className="w-full" variant="outline">
        Voltar para login
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <ResetPasswordHeader />

          <div className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500" />
              </div>
            ) : isValid ? (
              <PasswordResetForm isTokenLoading={isLoading} />
            ) : (
              <ErrorState />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
