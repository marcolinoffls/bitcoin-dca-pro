
/**
 * Card para redefinição de email do usuário
 * 
 * O que ele faz:
 * - Exibe uma opção para alterar o email com ícone de envelope
 * - Ao ser clicado, expande para mostrar o formulário de alteração
 * - Utiliza o componente de card do shadcn para melhor UI
 * 
 * Onde é usado:
 * - Na barra lateral de configurações (SidebarConfig)
 * 
 * Conecta-se com:
 * - Componente EmailResetForm
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import EmailResetForm from './EmailResetForm';

const EmailResetCard = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-background pb-2 space-y-1">
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Alterar Email
        </CardTitle>
        <CardDescription className="text-xs">
          Atualize seu endereço de email cadastrado
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {showForm ? (
          <div className="space-y-4">
            <EmailResetForm />
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowForm(true)}
          >
            Alterar Email
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailResetCard;
