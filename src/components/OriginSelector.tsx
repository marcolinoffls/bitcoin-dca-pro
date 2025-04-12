
import React from 'react';
import { Button } from "@/components/ui/button";
import { Bitcoin, Users } from "lucide-react";

interface OriginSelectorProps {
  selectedOrigin: 'corretora' | 'p2p';
  onChange: (origin: 'corretora' | 'p2p') => void;
  buttonType?: "submit" | "reset" | "button";
  disabled?: boolean;
}

const OriginSelector: React.FC<OriginSelectorProps> = ({
  selectedOrigin,
  onChange,
  buttonType = "button",
  disabled = false,
}) => {
  return (
    <div className="flex gap-2">
      <Button
        variant={selectedOrigin === 'corretora' ? "default" : "outline"}
        type={buttonType}
        onClick={() => onChange('corretora')}
        className={`flex-1 rounded-xl ${selectedOrigin === 'corretora' ? 'bg-bitcoin hover:bg-bitcoin/90' : ''}`}
        disabled={disabled}
      >
        <Bitcoin className="h-4 w-4 mr-2" />
        <span>Corretora</span>
      </Button>
      <Button
        variant={selectedOrigin === 'p2p' ? "default" : "outline"}
        type={buttonType}
        onClick={() => onChange('p2p')}
        className={`flex-1 rounded-xl ${selectedOrigin === 'p2p' ? 'bg-bitcoin hover:bg-bitcoin/90' : ''}`}
        disabled={disabled}
      >
        <Users className="h-4 w-4 mr-2" />
        <span>P2P</span>
      </Button>
    </div>
  );
};

export default OriginSelector;
