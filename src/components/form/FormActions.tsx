
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
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
  onCalculateFromAmount, 
  onCalculateFromBtc,
  onReset 
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`grid grid-cols-1 gap-2 mt-6 ${isMobile ? "grid-cols-2" : "md:grid-cols-3"}`}>
      {!isEditing ? (
        <>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCalculateFromAmount}
            className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
          >
            <Calculator className="h-4 w-4 mr-1" />
            {isMobile ? "" : "Calcular "}{displayUnit === 'SATS' ? 'Satoshis' : 'BTC'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCalculateFromBtc}
            className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
          >
            <Calculator className="h-4 w-4 mr-1" />
            {isMobile ? "" : "Calcular "}Valor
          </Button>
          <Button 
            type="submit" 
            className={`${isMobile ? "col-span-2" : "col-span-1"} bg-bitcoin hover:bg-bitcoin-dark`}
          >
            Registrar
          </Button>
        </>
      ) : (
        <>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCalculateFromAmount}
            className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
          >
            <Calculator className="h-4 w-4 mr-1" />
            Calcular {displayUnit === 'SATS' ? 'Satoshis' : 'BTC'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={onReset}
            className={`${isMobile ? "col-span-1 text-xs px-2" : "col-span-1"}`}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className={`${isMobile ? "col-span-2" : "col-span-1"} bg-bitcoin hover:bg-bitcoin-dark`}
          >
            Atualizar
          </Button>
        </>
      )}
    </div>
  );
};

export default FormActions;
