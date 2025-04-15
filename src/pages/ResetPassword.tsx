
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
      // Verifica hash primeiro (formato #access_token=XXX)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const hashToken = hashParams.get('access_token');
      if (hashToken) return hashToken;
      
      // Verifica query params (formato ?token=XXX)
      const queryParams = new URLSearchParams(location.search);
      const queryToken = queryParams.get('token') || queryParams.get('access_token');
      if (queryToken) return queryToken;
      
      return null;
    };

    const token = extractToken();
    console.log("Token encontrado na URL:", token ? "Sim" : "Não");
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
