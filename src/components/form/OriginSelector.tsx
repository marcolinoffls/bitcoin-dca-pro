
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * Componente OriginSelector
 * 
 * Permite selecionar a origem do aporte de Bitcoin: corretora, p2p ou planilha.
 * 
 * Props:
 * - origin: origem atual selecionada
 * - onOriginChange: função chamada quando a origem é alterada
 * 
 * Usado em:
 * - EntryForm (ao adicionar um novo aporte)
 * - EntryEditForm (ao editar um aporte existente)
 */
interface OriginSelectorProps {
  origin: 'corretora' | 'p2p' | 'planilha';
  onOriginChange: (origin: 'corretora' | 'p2p' | 'planilha') => void;
}

const OriginSelector: React.FC<OriginSelectorProps> = ({
  origin,
  onOriginChange,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Origem da compra</Label>
      </div>
      <RadioGroup
        value={origin}
        onValueChange={(value: 'corretora' | 'p2p' | 'planilha') => onOriginChange(value)}
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="corretora" id="corretora" />
          <Label htmlFor="corretora" className="font-normal">
            Corretora
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="p2p" id="p2p" />
          <Label htmlFor="p2p" className="font-normal">
            P2P
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="planilha" id="planilha" />
          <Label htmlFor="planilha" className="font-normal">
            Planilha
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default OriginSelector;
