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
  const { user } = useAuth(); // Recupera usuário autenticado
  const { toast } = useToast(); // Sistema de notificações (erros)

  /**
   * Carrega a lista de usuários, com contagem de aportes de cada um
   */
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'], // Chave única para cache no React Query
    queryFn: async (): Promise<AdminUserData[]> => {
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_all_users_with_data'); // Chama função RPC no Supabase

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar a lista de usuários.'
        });
        throw usersError; // Força o React Query a entender que houve erro
      }

      // Corrige nomes dos campos vindos do Supabase (snake_case para camelCase)
      return (usersData || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdat,    // Corrigido para camelCase
        lastSignIn: user.lastsignin,  // Corrigido para camelCase
        entriesCount: user.entriescount, // Corrigido para camelCase
      }));
    },
    enabled: !!user // Só busca se o usuário estiver logado
  });

  /**
   * Carrega estatísticas gerais do sistema (número de usuários, admins e aportes)
   */
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'], // Outra chave de cache
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase
        .rpc('get_admin_stats'); // Chama a função de estatísticas no Supabase

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar estatísticas',
          description: 'Não foi possível carregar os dados estatísticos.'
        });
        throw error; // Informa erro ao React Query
      }

      // Função RPC retorna um array com um único objeto, precisamos pegar data[0]
      const statsData = Array.isArray(data) && data.length > 0 ? data[0] : null;

      return statsData ? {
        totalUsers: statsData.totalusers,   // Corrigido para camelCase
        adminCount: statsData.admincount,   // Corrigido para camelCase
        totalEntries: statsData.totalentries, // Corrigido para camelCase
      } : {
        totalUsers: 0,
        adminCount: 0,
        totalEntries: 0
      };
    },
    enabled: !!user // Só busca se o usuário estiver logado
  });

  /**
   * Retorna os dados carregados para quem usar esse hook
   */
  return {
    users,        // Lista de usuários carregada
    stats,        // Estatísticas gerais
    isLoading: loadingUsers || loadingStats // Se qualquer uma das buscas estiver carregando
  };
}
