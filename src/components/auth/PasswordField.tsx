
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Campo de senha reutilizável com toggle de visibilidade
 * 
 * Props:
 * - id: identificador único do campo
 * - label: texto do rótulo
 * - value: valor do campo
 * - onChange: função chamada quando o valor muda
 * - showPassword: controla visibilidade da senha
 * - onTogglePassword: função para alternar visibilidade
 * - disabled: desabilita o campo
 * - hint: texto de dica opcional
 * - error: mensagem de erro específica para o campo
 */
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled?: boolean;
  hint?: string;
  error?: string;
}

export const PasswordField = ({
  id,
  label,
  value,
  onChange,
  showPassword,
  onTogglePassword,
  disabled,
  hint,
  error
}: PasswordFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          required
          className={`pl-10 pr-10 rounded-lg ${error ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}`}
          disabled={disabled}
          minLength={6}
        />
        <Button
          type="button"
          variant="ghost"
          onClick={onTogglePassword}
          className="absolute right-0 top-0 h-10 w-10 p-0 text-muted-foreground"
          disabled={disabled}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="sr-only">{showPassword ? "Esconder senha" : "Mostrar senha"}</span>
        </Button>
      </div>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
