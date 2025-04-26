
/**
 * Componente que exibe a lista de usuários no painel administrativo
 * Mostra informações básicas de cada usuário sem expor dados sensíveis
 */
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
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
  users: AdminUserData[];
}

export function AdminUserList({ users }: AdminUserListProps) {
  return (
    <div className="rounded-lg border bg-card">
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
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell className="font-mono text-xs">{user.id}</TableCell>
              <TableCell>
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
