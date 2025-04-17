
/**
 * Card para redefinição de senha do usuário
 * 
 * O que ele faz:
 * - Exibe uma opção para redefinir a senha com ícone de cadeado
 * - Ao ser clicado, executa a função para iniciar o fluxo de redefinição
 * - Utiliza o componente de card do shadcn para melhor UI
 * 
 * Onde é usado:
 * - Na barra lateral de configurações (SidebarConfig)
 * 
 * Conecta-se com:
 * - Hook usePasswordReset para o fluxo de redefinição
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PasswordResetCard = () => {
  const { resetPassword } = usePasswordReset();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    try {
      setIsSubmitting(true);
      await resetPassword(user.email);
    } finally {
      setIsSubmitting(false);
      // Esconder o formulário após o envio
      setShowForm(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-background pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Redefinir Senha
        </CardTitle>
        <CardDescription className="text-xs">
          Receba um link para alterar sua senha atual
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {showForm ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Um link de redefinição de senha será enviado para:</p>
              <p className="font-medium text-foreground">{user?.email}</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              <Button 
                size="sm" 
                className="flex-1 bg-bitcoin hover:bg-bitcoin/90"
                onClick={handlePasswordReset}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    <span>Enviando...</span>
                  </span>
                ) : "Confirmar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowForm(true)}
          >
            Solicitar Link
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordResetCard;
