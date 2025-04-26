
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
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_all_users_with_data');
      
      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar a lista de usuários.'
        });
        throw usersError;
      }

      return usersData || [];
    },
    enabled: !!user
  });

  // Busca estatísticas gerais
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase
        .rpc('get_admin_stats');

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar estatísticas',
          description: 'Não foi possível carregar os dados estatísticos.'
        });
        throw error;
      }

      return data || {
        totalUsers: 0,
        adminCount: 0,
        totalEntries: 0
      };
    },
    enabled: !!user
  });

  return {
    users,
    stats,
    isLoading: loadingUsers || loadingStats
  };
}
