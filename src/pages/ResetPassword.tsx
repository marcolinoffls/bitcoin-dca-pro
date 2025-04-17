
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
    };

    extractTokenFromUrl();
  }, [location]);

  // Validar token no Supabase antes de mostrar o formulário
  const validateTokenWithSupabase = async () => {
    if (!accessToken) return false;
    
    try {
      // Tenta obter informações do usuário usando o token
      const { data, error } = await supabase.auth.getUser(accessToken);
      return !!data?.user && !error;
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <ResetPasswordHeader />
          
          <div className="mt-6">
            <PasswordResetForm 
              accessToken={accessToken} 
              isTokenLoading={isTokenLoading} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
