import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://nvchdamvntdykgforfyu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2hkYW12bnRkeWtnZm9yZnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzc3MjAsImV4cCI6MjEwMjk1MzcyMH0.nfWIu3MNP0_ER8Zyu09ypG5WbpI8VLVfOO2SdDaQogs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});

/**
 * Devuelve un cliente de Supabase con el tenant_id configurado en la sesión.
 * Todas las políticas RLS de la base de datos leen esta variable.
 */
export function getSupabaseForTenant(tenantId: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
    global: {
      headers: {
        // Pasa el tenant activo; leído por current_setting('app.tenant_id') en RLS
        'x-tenant-id': tenantId,
      },
    },
  });
}

export type SupabaseClient = ReturnType<typeof getSupabaseForTenant>;
