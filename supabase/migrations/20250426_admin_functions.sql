
-- Função para verificar se um usuário é administrador
CREATE OR REPLACE FUNCTION public.check_if_user_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Função para obter dados de todos os usuários para o painel admin
CREATE OR REPLACE FUNCTION public.get_all_users_with_data()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  createdAt TIMESTAMPTZ,
  lastSignIn TIMESTAMPTZ,
  entriesCount BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    p.role,
    au.created_at as createdAt,
    au.last_sign_in_at as lastSignIn,
    COUNT(a.id)::BIGINT as entriesCount
  FROM 
    auth.users au
  LEFT JOIN 
    public.profiles p ON au.id = p.id
  LEFT JOIN 
    public.aportes a ON au.id = a.user_id
  GROUP BY 
    au.id, au.email, p.role, au.created_at, au.last_sign_in_at
  ORDER BY 
    au.created_at DESC;
END;
$$;

-- Função para obter estatísticas gerais para o painel admin
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  totalUsers BIGINT,
  adminCount BIGINT,
  totalEntries BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM auth.users)::BIGINT as totalUsers,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin')::BIGINT as adminCount,
    (SELECT COUNT(*) FROM public.aportes)::BIGINT as totalEntries;
END;
$$;
