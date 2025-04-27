/**
 * Página principal do painel administrativo
 * Acessível apenas para usuários com role === 'admin'
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { AdminStats } from '@/components/admin/AdminStats';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { supabase } from '@/integrations/supabase/client'; // (IMPORTANTE) Importa corretamente o supabase client

export default function AdminPage() {
  const navigate = useNavigate(); // Para redirecionamento
  const { user } = useAuth(); // Usuário logado
  const { users, stats, isLoading } = useAdminData(); // Dados administrativos

  // Verifica se o usuário é admin, caso contrário redireciona para home
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/'); // Sem usuário, redireciona
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single(); // Consulta o papel do usuário no Supabase

      if (error) {
        console.error('Erro ao verificar role:', error);
        navigate('/'); // Em caso de erro, redireciona por segurança
        return;
      }

      if (!profile || profile.role !== 'admin') {
        navigate('/'); // Se não for admin, redireciona
      }
    };

    checkAdminAccess();
  }, [user, navigate]);

  // Enquanto carrega dados
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin"></div> {/* Loading spinner */}
      </div>
    );
  }

  // Se dados não carregaram corretamente
  if (!users || !stats) return null;

  // Renderiza o painel administrativo
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>

      {/* Card com estatísticas gerais */}
      <AdminStats stats={stats} />

      {/* Lista de usuários */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Lista de Usuários</h2>
        <AdminUserList users={users} />
      </div>
    </div>
  );
}
