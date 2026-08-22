import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DeliveryDriver, DeliveryTrackingPoint, RestaurantOrder, SupabaseSyncConfig, User } from '../types';

const STORAGE_KEY = 'cafetin_supabase_config';

/**
 * Obtiene la configuración guardada de Supabase
 */
export function getSupabaseConfig(): SupabaseSyncConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        enabled: Boolean(parsed.enabled),
        lastSync: parsed.lastSync,
        syncOrders: parsed.syncOrders ?? true,
        syncDrivers: parsed.syncDrivers ?? true,
        syncTracking: parsed.syncTracking ?? true,
      };
    } catch {
      // fallback
    }
  }

  return {
    url: envUrl,
    anonKey: envKey,
    enabled: Boolean(envUrl && envKey),
    syncOrders: true,
    syncDrivers: true,
    syncTracking: true,
  };
}

/**
 * Guarda la configuración de Supabase en LocalStorage
 */
export function saveSupabaseConfig(config: Partial<SupabaseSyncConfig>): SupabaseSyncConfig {
  const current = getSupabaseConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  // Reiniciar cliente en cache
  cachedClient = null;
  return updated;
}

let cachedClient: SupabaseClient | null = null;

/**
 * Retorna la instancia activa del cliente Supabase (si está configurada)
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Error al inicializar cliente Supabase:', err);
    return null;
  }
}

/**
 * Prueba la conexión con el servidor Supabase
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL y Anon Key son requeridos.' };
  }

  try {
    const tempClient = createClient(url, anonKey);
    // Intentar leer la versión de auth o una tabla pública
    const { error } = await tempClient.from('profiles').select('id').limit(1);
    
    // Si la tabla no existe aún, pero la autenticación de Supabase responde con código de esquema, es una conexión válida
    if (error && error.code !== 'PGRST116' && error.code !== '42P01' && !error.message.includes('relation "public.profiles" does not exist')) {
      // Error de API Key inválida o URL incorrecta
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        return { success: false, message: `Error de autenticación: ${error.message}` };
      }
    }

    return { 
      success: true, 
      message: '¡Conexión establecida exitosamente con el proyecto Supabase!' 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: `Error de conexión: ${err.message || 'Verifica la URL del proyecto.'}` 
    };
  }
}

/**
 * Sincroniza la telemetría GPS del repartidor con Supabase en tiempo real
 */
export async function pushDriverGpsTracking(
  tracking: Omit<DeliveryTrackingPoint, 'id'>
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('delivery_tracking').insert({
      order_id: tracking.orderId || null,
      driver_id: tracking.driverId,
      driver_user_id: tracking.driverUserId || null,
      lat: tracking.lat,
      lng: tracking.lng,
      heading: tracking.heading || null,
      speed: tracking.speed || null,
      created_at: tracking.timestamp || new Date().toISOString(),
    });

    if (error) {
      console.warn('Error al enviar telemetría a Supabase:', error.message);
      return false;
    }

    // Actualizar también la última posición en la tabla de repartidores
    await client
      .from('delivery_drivers')
      .update({
        current_lat: tracking.lat,
        current_lng: tracking.lng,
        last_gps_update: new Date().toISOString(),
        is_online: true,
      })
      .eq('id', tracking.driverId);

    return true;
  } catch (err) {
    console.warn('Fallo de red al enviar GPS a Supabase:', err);
    return false;
  }
}

/**
 * Sincroniza pedidos de delivery con Supabase
 */
export async function syncOrderToSupabase(order: RestaurantOrder): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('orders').upsert({
      id: order.id,
      type: order.type,
      table_number: order.tableNumber,
      diner_name: order.dinerName || null,
      customer_id: order.customerId || null,
      customer_user_id: order.customerUserId || null,
      customer_phone: order.customerPhone || null,
      delivery_address: order.deliveryAddress || null,
      delivery_lat: order.deliveryLat || null,
      delivery_lng: order.deliveryLng || null,
      route_distance_km: order.routeDistanceKm || null,
      route_duration_mins: order.routeDurationMins || null,
      driver_id: order.driverId || null,
      driver_name: order.driverName || null,
      driver_user_id: order.driverUserId || null,
      status: order.status,
      total: order.total,
      delivery_cost: order.deliveryCost || 0,
      notes: order.notes || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Error al sincronizar orden en Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Excepción al sincronizar orden:', err);
    return false;
  }
}

/**
 * Sincroniza un repartidor y su usuario vinculado con Supabase
 */
export async function syncDriverToSupabase(driver: DeliveryDriver): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('delivery_drivers').upsert({
      id: driver.id,
      user_id: driver.userId || null,
      name: driver.name,
      phone: driver.phone,
      plate_number: driver.plateNumber || null,
      vehicle_type: driver.vehicleType,
      status: driver.status,
      current_lat: driver.currentLat || null,
      current_lng: driver.currentLng || null,
      last_gps_update: driver.lastGpsUpdate || null,
      is_online: driver.isOnline ?? false,
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
}

/**
 * Script de migración SQL completo para ejecutar en el SQL Editor de Supabase
 */
export const SUPABASE_SCHEMA_SQL = `-- ══════════════════════════════════════════════════════════════════════
-- MIGRACIÓN COMPLETA PARA RESTAURANTE & MÓDULO DELIVERY
-- Mi Cafetín / Don Grill - Supabase Schema
-- ══════════════════════════════════════════════════════════════════════

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Administrador', 'Cajero', 'Mozo', 'Cocinero', 'Repartidor', 'Cliente')),
  phone TEXT,
  email TEXT,
  pin TEXT DEFAULT '1234',
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE MOTORIZADOS / REPARTIDORES
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  plate_number TEXT,
  vehicle_type TEXT DEFAULT 'Moto' CHECK (vehicle_type IN ('Moto', 'Bicicleta', 'Auto')),
  status TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'en_ruta', 'inactivo')),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_gps_update TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT false,
  active_orders_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE ZONAS Y TARIFAS DE ENTREGA
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  estimated_minutes INT NOT NULL DEFAULT 30,
  polygon_coords JSONB, -- Opcional: coordenadas GeoJSON del polígono
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE COMANDAS Y PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('salón', 'delivery', 'para_llevar', 'venta_libre')),
  floor INT DEFAULT 1,
  table_number TEXT NOT NULL,
  custom_table_name TEXT,
  diner_name TEXT,
  customer_id TEXT,
  customer_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  route_distance_km NUMERIC(6, 2),
  route_duration_mins INT,
  route_geometry JSONB,
  route_summary TEXT,
  delivery_cost NUMERIC(10, 2) DEFAULT 0.00,
  delivery_platform TEXT DEFAULT 'directo',
  driver_id TEXT REFERENCES public.delivery_drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  driver_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partially_sent', 'served', 'delivered', 'paid', 'cancelled')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  waiter_name TEXT,
  pos_terminal_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE TELEMETRÍA GPS EN VIVO (Historial de rastreo de entregas)
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id TEXT REFERENCES public.delivery_drivers(id) ON DELETE CASCADE,
  driver_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_tracking_driver_time ON public.delivery_tracking(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.delivery_drivers(status);

-- 8. HABILITAR SUPABASE REALTIME PARA TELEMETRÍA Y PEDIDOS
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;

-- 9. SEGURIDAD A NIVEL DE FILA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para lectura y escritura desde la app (ajustables según reglas)
CREATE POLICY "Permitir lectura publica autenticada de profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir acceso completo a orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Permitir acceso completo a delivery_drivers" ON public.delivery_drivers FOR ALL USING (true);
CREATE POLICY "Permitir insercion y lectura de tracking GPS" ON public.delivery_tracking FOR ALL USING (true);
`;
