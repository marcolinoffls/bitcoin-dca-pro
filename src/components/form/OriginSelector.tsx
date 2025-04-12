
import React from 'react';
import { Label } from '@/components/ui/label';
import { Building, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Componente que permite selecionar a origem do aporte (corretora ou p2p)
 * 
 * Usado no formulário de registro e edição de aportes
 * Envia o valor selecionado para a coluna origem_aporte no Supabase
 */
interface OriginSelectorProps {
  origin: 'corretora' | 'p2p';
  onOriginChange: (origin: 'corretora' | 'p2p') => void;
}

const OriginSelector: React.FC<OriginSelectorProps> = ({ 
  origin, 
  onOriginChange 
}) => {
  return (
    <div className="flex flex-col space-y-3 mt-6">
      <Label htmlFor="origin">Origem do aporte</Label>
      
      {/* Container para os botões com estilo semelhante ao CurrencySelector */}
      <div className="flex space-x-1 rounded-md bg-muted p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOriginChange('corretora')}
          className={cn(
            'flex-1 text-xs font-normal gap-1',
            origin === 'corretora' && 'bg-bitcoin text-white hover:bg-bitcoin/90'
          )}
          type="button"
        >
          <Building className="h-4 w-4" />
          <span>Corretora</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOriginChange('p2p')}
          className={cn(
            'flex-1 text-xs font-normal gap-1',
            origin === 'p2p' && 'bg-bitcoin text-white hover:bg-bitcoin/90'
          )}
          type="button"
        >
          <Users className="h-4 w-4" />
          <span>P2P</span>
        </Button>
      </div>
    </div>
  );
};

export default OriginSelector;
