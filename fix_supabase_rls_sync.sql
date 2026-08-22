-- ==============================================================================
-- SCRIPT CORREGIDO Y RESILIENTE DE SINCRONIZACION RLS Y REALTIME (SUPABASE)
-- ==============================================================================

DO \$\$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'orders',
    'order_items',
    'products',
    'customers',
    'credit_transactions',
    'expenses',
    'settings',
    'reservations',
    'delivery_drivers',
    'delivery_zones',
    'sunat_invoices',
    'daily_menu_items',
    'printers',
    'inventory_items',
    'inventory_movements',
    'users',
    'role_permissions'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t || '_full_access', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', t || '_full_access', t);
    END IF;
  END LOOP;
END \$\$;

-- HABILITAR REALTIME
DO \$\$
DECLARE
  t text;
  rt_tbls text[] := ARRAY['orders', 'order_items', 'products', 'customers', 'delivery_drivers', 'daily_menu_items', 'credit_transactions'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY rt_tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
      END IF;
    END IF;
  END LOOP;
END \$\$;
