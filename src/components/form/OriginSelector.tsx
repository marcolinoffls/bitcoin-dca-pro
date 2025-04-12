
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, Users } from 'lucide-react';

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
      <RadioGroup 
        value={origin} 
        onValueChange={(value) => onOriginChange(value as 'corretora' | 'p2p')}
        className="flex gap-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="corretora" id="corretora" />
          <Label htmlFor="corretora" className="flex items-center gap-1 cursor-pointer">
            <Building2 className="h-4 w-4" />
            <span>Corretora</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="p2p" id="p2p" />
          <Label htmlFor="p2p" className="flex items-center gap-1 cursor-pointer">
            <Users className="h-4 w-4" />
            <span>P2P</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default OriginSelector;
