
import React from 'react';
import { Label } from '@/components/ui/label';
import OriginSelector from '@/components/OriginSelector';

interface OriginFieldProps {
  origin: 'corretora' | 'p2p';
  onOriginChange: (origin: 'corretora' | 'p2p') => void;
}

const OriginField: React.FC<OriginFieldProps> = ({ origin, onOriginChange }) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="origin">Origem do Aporte</Label>
      <OriginSelector
        selectedOrigin={origin}
        onChange={onOriginChange}
      />
    </div>
  );
};

export default OriginField;
