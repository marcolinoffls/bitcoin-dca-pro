/**
 * Campo visual de seleção da origem do aporte (Corretora ou P2P).
 * Usado tanto no registro quanto na edição. Controla o valor salvo no Supabase.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Building, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OriginSelectorProps {
  origin: 'corretora' | 'p2p';
  onOriginChange: (origin: 'corretora' | 'p2p') => void;
}

const OriginSelector: React.FC<OriginSelectorProps> = ({ origin, onOriginChange }) => {
  return (
    <div className="flex flex-col space-y-3 mt-6">
      <Label htmlFor="origin">Origem do aporte</Label>
      <div className="flex space-x-1 rounded-md bg-muted p-1">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => onOriginChange('corretora')}
          className={cn(
            'flex-1 text-xs font-normal gap-1',
            origin === 'corretora' && 'bg-bitcoin text-white hover:bg-bitcoin/90'
          )}
        >
          <Building className="h-4 w-4" />
          Corretora
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => onOriginChange('p2p')}
          className={cn(
            'flex-1 text-xs font-normal gap-1',
            origin === 'p2p' && 'bg-bitcoin text-white hover:bg-bitcoin/90'
          )}
        >
          <Users className="h-4 w-4" />
          P2P
        </Button>
      </div>
    </div>
  );
};

export default OriginSelector;
