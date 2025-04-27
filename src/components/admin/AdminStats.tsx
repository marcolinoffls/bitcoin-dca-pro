/**
 * Componente que exibe estatísticas gerais no painel administrativo
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats as AdminStatsType } from "@/types/admin";

interface AdminStatsProps {
  stats: AdminStatsType; // Dados vindos do hook useAdminData
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 w-full">
      {/* Card: Total de Usuários */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Total de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalUsers}
          </div>
        </CardContent>
      </Card>

      {/* Card: Administradores */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Administradores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {stats.adminCount}
          </div>
        </CardContent>
      </Card>

      {/* Card: Total de Aportes */}
      <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Total de Aportes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalEntries}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
