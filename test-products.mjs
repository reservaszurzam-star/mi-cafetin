import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL  = "https://nvchdamvntdykgforfyu.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2hkYW12bnRkeWtnZm9yZnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzc3MjAsImV4cCI6MjEwMjk1MzcyMH0.nfWIu3MNP0_ER8Zyu09ypG5WbpI8VLVfOO2SdDaQogs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  global: { headers: { 'x-tenant-id': 'paradero' } }
});

async function test() {
  // Test 1: sin filtro
  const { data: all, error: err1 } = await supabase.from("products").select("*").limit(5);
  console.log("Sin filtro:", all?.length ?? 0, "filas", err1?.message ?? "");

  // Test 2: filtro por tenant
  const { data: byTenant, error: err2 } = await supabase.from("products").select("*").eq("tenant_id", "paradero").limit(5);
  console.log("tenant_id=paradero:", byTenant?.length ?? 0, "filas", err2?.message ?? "");
  if (byTenant?.length) console.log("Ejemplo:", byTenant[0]);
}
test();
