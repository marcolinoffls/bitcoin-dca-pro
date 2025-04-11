
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface FormActionsProps {
  isEditing: boolean;
  displayUnit: 'BTC' | 'SATS';
  onCalculateFromAmount: () => void;
  onCalculateFromBtc: () => void;
  onReset?: () => void;
}

const FormActions: React.FC<FormActionsProps> = ({ 
  isEditing, 
  displayUnit, 
  onReset 
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`flex justify-center mt-6`}>
      {!isEditing ? (
        <Button 
          type="submit" 
          className="bg-bitcoin hover:bg-bitcoin-dark rounded-full px-8 py-3 h-auto font-medium transition-all duration-200"
        >
          Registrar
        </Button>
      ) : (
        <div className="flex gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={onReset}
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="bg-bitcoin hover:bg-bitcoin-dark rounded-full px-6 py-3 h-auto font-medium transition-all duration-200"
          >
            Atualizar
          </Button>
        </div>
      )}
    </div>
  );
};

export default FormActions;
