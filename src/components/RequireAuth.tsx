
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Componente que protege rotas, exigindo autenticação
 * 
 * Responsabilidades:
 * 1. Verificar se o usuário está autenticado
 * 2. Redirecionar para a página de login se necessário
 * 3. Permitir acesso à página de redefinição de senha sem autenticação
 */
interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Verificamos se estamos na página de reset password
  const isResetPasswordPage = location.pathname === '/reset-password';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  // Se for a página de reset password, permitimos o acesso mesmo sem usuário logado
  if (isResetPasswordPage) {
    return <>{children}</>;
  }

  // Para outras páginas, verificamos se o usuário está autenticado
  if (!user) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
