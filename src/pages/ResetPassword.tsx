
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import ResetPasswordHeader from '@/components/auth/ResetPasswordHeader';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

/**
 * Página de redefinição de senha
 * 
 * Este componente:
 * 1. Extrai o token da URL
 * 2. Verifica a validade do token usando verifyOtp
 * 3. Exibe o formulário de redefinição ou mensagem de erro
 */
export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  // Extrair e validar o token PKCE da URL
  const extractTokenFromUrl = async () => {
    setIsTokenLoading(true);
    try {
      // Pegar parâmetros da URL
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token'); // Token PKCE de recuperação
      const type = queryParams.get('type'); // Deve ser 'recovery'
      
      console.log("Parâmetros da URL:", {
        token: token ? "Presente" : "Ausente",
        type,
        redirectTo: queryParams.get('redirect_to')
      });

      if (!token || type !== 'recovery') {
        setIsTokenValid(false);
        return;
      }

      // Tentar validar o token
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery'
      });

      console.log("Resposta da validação:", {
        success: !!data?.user,
        error: error?.message
      });

      if (error) throw error;
      
      setAccessToken(token);
      setIsTokenValid(true);

    } catch (error) {
      console.error("Erro na validação:", error);
      setIsTokenValid(false);
    } finally {
      setIsTokenLoading(false);
    }
  };

  // Executar a extração e validação do token quando a página carregar
  useEffect(() => {
    extractTokenFromUrl();
  }, [location]);

  // Renderizar mensagem de erro quando o token é inválido
  const renderErrorState = () => {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Link expirado ou inválido. Por favor, solicite uma nova redefinição de senha.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={() => navigate('/auth')} 
          className="w-full"
          variant="outline"
        >
          Voltar para Login
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <ResetPasswordHeader />
          
          <div className="mt-6">
            {isTokenLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
              </div>
            ) : isTokenValid === false ? (
              renderErrorState()
            ) : (
              <PasswordResetForm 
                accessToken={accessToken} 
                isTokenLoading={isTokenLoading} 
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
