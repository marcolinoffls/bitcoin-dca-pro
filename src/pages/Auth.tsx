import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Página de autenticação
 * 
 * Este componente gerencia:
 * 1. Login com email/senha
 * 2. Cadastro de novos usuários
 * 3. Redefinição de senha
 * 4. Login social com Google
 */
const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [passwordError, setPasswordError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  if (user) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  const validatePassword = () => {
    if (activeTab === 'register') {
      if (password.length < 6) {
        setPasswordError('A senha deve ter pelo menos 6 caracteres');
        return false;
      }
      if (password !== confirmPassword) {
        setPasswordError('As senhas não coincidem');
        return false;
      }
    }
    setPasswordError('');
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('Iniciando login com Google...');
      setIsGoogleLoading(true);
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      console.log('URL de redirecionamento:', redirectTo);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      
      console.log('Resposta da autenticação:', data);
      
      if (error) {
        console.error('Erro na autenticação com Google:', error);
        throw error;
      }
      
      console.log('Redirecionando para autenticação do Google...');
      
    } catch (error: any) {
      console.error('Erro ao tentar login com Google:', error.message);
      toast({
        variant: "destructive",
        title: "Erro no login com Google",
        description: error.message || "Não foi possível conectar com o Google. Tente novamente.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setPasswordError('Por favor, insira seu email para redefinir a senha');
      return;
    }

    setIsSubmitting(true);
    setPasswordError('');
    
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (error: any) {
      console.error('Erro ao enviar email de redefinição:', error);
      
      if (error.message?.includes('SMTP') || error.message?.includes('Authentication failed')) {
        setPasswordError('Problema com o servidor de email. Por favor, entre em contato com o suporte técnico informando: "Erro SMTP".');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const GoogleButton = () => (
    <Button 
      type="button" 
      variant="outline" 
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isGoogleLoading}
    >
      {isGoogleLoading ? (
        <span className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
          Conectando...
        </span>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            className="ml-[-1px]"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </>
      )}
    </Button>
  );

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md rounded-xl shadow-lg border-0">
        <CardHeader className="text-center pb-6">
          <h1 className="sr-only">Bitcoin DCA PRO</h1>
          
          <div className="flex items-center justify-center mb-4">
            <div className="h-8 w-8">
              <img 
                src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin%20logo%20oficial%20sem%20nome%20100px.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYml0Y29pbiBsb2dvIG9maWNpYWwgc2VtIG5vbWUgMTAwcHgucG5nIiwiaWF0IjoxNzQ0NTU4MDQ2LCJleHAiOjE4MDc2MzAwNDZ9.jmzK3PG-1LJ1r-2cqJD7OiOJItfPWA4oD8n0autKJeo" 
                alt="Bitcoin Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="h-7 ml-3">
              <img 
                src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/fontes//Bitcoin%20dca%20pro%20-%20caixa%20alta%20(1).png" 
                alt="Bitcoin DCA Pro"
                className="h-full object-contain"
              />
            </div>
          </div>
          <CardDescription>
            Gerencie seus aportes de Bitcoin com facilidade e segurança
          </CardDescription>
        </CardHeader>
        
        <div className="min-h-[320px] transition-all duration-300">
          {resetRequested ? (
            <div className="px-6 pb-6">
              <Button 
                variant="outline" 
                className="mb-4" 
                onClick={() => {
                  setResetRequested(false);
                  setResetSent(false);
                }}
              >
                &larr; Voltar ao login
              </Button>
              
              <h3 className="text-lg font-medium mb-4">Redefinir senha</h3>
              
              {resetSent ? (
                <Alert className="mb-4">
                  <AlertDescription>
                    Email enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 rounded-lg placeholder:text-sm"
                        />
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enviando...
                        </span>
                      ) : 'Enviar link de redefinição'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-2 p-1">
                <TabsTrigger 
                  value="login"
                  aria-label="Entrar na conta"
                  className="rounded data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  aria-label="Criar nova conta"
                  className="rounded data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Criar Conta
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-4">
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 rounded-lg placeholder:text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password">Senha</Label>
                        <Button 
                          variant="link" 
                          type="button" 
                          onClick={() => setResetRequested(true)} 
                          className="p-0 h-auto text-xs text-muted-foreground"
                        >
                          Esqueceu a senha?
                        </Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"}
                          placeholder="digite sua senha..." 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 rounded-lg placeholder:text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={toggleShowPassword}
                          className="absolute right-0 top-0 h-10 w-10 p-0 text-muted-foreground"
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
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-bitcoin hover:bg-bitcoin/90 rounded-lg py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Entrando...
                        </span>
                      ) : 'Entrar'}
                    </Button>
                    
                    <div className="relative w-full flex items-center justify-center">
                      <div className="absolute border-t border-gray-200 w-full"></div>
                      <span className="relative px-2 bg-card text-xs text-muted-foreground">ou continue com</span>
                    </div>
                    
                    <GoogleButton />
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="mt-4">
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="register-email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10 rounded-lg placeholder:text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="register-password" 
                          type={showPassword ? "text" : "password"}
                          placeholder="digite sua nova senha..."
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 rounded-lg placeholder:text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={toggleShowPassword}
                          className="absolute right-0 top-0 h-10 w-10 p-0 text-muted-foreground"
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
                          placeholder="repita sua nova senha..."
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 rounded-lg placeholder:text-xs"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={toggleShowPassword}
                          className="absolute right-0 top-0 h-10 w-10 p-0 text-muted-foreground"
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
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-bitcoin hover:bg-bitcoin/90 rounded-lg py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cadastrando...
                        </span>
                      ) : 'Criar Conta'}
                    </Button>
                    
                    <div className="relative w-full flex items-center justify-center">
                      <div className="absolute border-t border-gray-200 w-full"></div>
                      <span className="relative px-2 bg-card text-xs text-muted-foreground">ou continue com</span>
                    </div>
                    
                    <GoogleButton />
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
