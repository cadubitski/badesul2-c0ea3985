-- Drop the admin-only policy
DROP POLICY IF EXISTS "Only admins can read dashboard data" ON public.dashboard_data;

-- Create new public read policy for dashboard data
CREATE POLICY "Dashboard data is publicly readable" 
ON public.dashboard_data 
FOR SELECT 
USING (true);