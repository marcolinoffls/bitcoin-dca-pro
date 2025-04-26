
/**
 * Tipos para o painel administrativo
 */

// Tipo para dados de usuário exibidos no painel admin
export interface AdminUserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastSignIn: string | null;
  entriesCount: number;
}

// Tipo para estatísticas gerais do sistema
export interface AdminStats {
  totalUsers: number;
  adminCount: number;
  totalEntries: number;
}
