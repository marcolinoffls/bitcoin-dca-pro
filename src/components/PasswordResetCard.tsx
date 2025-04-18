
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { useAuth } from '@/hooks/useAuth';

/**
 * PasswordResetCard
 * -----------------
 * • Exibe um card na área logada para que o usuário solicite um link
 *   de redefinição de senha.
 * • Usa o hook usePasswordReset para disparar o e-mail via Supabase.
 * • Segue o padrão visual do projeto (shadcn/ui e tailwind).
 */
export default function PasswordResetCard() {
  const { resetPassword } = usePasswordReset();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Envia a solicitação de reset para o email do usuário
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    try {
      setIsSubmitting(true);
      await resetPassword(user.email);
      await supabase.auth.signOut();   // limpa tokens desta aba

    } finally {
      setIsSubmitting(false);
      setShowForm(false); // fecha o mini-form após enviar
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-background pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          Redefinir senha
        </CardTitle>
        <CardDescription className="text-xs">
          Receba um link para alterar sua senha atual
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {showForm ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Enviaremos o link para: <span className="font-medium">{user?.email}</span>
            </p>
            
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
                {isSubmitting ? 'Enviando…' : 'Confirmar'}
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            Solicitar link
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
