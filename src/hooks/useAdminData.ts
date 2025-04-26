
/**
 * Hook para carregar dados do painel administrativo
 * Usado apenas por administradores para visualizar informações gerais dos usuários
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminUserData, AdminStats } from '@/types/admin';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useAdminData() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Busca lista de usuários com contagem de aportes
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async (): Promise<AdminUserData[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          users:auth.users!id(
            email,
            created_at,
            last_sign_in_at
          ),
          aportes:aportes(count)
        `);

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar a lista de usuários.'
        });
        throw error;
      }

      return profiles.map(profile => ({
        id: profile.id,
        email: profile.users?.email || '',
        role: profile.role as 'admin' | 'user',
        createdAt: profile.users?.created_at || '',
        lastSignIn: profile.users?.last_sign_in_at || null,
        entriesCount: profile.aportes?.[0]?.count || 0
      }));
    },
    enabled: !!user
  });

  // Busca estatísticas gerais
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role', { count: 'exact' });

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar estatísticas',
          description: 'Não foi possível carregar os dados estatísticos.'
        });
        throw error;
      }

      const adminCount = data?.filter(p => p.role === 'admin').length || 0;

      return {
        totalUsers: data?.length || 0,
        adminCount,
        totalEntries: users?.reduce((acc, user) => acc + user.entriesCount, 0) || 0
      };
    },
    enabled: !!users
  });

  return {
    users,
    stats,
    isLoading: loadingUsers || loadingStats
  };
}
