
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

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';

const EmailResetForm = () => {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validação simples de formato de email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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

    if (email !== confirmEmail) {
      setError('Os emails não coincidem.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Atualiza o email usando a API do Supabase
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) {
        throw error;
      }

      // Feedback positivo para o usuário
      toast({
        title: "Solicitação enviada",
        description: "Verifique seu email para confirmar a alteração. Você receberá um link de confirmação.",
        duration: 6000,
      });

      // Limpar o formulário
      setEmail('');
      setConfirmEmail('');
      
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error);
      
      // Mensagem de erro amigável para o usuário
      toast({
        title: "Erro ao atualizar email",
        description: error.message || "Não foi possível atualizar seu email. Tente novamente mais tarde.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-email">Novo Email</Label>
        <Input
          id="new-email"
          type="email"
          placeholder="seu.novo.email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
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
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-bitcoin hover:bg-bitcoin/90"
        disabled={isSubmitting}
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
