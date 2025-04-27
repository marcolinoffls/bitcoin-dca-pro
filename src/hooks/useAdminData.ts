/**
 * Hook para carregar dados administrativos (lista de usuários + estatísticas gerais)
 * Usado apenas por administradores no painel de controle
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminUserData, AdminStats } from '@/types/admin';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useAdminData() {
  const { user } = useAuth(); // Recupera o usuário autenticado
  const { toast } = useToast(); // Hook para exibir notificações (erros, etc.)

  /**
   * Carrega a lista de usuários, com contagem de aportes de cada um
   */
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'], // Define uma chave única de cache para esta query
    queryFn: async (): Promise<AdminUserData[]> => {
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_all_users_with_data'); // Executa função RPC criada no Supabase

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar a lista de usuários.'
        });
        throw usersError; // Propaga o erro para o React Query lidar corretamente
      }

      // Faz o mapeamento para corrigir nomes das propriedades do Supabase
      return (usersData || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdat,      // Ajuste para camelCase
        lastSignIn: user.lastsignin,    // Ajuste para camelCase
        entriesCount: user.entriescount // Ajuste para camelCase
      }));
    },
    enabled: !!user // Só executa a query se o usuário estiver logado
  });

  /**
   * Carrega estatísticas gerais do sistema (número de usuários, admins e aportes)
   */
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'], // Define uma outra chave de cache
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase
        .rpc('get_admin_stats'); // Executa a função RPC de estatísticas

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar estatísticas',
          description: 'Não foi possível carregar os dados estatísticos.'
        });
        throw error; // Propaga o erro para o React Query
      }

      // A função retorna um array com um único objeto => pegamos o primeiro elemento
      const statsData = Array.isArray(data) && data.length > 0 ? data[0] : null;

      return statsData ? {
        totalUsers: statsData.totalusers,     // Ajuste de campo snake_case para camelCase
        adminCount: statsData.admincount,     // Ajuste de campo snake_case para camelCase
        totalEntries: statsData.totalentries, // Ajuste de campo snake_case para camelCase
      } : {
        totalUsers: 0,
        adminCount: 0,
        totalEntries: 0
      };
    },
    enabled: !!user // Só executa a query se o usuário estiver logado
  });

  /**
   * Retorna os dados carregados para quem usar esse hook
   */
  return {
    users,        // Lista de usuários
    stats,        // Estatísticas gerais
    isLoading: loadingUsers || loadingStats // Status de carregamento
  };
}
