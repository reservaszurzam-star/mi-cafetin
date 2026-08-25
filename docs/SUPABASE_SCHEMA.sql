-- ══════════════════════════════════════════════════════════════════════
-- MIGRACIÓN MAESTRA SQL SUPABASE - LAS LOMAS GRILL & PARADERO 104
-- Ejecutar en: https://supabase.com/dashboard/project/nvchdamvntdykgforfyu/sql
-- ══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USUARIOS & PERSONAL
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  role TEXT NOT NULL CHECK (role IN ('Owner', 'Administrador', 'Cajero', 'Mozo', 'Cocinero', 'Repartidor')),
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uk_users_tenant_username UNIQUE (tenant_id, username)
);

-- 2. MOTORIZADOS / REPARTIDORES
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  plate_number TEXT,
  vehicle_type TEXT DEFAULT 'Moto' CHECK (vehicle_type IN ('Moto', 'Bicicleta', 'Auto')),
  status TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'en_ruta', 'inactivo')),
  active_orders INT DEFAULT 0,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_gps_update TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTOS / CARTA
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL,
  station TEXT DEFAULT 'Cocina & Parrilla',
  stock INT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLIENTES (CRM)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  name TEXT NOT NULL,
  phone TEXT,
  doc_type TEXT DEFAULT 'DNI',
  doc_number TEXT,
  address TEXT,
  email TEXT,
  points INT DEFAULT 0,
  credit_limit NUMERIC(10, 2) DEFAULT 300.00,
  birthday DATE,
  notes TEXT,
  tier TEXT DEFAULT 'Bronce' CHECK (tier IN ('Bronce', 'Plata', 'Oro', 'VIP')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMANDAS & PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  type TEXT NOT NULL CHECK (type IN ('salón', 'delivery', 'para_llevar', 'venta_libre')),
  floor INT DEFAULT 1,
  table_number TEXT NOT NULL,
  custom_table_name TEXT,
  diner_name TEXT,
  customer_id TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  route_distance_km NUMERIC(6, 2),
  route_duration_mins INT,
  delivery_cost NUMERIC(10, 2) DEFAULT 0.00,
  delivery_platform TEXT DEFAULT 'directo',
  driver_id TEXT,
  driver_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_sent', 'served', 'delivered', 'paid', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  waiter_name TEXT,
  pos_terminal_id TEXT,
  pre_count_printed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DETALLE DE PLATOS POR COMANDA
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  quantity NUMERIC(6, 2) NOT NULL DEFAULT 1.00,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  station TEXT,
  sent_to_kitchen BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  batch_number INT DEFAULT 1,
  prepared BOOLEAN DEFAULT false,
  prepared_at TIMESTAMPTZ
);

-- 7. TELEMETRÍA GPS EN VIVO
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id TEXT,
  driver_user_id UUID,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONFIGURACIÓN POR SEDE
CREATE TABLE IF NOT EXISTS public.settings (
  tenant_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  slogan TEXT,
  company_ruc TEXT,
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'S/',
  low_stock_threshold INT DEFAULT 5,
  overdue_days_threshold INT DEFAULT 30,
  kitchen_delay_threshold_mins INT DEFAULT 20,
  delivery_delay_threshold_mins INT DEFAULT 35,
  sound_alerts_enabled BOOLEAN DEFAULT true,
  auto_send_to_kitchen BOOLEAN DEFAULT true,
  enable_pre_count_print BOOLEAN DEFAULT true,
  show_payment_qr BOOLEAN DEFAULT true,
  print_bank_details_on_ticket BOOLEAN DEFAULT true,
  default_delivery_cost NUMERIC(10, 2) DEFAULT 5.00,
  pos_terminal_id TEXT,
  whatsapp_orders_phone TEXT,
  whatsapp_orders_phone2 TEXT,
  whatsapp_message_greeting TEXT,
  whatsapp_custom_footer TEXT,
  whatsapp_include_address BOOLEAN DEFAULT true,
  whatsapp_include_payment BOOLEAN DEFAULT true,
  whatsapp_include_notes BOOLEAN DEFAULT true,
  daily_menu_price NUMERIC(10, 2) DEFAULT 16.00,
  daily_menu_enabled BOOLEAN DEFAULT true,
  daily_menu_start_time TEXT DEFAULT '12:00',
  daily_menu_end_time TEXT DEFAULT '16:30',
  daily_menu_title TEXT,
  daily_menu_subtitle TEXT,
  daily_menu_extra_starter_price NUMERIC(10, 2) DEFAULT 5.00,
  daily_menu_extra_drink_price NUMERIC(10, 2) DEFAULT 3.00,
  daily_menu_default_dessert_price NUMERIC(10, 2) DEFAULT 3.50,
  yape_number TEXT,
  yape_holder TEXT,
  yape_active BOOLEAN DEFAULT true,
  plin_number TEXT,
  plin_holder TEXT,
  plin_active BOOLEAN DEFAULT true,
  bank_name TEXT,
  bank_account TEXT,
  bank_cci TEXT,
  bank_holder TEXT,
  bank_active BOOLEAN DEFAULT true,
  pos_provider TEXT,
  pos_terminal_code TEXT,
  pos_commission_rate NUMERIC(5, 2) DEFAULT 0.00,
  pos_active BOOLEAN DEFAULT true,
  cash_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MENÚ EJECUTIVO DEL DÍA
CREATE TABLE IF NOT EXISTS public.daily_menu_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  name TEXT NOT NULL,
  course TEXT NOT NULL CHECK (course IN ('entrada', 'fondo', 'bebida', 'postre')),
  description TEXT,
  available BOOLEAN DEFAULT true,
  extra_price NUMERIC(10, 2) DEFAULT 0.00,
  image_url TEXT,
  popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. GASTOS Y SALIDAS DE CAJA
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Efectivo',
  date TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CRÉDITOS Y FIADOS
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  customer_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('charge', 'payment')),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  payment_method TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PROMOCIONES Y CUPONES
CREATE TABLE IF NOT EXISTS public.promotions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  discount_value NUMERIC(10, 2),
  description TEXT,
  status TEXT DEFAULT 'Activo',
  usage_count INT DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
