import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL  = "https://nvchdamvntdykgforfyu.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2hkYW12bnRkeWtnZm9yZnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzc3MjAsImV4cCI6MjEwMjk1MzcyMH0.nfWIu3MNP0_ER8Zyu09ypG5WbpI8VLVfOO2SdDaQogs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
async function getCols() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&limit=1`, {
    headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
  });
  console.log(await res.text());
}
getCols();
