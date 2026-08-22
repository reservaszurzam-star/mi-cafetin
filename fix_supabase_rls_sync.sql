-- ==============================================================================
-- SCRIPT DE SINCRONIZACION Y PERMISOS RLS PARA SUPABASE (MI CAFETIN / RESTAURANTE)
-- Copia y pega todo este script en el SQL Editor de tu proyecto en Supabase y dale a "RUN".
-- ==============================================================================

-- 1. TABLA: ORDERS (Comandas y Pedidos en vivo)
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_full_access" ON orders;
CREATE POLICY "orders_full_access" ON orders FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. TABLA: ORDER_ITEMS (Detalle de platos en comanda)
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_full_access" ON order_items;
CREATE POLICY "order_items_full_access" ON order_items FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. TABLA: PRODUCTS (Carta y Platos)
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_full_access" ON products;
CREATE POLICY "products_full_access" ON products FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. TABLA: CUSTOMERS (Clientes y Fiados)
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_full_access" ON customers;
CREATE POLICY "customers_full_access" ON customers FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. TABLA: CUSTOMER_TRANSACTIONS (Movimientos de cuenta corriente)
ALTER TABLE IF EXISTS customer_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_transactions_full_access" ON customer_transactions;
CREATE POLICY "customer_transactions_full_access" ON customer_transactions FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. TABLA: EXPENSES (Gastos y Egresos)
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_full_access" ON expenses;
CREATE POLICY "expenses_full_access" ON expenses FOR ALL TO public USING (true) WITH CHECK (true);

-- 7. TABLA: SETTINGS (Configuracion de Negocio y Tickets)
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_full_access" ON settings;
CREATE POLICY "settings_full_access" ON settings FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. TABLA: RESERVATIONS (Reservas y Mesas)
ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reservations_full_access" ON reservations;
CREATE POLICY "reservations_full_access" ON reservations FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. TABLA: DELIVERY_DRIVERS & DELIVERY_ZONES
ALTER TABLE IF EXISTS delivery_drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "delivery_drivers_full_access" ON delivery_drivers;
CREATE POLICY "delivery_drivers_full_access" ON delivery_drivers FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS delivery_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "delivery_zones_full_access" ON delivery_zones;
CREATE POLICY "delivery_zones_full_access" ON delivery_zones FOR ALL TO public USING (true) WITH CHECK (true);

-- 10. TABLA: SUNAT_INVOICES (Comprobantes Electronicos)
ALTER TABLE IF EXISTS sunat_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sunat_invoices_full_access" ON sunat_invoices;
CREATE POLICY "sunat_invoices_full_access" ON sunat_invoices FOR ALL TO public USING (true) WITH CHECK (true);

-- 11. TABLA: DAILY_MENU_ITEMS (Menu del Dia)
ALTER TABLE IF EXISTS daily_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_menu_items_full_access" ON daily_menu_items;
CREATE POLICY "daily_menu_items_full_access" ON daily_menu_items FOR ALL TO public USING (true) WITH CHECK (true);

-- 12. TABLA: PRINTERS (Ruteo e Impresoras)
ALTER TABLE IF EXISTS printers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "printers_full_access" ON printers;
CREATE POLICY "printers_full_access" ON printers FOR ALL TO public USING (true) WITH CHECK (true);

-- 13. TABLA: INVENTORY_ITEMS & MOVEMENTS
ALTER TABLE IF EXISTS inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_items_full_access" ON inventory_items;
CREATE POLICY "inventory_items_full_access" ON inventory_items FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_movements_full_access" ON inventory_movements;
CREATE POLICY "inventory_movements_full_access" ON inventory_movements FOR ALL TO public USING (true) WITH CHECK (true);

-- 14. TABLA: USERS & ROLE_PERMISSIONS
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_full_access" ON users;
CREATE POLICY "users_full_access" ON users FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_permissions_full_access" ON role_permissions;
CREATE POLICY "role_permissions_full_access" ON role_permissions FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- 15. HABILITAR PUBLICACION REALTIME EN SUPABASE
-- Esto asegura que cualquier cambio en la PC o celular se emita en vivo a todos los dispositivos.
-- ==============================================================================
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END \$\$;

ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_menu_items;
