
/**
 * Barra lateral de configurações
 * 
 * O que ele faz:
 * - Exibe uma barra lateral com opções de configuração
 * - Contém cards para redefinição de email e senha
 * - Pode ser fechada clicando no X ou fora da sidebar
 * - Design responsivo para mobile e desktop
 * 
 * Onde é usado:
 * - Na página principal, ativada pelo botão de configurações
 * 
 * Conecta-se com:
 * - EmailResetCard e PasswordResetCard para as funcionalidades
 * - Componente Sheet do shadcn para o efeito de gaveta
 */

import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import EmailResetCard from './EmailResetCard';
import PasswordResetCard from './PasswordResetCard';
import { Separator } from '@/components/ui/separator';

interface SidebarConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SidebarConfig = ({ open, onOpenChange }: SidebarConfigProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Configurações</SheetTitle>
          <SheetDescription>
            Gerencie suas preferências e dados de conta
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">Conta</h3>
            <Separator />
          </div>
          
          <div className="grid gap-4">
            <EmailResetCard />
            <PasswordResetCard />
          </div>
          
          {/* Espaço para futuras categorias de configurações */}
          <div className="space-y-1 mt-8">
            <h3 className="text-sm font-medium text-muted-foreground">Aplicativo</h3>
            <Separator />
            <div className="py-4 text-sm text-muted-foreground text-center">
              Mais configurações serão adicionadas em breve. v1
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SidebarConfig;
