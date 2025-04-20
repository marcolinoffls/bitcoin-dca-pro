
/**
 * Botão de configuração que abre a sidebar
 * 
 * O que ele faz:
 * - Exibe um ícone de engrenagem no canto superior esquerdo
 * - Ao ser clicado, abre a barra lateral de configurações
 * - Possui tooltip para melhor usabilidade
 * 
 * Onde é usado:
 * - No cabeçalho da aplicação (Header)
 */

import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConfigButtonProps {
  onClick: () => void;
}

const ConfigButton = ({ onClick }: ConfigButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClick}
            className="h-10 w-10 rounded-full hover:bg-muted"
            aria-label="Configurações"
          >
            <Menu className="h-12 w-12 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Configurações</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConfigButton;
