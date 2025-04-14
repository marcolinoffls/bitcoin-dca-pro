
/**
 * Componente: OriginSelector
 * 
 * Função: Seletor para a origem do aporte (corretora, p2p ou planilha)
 * 
 * Uso: Utilizado no formulário de aportes para definir a fonte do aporte
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type Origin = 'corretora' | 'p2p' | 'planilha';

interface OriginSelectorProps {
  origin: Origin;
  onOriginChange: (origin: Origin) => void;
  disabled?: boolean;
}

const OriginSelector: React.FC<OriginSelectorProps> = ({ 
  origin, 
  onOriginChange,
  disabled
}) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="origin">Origem do Aporte</Label>
      <Select 
        value={origin} 
        onValueChange={(value: Origin) => onOriginChange(value)}
        disabled={disabled}
      >
        <SelectTrigger id="origin">
          <SelectValue placeholder="Selecione a origem" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="corretora">
            🏦 Corretora
          </SelectItem>
          <SelectItem value="p2p">
            👥 P2P
          </SelectItem>
          <SelectItem value="planilha">
            📊 Planilha
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default OriginSelector;
