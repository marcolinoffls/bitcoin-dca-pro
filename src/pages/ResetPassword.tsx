
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import ResetPasswordHeader from '@/components/auth/ResetPasswordHeader';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

/**
 * Página de redefinição de senha
 * 
 * Este componente é responsável por:
 * 1. Extrair o token de acesso da URL
 * 2. Renderizar o formulário de redefinição de senha
 * 3. Gerenciar o estado de carregamento
 */
const ResetPassword = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Extrai o token de acesso da URL ao montar o componente
  useEffect(() => {
    const extractToken = () => {
      // Verifica se há um hash e extrai o access_token
      if (location.hash) {
        try {
          // Remove o # inicial
          const hashParams = new URLSearchParams(location.hash.substring(1));
          const hashToken = hashParams.get('access_token');
          
          if (hashToken) {
            console.log("Token encontrado no hash da URL");
            return hashToken;
          }
        } catch (error) {
          console.error("Erro ao extrair token do hash:", error);
        }
      }
      
      // Tenta extrair de query params como fallback
      try {
        const queryParams = new URLSearchParams(location.search);
        const queryToken = queryParams.get('token') || queryParams.get('access_token');
        
        if (queryToken) {
          console.log("Token encontrado nos query params da URL");
          return queryToken;
        }
      } catch (error) {
        console.error("Erro ao extrair token dos query params:", error);
      }
      
      return null;
    };

    const token = extractToken();
    console.log("Status do token:", token ? "Token encontrado" : "Token não encontrado");
    setAccessToken(token);
    setIsTokenLoading(false);
  }, [location]);

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      {/* Título invisível para SEO */}
      <h1 className="sr-only">Redefinição de Senha - Bitcoin DCA Pro</h1>
      
      <Card className="w-full max-w-md rounded-xl shadow-lg border-0">
        <CardHeader className="text-center pb-6">
          <ResetPasswordHeader />
        </CardHeader>

        <CardContent>
          <PasswordResetForm 
            accessToken={accessToken}
            isTokenLoading={isTokenLoading}
          />
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button 
            variant="link" 
            onClick={() => navigate('/auth')}
            className="text-sm text-muted-foreground"
          >
            Voltar para a página de login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
