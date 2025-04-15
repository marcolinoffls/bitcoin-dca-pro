
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Componente para exibir mensagens de erro no formulário
 * 
 * Props:
 * - message: mensagem de erro a ser exibida
 * - variant: variante do alerta (destructive ou warning)
 */
interface FormErrorProps {
  message: string;
  variant?: "destructive" | "warning";
}

export const FormError = ({ message, variant = "destructive" }: FormErrorProps) => {
  if (!message) return null;
  
  return (
    <Alert variant={variant} className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
