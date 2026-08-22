import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://nvchdamvntdykgforfyu.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2hkYW12bnRkeWtnZm9yZnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzc3MjAsImV4cCI6MjEwMjk1MzcyMH0.nfWIu3MNP0_ER8Zyu09ypG5WbpI8VLVfOO2SdDaQogs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers: { 'x-tenant-id': 'paradero' } } });

async function check() {
  const { data, error } = await supabase.from("products").select("*").limit(1);
  if (error) console.error("Error products:", error);
  else console.log("Products:", data);
}
check();
