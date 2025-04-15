
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Componente para exibir mensagens de erro no formulário
 * 
 * Props:
 * - message: mensagem de erro a ser exibida
 */
interface FormErrorProps {
  message: string;
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
