
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
 * 2. Verifica a validade do token
 * 3. Exibe o formulário de redefinição ou mensagem de erro
 */
export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  // Extrair o token da URL ao carregar a página
  useEffect(() => {
    const extractTokenFromUrl = () => {
      setIsTokenLoading(true);
      const fragment = location.hash;
      const query = location.search;
      let token = null;

      // Verificar no fragmento da URL (após #)
      if (fragment) {
        const fragmentParams = new URLSearchParams(fragment.substring(1));
        token = fragmentParams.get('access_token');
      }

      // Se não encontrado no fragmento, procurar na query string (após ?)
      if (!token && query) {
        const queryParams = new URLSearchParams(query);
        token = queryParams.get('token') || queryParams.get('access_token');
      }

      console.log("Token extraído da URL:", token ? "Encontrado" : "Não encontrado");
      setAccessToken(token);
      setIsTokenLoading(false);
      
      // Validar token no Supabase
      if (token) {
        validateTokenWithSupabase(token);
      } else {
        setIsTokenValid(false);
      }
    };

    extractTokenFromUrl();
  }, [location]);

  // Validar token no Supabase
  const validateTokenWithSupabase = async (token: string) => {
    try {
      setIsTokenLoading(true);
      
      // Tenta obter informações do usuário usando o token
      const { data, error } = await supabase.auth.getUser(token);
      
      setIsTokenValid(!!data?.user && !error);
      
      if (error) {
        console.error("Erro ao validar token:", error.message);
      }
    } catch (error) {
      console.error("Erro ao validar token:", error);
      setIsTokenValid(false);
    } finally {
      setIsTokenLoading(false);
    }
  };

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
