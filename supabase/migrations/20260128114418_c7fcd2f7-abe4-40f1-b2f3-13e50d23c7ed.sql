-- Atualizar RLS na tabela dashboard_data para restringir leitura apenas para admins autenticados
-- Primeiro removemos a política antiga que permite leitura pública
DROP POLICY IF EXISTS "Dashboard data é público para leitura" ON public.dashboard_data;

-- Criar nova política que restringe leitura apenas para administradores
CREATE POLICY "Only admins can read dashboard data" 
ON public.dashboard_data 
FOR SELECT 
USING (is_admin(auth.uid()));