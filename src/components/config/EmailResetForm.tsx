
/**
 * Formulário para redefinição de email do usuário
 * 
 * O que ele faz:
 * - Solicita o novo email e confirmação
 * - Valida se os emails são iguais e válidos
 * - Utiliza o Supabase para atualizar o email
 * - Exibe feedback ao usuário via toast
 * 
 * Onde é usado:
 * - Na barra lateral de configurações (SidebarConfig)
 * - Aparece quando o usuário clica na opção de redefinir email
 * 
 * Conecta-se com:
 * - Supabase Auth para atualização de email
 * - Sistema de Toast para feedback
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EmailResetForm = () => {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const { toast } = useToast();

  // Obter o email atual do usuário
  useEffect(() => {
    const getCurrentUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentEmail(user.email);
      }
    };
    
    getCurrentUserEmail();
  }, []);

  // Validação em tempo real de formato de email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validação em tempo real de emails iguais
  const emailsMatch = () => {
    return email === confirmEmail;
  };

  // Validar os emails sempre que mudar um dos campos
  useEffect(() => {
    // Limpar erros anteriores
    setValidationError(null);
    
    // Ignorar validação se um dos campos estiver vazio
    if (!email || !confirmEmail) return;
    
    // Verificar formato do email
    if (!isValidEmail(email)) {
      setValidationError('Por favor, forneça um email válido.');
      return;
    }
    
    // Verificar se os emails coincidem
    if (!emailsMatch()) {
      setValidationError('Os emails não coincidem.');
      return;
    }
    
    // Verificar se é igual ao email atual
    if (email === currentEmail) {
      setValidationError('O novo email deve ser diferente do atual.');
      return;
    }
  }, [email, confirmEmail, currentEmail]);

  // Função para atualizar o email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações de formulário
    if (!email || !confirmEmail) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor, forneça um email válido.');
      return;
    }

    if (!emailsMatch()) {
      setError('Os emails não coincidem.');
      return;
    }
    
    if (email === currentEmail) {
      setError('O novo email deve ser diferente do atual.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Atualiza o email usando a API do Supabase com o redirecionamento configurado
      const { error } = await supabase.auth.updateUser({
        email: email
      }, {
        // Configurando o redirecionamento corretamente - importante para finalizar o fluxo
        emailRedirectTo: `${window.location.origin}/auth`
      });
      
      if (error) {
        throw error;
      }

      // Feedback positivo para o usuário
      toast({
        title: "Solicitação enviada",
        description: "Confira seu novo email para confirmar a alteração. Só será possível fazer login com o novo email após confirmação.",
        duration: 8000,
        variant: "default",
      });

      // Limpar o formulário
      setEmail('');
      setConfirmEmail('');
      
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error);
      
      // Tratar mensagens específicas de erro
      let errorMessage = "Não foi possível atualizar seu email. Verifique se já existe uma conta com esse email ou tente novamente.";
      
      if (error.message?.includes('already exists')) {
        errorMessage = "Este email já está sendo usado por outra conta.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
      } else if (error.message?.includes('invalid')) {
        errorMessage = "O formato do email fornecido é inválido.";
      }
      
      setError(errorMessage);
      
      // Toast para erros
      toast({
        title: "Erro ao atualizar email",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email atual */}
      {currentEmail && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Email atual</Label>
          <div className="text-sm font-medium">{currentEmail}</div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="new-email">Novo Email</Label>
        <Input
          id="new-email"
          type="email"
          placeholder="seu.novo.email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className={`text-sm ${validationError && email ? 'border-red-300' : ''}`}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-email">Confirmar Email</Label>
        <Input
          id="confirm-email"
          type="email"
          placeholder="Repita o email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          disabled={isSubmitting}
          className={`text-sm ${validationError && confirmEmail ? "border-red-300" : ""}`}
        />
      </div>

      {/* Exibir erros de validação em tempo real */}
      {validationError && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Exibir erros de submissão */}
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Informações sobre o processo */}
      <Alert variant="warning" className="py-2 bg-amber-50">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Após submeter, você receberá um email de confirmação no novo endereço. 
          Você só poderá usar o novo email para login após clicar no link de confirmação.
        </AlertDescription>
      </Alert>
      
      <Button 
        type="submit" 
        className="w-full bg-bitcoin hover:bg-bitcoin/90"
        disabled={isSubmitting || !!validationError || !email || !confirmEmail}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Enviando...
          </span>
        ) : "Atualizar Email"}
      </Button>
    </form>
  );
};

export default EmailResetForm;
