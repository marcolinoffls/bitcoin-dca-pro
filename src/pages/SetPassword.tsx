
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import ResetPasswordHeader from '@/components/auth/ResetPasswordHeader';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

/**
 * Página onde o usuário realmente define a nova senha.
 * Requer que já exista sessão. Se não houver, redireciona para /auth.
 */
export default function SetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) navigate('/auth', { replace: true });
    };
    check();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <ResetPasswordHeader />
          <div className="mt-6">
            {/* Sessão já existe, portanto isTokenLoading = false */}
            <PasswordResetForm isTokenLoading={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
