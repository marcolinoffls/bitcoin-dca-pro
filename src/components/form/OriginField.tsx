
import React from 'react';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Store, Users } from 'lucide-react';

interface OriginFieldProps {
  originType: 'corretora' | 'p2p';
  onOriginChange: (origin: 'corretora' | 'p2p') => void;
}

const OriginField: React.FC<OriginFieldProps> = ({ 
  originType, 
  onOriginChange 
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label>Origem do Aporte</Label>
      <ToggleGroup 
        type="single" 
        value={originType} 
        onValueChange={(value) => {
          if (value) {
            onOriginChange(value as 'corretora' | 'p2p');
          }
        }}
        className="justify-start"
      >
        <ToggleGroupItem 
          value="corretora" 
          className="flex items-center gap-1 data-[state=on]:bg-bitcoin data-[state=on]:text-white rounded-l-xl"
        >
          <Store className="h-4 w-4" />
          <span>Corretora</span>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="p2p" 
          className="flex items-center gap-1 data-[state=on]:bg-bitcoin data-[state=on]:text-white rounded-r-xl"
        >
          <Users className="h-4 w-4" />
          <span>P2P</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default OriginField;
