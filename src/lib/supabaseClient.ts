import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://nvchdamvntdykgforfyu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2hkYW12bnRkeWtnZm9yZnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzc3MjAsImV4cCI6MjEwMjk1MzcyMH0.nfWIu3MNP0_ER8Zyu09ypG5WbpI8VLVfOO2SdDaQogs';

// Cliente principal singleton responsable de la autenticación de sesión
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Cache de clientes por tenant para evitar crear múltiples GoTrueClients
const tenantClients = new Map<string, any>();

/**
 * Devuelve un cliente de Supabase optimizado para el tenant_id actual.
 * Utiliza cache en memoria y delega la sesión al cliente principal.
 */
export function getSupabaseForTenant(tenantId: string) {
  const cached = tenantClients.get(tenantId);
  if (cached) return cached;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: false, // La autenticación la gestiona el singleton principal
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-tenant-id': tenantId,
      },
    },
  });

  tenantClients.set(tenantId, client);
  return client;
}

export type SupabaseClient = ReturnType<typeof getSupabaseForTenant>;
