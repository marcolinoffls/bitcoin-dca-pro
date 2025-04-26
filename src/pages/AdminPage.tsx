
/**
 * Página principal do painel administrativo
 * Acessível apenas para usuários com role === 'admin'
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminUserList } from '@/components/admin/AdminUserList';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, stats, isLoading } = useAdminData();

  // Verifica se o usuário é admin, caso contrário redireciona
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div>
      </div>
    );
  }

  if (!users || !stats) return null;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>
      
      <AdminStats stats={stats} />
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Lista de Usuários</h2>
        <AdminUserList users={users} />
      </div>
    </div>
  );
}
