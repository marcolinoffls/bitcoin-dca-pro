import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Formulário onde o usuário escolhe a nova senha.
 * Recebe apenas `isTokenLoading` para desativar campos enquanto carrega.
 */
interface Props {
  isTokenLoading: boolean;
}

export default function PasswordResetForm({ isTokenLoading }: Props) {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSubmitting,
    passwordError,
    handleResetPassword,
  } = useResetPasswordForm();

  return (
    <form className="space-y-4" onSubmit={handleResetPassword}>
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isTokenLoading || isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input
          id="confirm"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isTokenLoading || isSubmitting}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show"
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
          disabled={isTokenLoading || isSubmitting}
        />
        <Label htmlFor="show" className="text-xs">
          Mostrar senha
        </Label>
      </div>

      {passwordError && (
        <p className="text-red-600 text-sm">{passwordError}</p>
      )}

      <Button
        type="submit"
        className="w-full bg-bitcoin hover:bg-bitcoin/90"
        disabled={isTokenLoading || isSubmitting}
      >
        {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
      </Button>
    </form>
  );
}
