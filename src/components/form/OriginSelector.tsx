
import React from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Building, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <ToggleGroup 
        type="single" 
        value={origin} 
        onValueChange={(value) => {
          if (value) onOriginChange(value as 'corretora' | 'p2p');
        }}
        className="flex gap-2"
      >
        <ToggleGroupItem 
          value="corretora" 
          aria-label="Corretora"
          className={cn(
            "flex-1 gap-1 rounded-lg data-[state=on]:bg-bitcoin data-[state=on]:text-white",
            "border border-input bg-muted hover:bg-muted/80"
          )}
        >
          <Building className="h-4 w-4" />
          <span>Corretora</span>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="p2p" 
          aria-label="P2P"
          className={cn(
            "flex-1 gap-1 rounded-lg data-[state=on]:bg-bitcoin data-[state=on]:text-white",
            "border border-input bg-muted hover:bg-muted/80"
          )}
        >
          <Users className="h-4 w-4" />
          <span>P2P</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default OriginSelector;
