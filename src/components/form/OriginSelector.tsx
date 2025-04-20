
/**
 * Campo visual de seleção da origem do aporte (Corretora ou P2P).
 * Usado tanto no registro quanto na edição. Controla o valor salvo no Supabase.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Building, Users, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Origin } from '@/types';

interface OriginSelectorProps {
  origin: Origin;
  onOriginChange: (origin: Origin) => void;
}

const OriginSelector: React.FC<OriginSelectorProps> = ({ origin, onOriginChange }) => {
  // Função para normalizar a origem caso seja "exchange" (compatibilidade)
  const handleOriginChange = (newOrigin: Origin) => {
    onOriginChange(newOrigin);
  };

  return (
    <div className="flex flex-col space-y-3 mt-6">
      <Label htmlFor="origin">Origem do aporte</Label>
      <div className="flex flex-wrap space-x-1 rounded-xl bg-muted p-1">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => handleOriginChange('corretora')}
          className={cn(
            'flex-1 text-xs font-normal gap-1 rounded-xl',
            (origin === 'corretora' || origin === 'exchange') && 'bg-bitcoin text-white hover:bg-bitcoin/90'
          )}
        >
          <Building className="h-4 w-4" />
          Corretora
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => handleOriginChange('p2p')}
          className={cn(
            'flex-1 text-xs font-normal gap-1 rounded-xl',
            origin === 'p2p' && 'bg-bitcoin text-white hover:bg-bitcoin/90'
          )}
        >
          <Users className="h-4 w-4" />
          P2P
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => handleOriginChange('planilha')}
          className={cn(
            'flex-1 text-xs font-normal gap-1 rounded-xl',
            origin === 'planilha' && 'bg-bitcoin text-white hover:bg-bitcoin/90'
          )}
        >
          <Table className="h-4 w-4" />
          Planilha
        </Button>
      </div>
      
      {/* Mensagem de informação se origin for "exchange" */}
      {origin === 'exchange' && (
        <p className="text-xs text-muted-foreground mt-1">
          Nota: "exchange" é mapeado para "corretora" na interface.
        </p>
      )}
    </div>
  );
};

export default OriginSelector;
