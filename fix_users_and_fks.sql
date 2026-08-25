-- ==============================================================================
-- CORRECCIÓN DEFINITIVA DE CONSTRAINTS, CLAVES FORÁNEAS Y PERMISOS DE USUARIOS
-- Proyecto: Las Lomas Grill & Paradero 104
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/nvchdamvntdykgforfyu/sql
-- ==============================================================================

-- 1. Eliminar reglas o triggers conflictivos en audit_logs
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT rulename, tablename FROM pg_rules WHERE tablename = 'audit_logs' AND schemaname = 'public') LOOP
    EXECUTE format('DROP RULE IF EXISTS %I ON public.%I;', r.rulename, r.tablename);
  END LOOP;
END $$;

-- 2. Corregir Foreign Key de audit_logs para permitir DELETE en users
ALTER TABLE IF EXISTS public.audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs 
      ADD CONSTRAINT audit_logs_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES public.users(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Corregir Foreign Key de delivery_drivers para permitir DELETE en users
ALTER TABLE IF EXISTS public.delivery_drivers 
  DROP CONSTRAINT IF EXISTS delivery_drivers_user_id_fkey;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'delivery_drivers') THEN
    ALTER TABLE public.delivery_drivers 
      ADD CONSTRAINT delivery_drivers_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES public.users(id) 
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Asegurar RLS con permisos completos en public.users y public.audit_logs
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_full_access ON public.users;
CREATE POLICY users_full_access ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_full_access ON public.audit_logs;
CREATE POLICY audit_logs_full_access ON public.audit_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Añadir tabla users a Supabase Realtime si no está añadida
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;
