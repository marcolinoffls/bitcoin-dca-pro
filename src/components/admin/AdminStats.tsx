
/**
 * Componente que exibe estatísticas gerais no painel administrativo
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats as AdminStatsType } from "@/types/admin";

interface AdminStatsProps {
  stats: AdminStatsType;
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administradores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.adminCount}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Aportes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEntries}</div>
        </CardContent>
      </Card>
    </div>
  );
}
