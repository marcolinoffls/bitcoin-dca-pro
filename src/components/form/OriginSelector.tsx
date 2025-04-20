
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Origin } from '@/types';

interface OriginSelectorProps {
  origin: Origin;
  onOriginChange: (origin: Origin) => void;
  disabled?: boolean;
}

const OriginSelector: React.FC<OriginSelectorProps> = ({ 
  origin, 
  onOriginChange,
  disabled = false
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="originSelector">Origem</Label>
      <RadioGroup
        id="originSelector"
        value={origin}
        onValueChange={(value: Origin) => onOriginChange(value)}
        className="flex gap-6"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem 
            id="corretora" 
            value="corretora" 
            disabled={disabled}
          />
          <Label 
            htmlFor="corretora" 
            className={`font-normal ${disabled ? 'text-muted-foreground' : ''}`}
          >
            Corretora
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem 
            id="p2p" 
            value="p2p" 
            disabled={disabled}
          />
          <Label 
            htmlFor="p2p" 
            className={`font-normal ${disabled ? 'text-muted-foreground' : ''}`}
          >
            P2P
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem 
            id="planilha" 
            value="planilha" 
            disabled={disabled}
          />
          <Label 
            htmlFor="planilha" 
            className={`font-normal ${disabled ? 'text-muted-foreground' : ''}`}
          >
            Planilha
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default OriginSelector;
