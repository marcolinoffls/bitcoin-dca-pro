
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Extrai o token de acesso da URL ao montar o componente
  // Função melhorada para capturar o token de diferentes formatos de URL
  useEffect(() => {
    // Função para extrair o token de vários formatos possíveis
    const extractToken = () => {
      // Verifica se o token está no hash (formato #access_token=XXX)
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const hashToken = hashParams.get('access_token');
      if (hashToken) return hashToken;
      
      // Verifica se o token está nos parâmetros de consulta (formato ?token=XXX)
      const queryParams = new URLSearchParams(location.search);
      const queryToken = queryParams.get('token') || queryParams.get('access_token');
      if (queryToken) return queryToken;
      
      // Verifica se há um formato de URL específico para a recuperação de senha
      // Alguns provedores usam diretamente o parâmetro na URL
      return null;
    };

    const token = extractToken();
    console.log("Token encontrado na URL:", token ? "Sim" : "Não"); // Log para depuração
    setAccessToken(token);
    
    if (!token) {
      setPasswordError('Link inválido ou expirado. Por favor, solicite uma nova redefinição de senha.');
    }
  }, [location]);

  // Alterna a visibilidade da senha
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Valida a senha inserida
  const validatePassword = () => {
    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Manipula o envio do formulário de redefinição de senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    if (!accessToken) {
      setPasswordError('Link inválido ou expirado. Por favor, solicite uma nova redefinição de senha.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Tentando definir a sessão com o token"); // Log para depuração
      
      // Define o token de acesso na sessão
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '',
      });

      if (sessionError) {
        console.error("Erro ao definir a sessão:", sessionError); // Log para depuração
        throw sessionError;
      }

      console.log("Tentando atualizar a senha do usuário"); // Log para depuração
      
      // Atualiza a senha do usuário
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        console.error("Erro ao atualizar a senha:", error); // Log para depuração
        throw error;
      }
      
      toast({
        title: "Senha atualizada com sucesso",
        description: "Sua senha foi redefinida. Agora você pode fazer login com sua nova senha.",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Erro ao redefinir a senha:', error.message);
      setPasswordError(error.message || 'Ocorreu um erro ao redefinir a senha. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md rounded-xl shadow-lg border-0">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYml0Y29pbi5wbmciLCJpYXQiOjE3NDQ0OTkzNDksImV4cCI6MTc3NjAzNTM0OX0.UMcsJt0r9ZhEcYmAtfv2QvtADaIshCKaTmKjD8oCAjo" 
              alt="Bitcoin" 
              className="h-10 w-10 object-contain mr-3" 
            />
            <CardTitle className="text-3xl font-bold">BITCOIN DCA PRO</CardTitle>
          </div>
          <CardDescription>
            Redefina sua senha para continuar
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-bitcoin hover:bg-bitcoin/90 rounded-lg py-3"
                disabled={!accessToken || isSubmitting}
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
