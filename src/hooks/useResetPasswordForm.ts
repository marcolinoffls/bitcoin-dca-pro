import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook que gerencia o formulário de definição da nova senha.
 * • Valida requisitos de força da senha
 * • Chama supabase.auth.updateUser({ password })
 * • Mostra toasts e faz logout + redirect ao final
 */
export const useResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();

  /** Regras de validação locais — retorna true se passou */
  const validatePassword = (): boolean => {
    setPasswordError('');

    if (!password || !confirmPassword)
      return setError('Por favor, preencha todos os campos');

    if (password.length < 8)
      return setError('A senha deve ter pelo menos 8 caracteres');

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password))
      return setError('Use letras maiúsculas e minúsculas');

    if (!/\d/.test(password))
      return setError('Inclua ao menos um número');

    if (!/[^A-Za-z0-9]/.test(password))
      return setError('Inclua um caractere especial');

    if (password !== confirmPassword)
      return setError('As senhas não coincidem');

    return true;
  };

  /** Helper para reduzir repetição */
  const setError = (msg: string) => {
    setPasswordError(msg);
    return false;
  };

  /** Handler de submit do formulário */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsSubmitting(true);
    try {
      // Supabase já tem a sessão ativa (troca PKCE); basta atualizar o user
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: 'Senha atualizada!',
        description: 'Faça login novamente com sua nova credencial.',
        variant: 'success',
      });

      // Logout para evitar sessão antiga
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      setPasswordError(err.message || 'Erro inesperado ao redefinir senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    passwordError,
    handleResetPassword,
  };
};
