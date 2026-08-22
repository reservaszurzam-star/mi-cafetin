import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL  = "https://nvchdamvntdykgforfyu.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Y2hkYW12bnRkeWtnZm9yZnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzc3MjAsImV4cCI6MjEwMjk1MzcyMH0.nfWIu3MNP0_ER8Zyu09ypG5WbpI8VLVfOO2SdDaQogs";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers: { 'x-tenant-id': 'paradero' } } });

async function insert() {
  const { data, error } = await supabase.from("products").insert([{
    name: "Test",
    price: 10,
    category: "Test",
    tenant_id: "paradero"
  }]).select();
  if (error) console.error("Error inserting:", error);
  else {
    console.log("Inserted:", data);
    await supabase.from("products").delete().eq("id", data[0].id);
  }
}
insert();
