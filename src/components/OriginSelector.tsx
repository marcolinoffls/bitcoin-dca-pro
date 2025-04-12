
import { Button } from "@/components/ui/button";
import React from "react";

interface OriginSelectorProps {
  selectedOrigin: 'corretora' | 'p2p';
  onChange: (origin: 'corretora' | 'p2p') => void;
  buttonType?: "button" | "submit" | "reset"; // Optional prop to specify button type
}

const OriginSelector: React.FC<OriginSelectorProps> = ({ 
  selectedOrigin, 
  onChange,
  buttonType = "button"
}) => {
  return (
    <div className="flex gap-2">
      <Button
        type={buttonType}
        onClick={() => onChange('corretora')}
        variant={selectedOrigin === 'corretora' ? 'default' : 'outline'}
        className={`flex-1 rounded-xl ${
          selectedOrigin === 'corretora' 
            ? 'bg-bitcoin hover:bg-bitcoin/90 text-white' 
            : 'border-bitcoin text-bitcoin hover:text-bitcoin hover:bg-bitcoin/10'
        }`}
      >
        Corretora
      </Button>
      
      <Button
        type={buttonType}
        onClick={() => onChange('p2p')}
        variant={selectedOrigin === 'p2p' ? 'default' : 'outline'}
        className={`flex-1 rounded-xl ${
          selectedOrigin === 'p2p' 
            ? 'bg-bitcoin hover:bg-bitcoin/90 text-white' 
            : 'border-bitcoin text-bitcoin hover:text-bitcoin hover:bg-bitcoin/10'
        }`}
      >
        P2P
      </Button>
    </div>
  );
};

export default OriginSelector;
