/**
 * Componente que exibe a lista de usuários no painel administrativo
 * Mostra informações básicas sem expor dados sensíveis como senhas ou saldos
 */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminUserData } from '@/types/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminUserListProps {
  users: AdminUserData[]; // Lista de usuários que vem do useAdminData
}

export function AdminUserList({ users }: AdminUserListProps) {
  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Data de criação</TableHead>
            <TableHead>Último login</TableHead>
            <TableHead>Número de aportes</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.length > 0 ? (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell className="font-mono text-xs break-all">
                  {user.id}
                </TableCell>
                <TableCell>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'admin'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {user.lastSignIn
                    ? format(new Date(user.lastSignIn), 'dd/MM/yyyy', { locale: ptBR })
                    : 'Nunca'}
                </TableCell>
                <TableCell>{user.entriesCount}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                Nenhum usuário encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
