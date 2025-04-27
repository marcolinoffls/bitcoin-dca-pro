/**
 * Tipos para o painel administrativo
 * 
 * Esses tipos garantem que os dados recebidos do Supabase estejam corretos,
 * e ajudam no autocomplete, validação e segurança de tipos no frontend.
 */

// Tipo para dados individuais de usuários exibidos no painel admin
export interface AdminUserData {
  id: string;                      // ID único do usuário (UUID do Supabase Auth)
  email: string;                   // Email de login do usuário
  role: 'admin' | 'user';           // Papel do usuário (admin ou comum)
  createdAt: string;                // Data de criação da conta (ISO string)
  lastSignIn: string | null;        // Último login do usuário (pode ser null)
  entriesCount: number;             // Quantidade de aportes cadastrados
}

// Tipo para estatísticas gerais do sistema exibidas no painel admin
export interface AdminStats {
  totalUsers: number;               // Quantidade total de usuários registrados
  adminCount: number;               // Quantidade total de usuários admins
  totalEntries: number;             // Quantidade total de aportes registrados
}
