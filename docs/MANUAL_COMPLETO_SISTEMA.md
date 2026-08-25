# 📖 MANUAL MAESTRO & DOCUMENTACIÓN TÉCNICA INTEGRAL
## Sistema de Gestión Gastronómica, POS, Delivery GPS & Carta Digital
**Restaurantes:** Las Lomas Grill & Paradero 104  
**Versión:** 2.5.0 Enterprise  
**Fecha de Actualización:** Agosto 2026  

---

## 📑 ÍNDICE GENERAL

1. [Visión General & Arquitectura Multi-Sede](#1-visión-general--arquitectura-multi-sede)
2. [Autenticación Dual, Roles & Seguridad](#2-autenticación-dual-roles--seguridad)
3. [Módulo de Delivery & App Móvil del Motorizado con GPS](#3-módulo-de-delivery--app-móvil-del-motorizado-con-gps)
4. [CRM & Sistema de Difusión Masiva por WhatsApp](#4-crm--sistema-de-difusión-masiva-por-whatsapp)
5. [Punto de Venta (POS), Comandas & Gestión de Salón](#5-punto-de-venta-pos-comandas--gestión-de-salón)
6. [Monitor de Cocina KDS (Kitchen Display System)](#6-monitor-de-cocina-kds-kitchen-display-system)
7. [Control de Créditos (Fiados), Finanzas & SUNAT](#7-control-de-créditos-fiados-finanzas--sunat)
8. [Estructura de Base de Datos Supabase (18 Tablas)](#8-estructura-de-base-de-datos-supabase-18-tablas)
9. [Script SQL Maestro de Migración Supabase](#9-script-sql-maestro-de-migración-supabase)
10. [Guía de Instalación, Configuración & Despliegue](#10-guía-de-instalación-configuración--despliegue)

---

## 1. VISIÓN GENERAL & ARQUITECTURA MULTI-SEDE

El sistema está diseñado bajo una arquitectura modular y reactiva con React 18, TypeScript, Tailwind CSS, Leaflet y Supabase, ofreciendo soporte nativo multi-tenant (multi-sede) para dos restaurantes independientes:

### 🏢 Sedes Configuradas:
1. **Las Lomas Grill (tenantId: `laslomas`)**
   - **Especialidad:** Pollos a la Brasa, Parrillas, Cortes Finos y Mostros.
   - **WhatsApp Línea 1 (Principal):** `+51 995 881 303` (`51995881303`)
   - **WhatsApp Línea 2 (Secundaria):** `+51 953 034 562` (`51953034562`)
   - **Logo Oficial:** `/Logo/logo-lomas-grill.png`
   - **Carta Digital Pública:** `http://localhost:3000/carta/laslomas`
   - **Menú del Día Público:** `http://localhost:3000/menu/laslomas`

2. **Paradero 104 (tenantId: `paradero`)**
   - **Especialidad:** Cevichería, Pescados & Mariscos, Platos Criollos.
   - **WhatsApp Línea 1 (Principal):** `+51 987 654 321` (`51987654321`)
   - **WhatsApp Línea 2 (Secundaria):** `+51 995 881 303` (`51995881303`)
   - **Logo Oficial:** `/Logo/logo-paradero-104.png`
   - **Carta Digital Pública:** `http://localhost:3000/carta/paradero`
   - **Menú del Día Público:** `http://localhost:3000/menu/paradero`

---

## 2. AUTENTICACIÓN DUAL, ROLES & SEGURIDAD

El sistema implementa un esquema de **Autenticación Dual** en la pantalla principal de Login (`/login`):

```
┌─────────────────────────────────────────────────────────────┐
│                    PANTALLA DE LOGIN                        │
├──────────────────────────────┬──────────────────────────────┤
│ 1. CUENTAS SUPABASE AUTH     │ 2. PERSONAL CREADO EN WEB    │
│    (Owner / Administrador)   │    (Mozos, Cocina, Choferes) │
│ • Ingreso: Correo Oficial    │ • Ingreso: Nombre de Usuario │
│ • Clave: Contraseña Maestra  │ • Clave: PIN de 4 dígitos    │
└──────────────────────────────┴──────────────────────────────┘
```

### 👥 Jerarquía de Roles y Privilegios:
- 👑 **Owner (Dueño Supremo):** Acceso total e ilimitado a todas las sedes, auditoría completa y **Simulador de Roles en Vivo** para supervisar la experiencia de cualquier cargo sin cambiar de cuenta.
- 🛡️ **Administrador:** Gestión operativa completa de la sede asignada (personal, finanzas, carta, configuraciones).
- 💵 **Cajero:** Apertura y cierre de caja, cobro de comandas, emisión de boletas/facturas SUNAT y liquidación de repartidores.
- 🍽️ **Mozo:** Asignación de mesas, apertura de comandas, adición de platos y solicitud de pre-cuenta.
- 👨‍🍳 **Cocinero / Chef:** Visualización y despacho de comandas en el monitor KDS con alertas de demora.
- 🛵 **Repartidor / Motorizado:** App móvil de despacho, visualización de rutas en mapa interactivo Leaflet, navegación GPS (Google Maps / Waze) y cobranza contra entrega.

---

## 3. MÓDULO DE DELIVERY & APP MÓVIL DEL MOTORIZADO CON GPS

El módulo de delivery incluye una aplicación móvil dedicada (`DriverAppView.tsx`) optimizada para teléfonos inteligentes:

### 🚀 Funcionalidades Clave del Motorizado:
1. **Geolocalización en Tiempo Real:**
   - Solicita permisos de ubicación obligatorios al iniciar (`navigator.geolocation` con `enableHighAccuracy: true`).
   - Muestra el estado del sensor: `🛰️ GPS ACTIVO (Precisión: ±5m)`.
   - Transmite coordenadas periódicamente a la base de datos Supabase (`delivery_tracking`).
2. **Bandeja de Pedidos Disponibles:**
   - Visualiza pedidos listos sin chofer asignado con el botón: `🛵 Aceptar Pedido & Iniciar Ruta ➔`.
3. **Ruteo & Navegación:**
   - Traza la ruta vial punto a punto utilizando el motor OSRM sobre OpenStreetMap.
   - Muestra distancia en kilómetros y tiempo estimado de llegada en minutos.
   - Accesos directos de 1 toque para abrir la navegación guiada por voz en **Google Maps** o **Waze**.
4. **Contacto Inmediato con el Cliente:**
   - Botón de llamada telefónica directa.
   - Botón de WhatsApp con mensaje pre-armado de aviso de llegada.
5. **Cierre de Entrega & Liquidación:**
   - Modal de cobranza rápida con selección de método de pago (Efectivo, Yape, Plin, Tarjeta).
   - Resumen del turno en la pestaña `📊 Entregas Hoy` con total recaudado a rendir en caja.

---

## 4. CRM & SISTEMA DE DIFUSIÓN MASIVA POR WHATSAPP

Ubicado en el módulo **Clientes ➔ `📢 Difusión Masiva WhatsApp`**:

### 🎯 Características Principales:
1. **Plantillas Optimizadas con Emojis Gastronómicos:**
   - Emojis nativos de pollería y parrilla (🍗, 🔥, 🥩, 🍟, 🛵, 🥣, 🍛, 🥤, 😋, 🚀, 🎁, ✨, 🙏).
   - Formato oficial de WhatsApp (negritas `*...*` y cursivas `_..._`).
   - Cero caracteres corruptos gracias al uso de secuencias Unicode explícitas y la ruta segura `api.whatsapp.com/send`.
2. **Cargador de Imagen / Flyer Promocional:**
   - Botón para subir cualquier foto de oferta o plato desde la computadora o celular.
   - Botón **`🖼️ Copiar Foto`** para copiar la imagen al portapapeles y pegarla con `Ctrl + V` en WhatsApp Web.
3. **Segmentación de Destinatarios:**
   - *Todos los clientes con celular registrado.*
   - *Clientes VIP y Frecuentes.*
   - *Clientes con saldo pendiente / deudores.*
4. **Canales de Envío:**
   - **Difusión Masiva en 1 segundo:** Botón `📋 Copiar Texto para Difusión` para enviar hasta a 256 contactos a la vez vía lista de difusión.
   - **Cola de Envío 1 a 1:** Botones individuales con marcado automático de `✓ Enviado`.
   - **Exportación CSV:** Descarga de base de datos de números para importación en celulares.

---

## 5. PUNTO DE VENTA (POS), COMANDAS & GESTIÓN DE SALÓN

El POS está diseñado para una atención de alta velocidad en restaurante:

- **Plano de Mesas por Pisos:** Selector visual de Pisos (1, 2, etc.) con estados por color:
  - 🟢 *Libre*
  - 🟠 *Ocupada / Con Comanda Activa*
  - 🟣 *Pre-cuenta Impresa (Solicitó la cuenta)*
  - 🔵 *En Proceso de Pago*
- **Soporte de Adiciones / Tandas de Pedido:**
  - Platos agregados en diferentes momentos quedan organizados por tanda (Tanda 1, Tanda 2...) para no duplicar impresiones en cocina.
- **Modos de Operación:**
  - 🍽️ *Salón (Mesas)*
  - 🛵 *Delivery Directo*
  - 🛍️ *Para Llevar (Takeaway)*
  - ⚡ *Venta Libre / Mostrador Rápido*

---

## 6. MONITOR DE COCINA KDS (KITCHEN DISPLAY SYSTEM)

Pantalla táctil para cocineros y maestros polleros:

- **Estaciones Independientes:**
  - `Horno & Pollos`
  - `Cocina & Parrilla`
  - `Barra & Bebidas`
  - `Estación Postres`
  - `Despacho Central Master`
- **Alertas Visuales por Semáforo:**
  - 🟢 Normal: < 15 minutos
  - 🟡 Alerta de demora: > 15 minutos
  - 🔴 Crítico / Peligro: > 25 minutos
- **Marcado de Platos Preparados:**
  - Permite tachar platos individualmente o despachar la comanda completa con un solo toque.

---

## 7. CONTROL DE CRÉDITOS (FIADOS), FINANZAS & SUNAT

- **Módulo de Fiados y Clientes:**
  - Registro de consumos a crédito con límite máximo configurable.
  - Historial de abonos (pagos parciales) y constancias.
  - Recordatorios de cobranza por WhatsApp con botón de 1 clic.
- **Arqueo de Caja & Gastos:**
  - Control de egresos operativos (compras de insumos del día, pagos a proveedores, caja chica).
  - Reporte de ventas desglosado por método de pago (Efectivo, Yape, Plin, Tarjeta).
- **Facturación Electrónica SUNAT:**
  - Emisión de Boletas Electrónicas (B001) y Facturas Electrónicas (F001).
  - Cálculo automático de Base Imponible (82%) e IGV (18%).
  - Generación de Código QR y Hash digital para el ticket térmico.

---

## 8. ESTRUCTURA DE BASE DE DATOS SUPABASE (18 TABLAS)

El sistema opera con las siguientes tablas relacionales en Supabase:

| N° | Tabla | Propósito |
| :-: | :--- | :--- |
| 1 | **`orders`** | Comandas, mesas, pedidos delivery, montos, estado y ruteo. |
| 2 | **`order_items`** | Detalle de platos por orden, tandas, notas y estación de cocina. |
| 3 | **`products`** | Carta completa de platos, precios, categorías y stock. |
| 4 | **`customers`** | Cartera de clientes, saldo deudor, puntos de fidelización y DNI/RUC. |
| 5 | **`credit_transactions`** | Movimientos de crédito (cargos por consumo y abonos de pago). |
| 6 | **`daily_menu_items`** | Menú ejecutivo diario (entradas, fondos, bebidas y extras). |
| 7 | **`expenses`** | Salidas de caja y gastos operativos del turno. |
| 8 | **`inventory_items`** | Insumos, stock actual, stock mínimo y costos por unidad. |
| 9 | **`inventory_movements`** | Kardex de inventario (entradas, salidas, mermas). |
| 10 | **`delivery_drivers`** | Ficha de repartidores, placas, vehículo y estado online. |
| 11 | **`delivery_tracking`** | Coordenadas GPS en vivo y telemetría de las motos. |
| 12 | **`delivery_zones`** | Zonas de cobertura, tarifas de envío y tiempos estimados. |
| 13 | **`users`** | Cuentas de usuarios del personal, roles, PIN y credenciales. |
| 14 | **`role_permissions`** | Configuración de módulos autorizados para cada rol. |
| 15 | **`settings`** | Configuración de la sede (WhatsApps, logos, precios de menú, bancos). |
| 16 | **`printers`** | Impresoras térmicas de red, Bluetooth o USB por estación. |
| 17 | **`reservations`** | Reservas de mesas, número de comensales y adelantos. |
| 18 | **`sunat_invoices`** | Registro histórico de boletas y facturas electrónicas emitidas. |
| 19 | **`promotions`** | Promociones activas, combos y cupones de descuento. |
| 20 | **`audit_logs`** | Registro de seguridad y auditoría de acciones del personal. |

---

## 9. SCRIPT SQL MAESTRO DE MIGRACIÓN SUPABASE

Para crear o verificar la base de datos completa en Supabase, copia y ejecuta el siguiente script en el **SQL Editor** de tu panel de Supabase:

```sql
-- ══════════════════════════════════════════════════════════════════════
-- MIGRACIÓN MAESTRA SUPABASE - LAS LOMAS GRILL & PARADERO 104
-- ══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE USUARIOS & PERSONAL
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

-- 2. TABLA DE REPARTIDORES / MOTORIZADOS
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

-- 3. TABLA DE PRODUCTOS / CARTA
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

-- 4. TABLA DE CLIENTES (CRM)
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

-- 5. TABLA DE COMANDAS & PEDIDOS
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

-- 6. TABLA DE DETALLE DE PLATOS POR COMANDA
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

-- 7. TABLA DE TELEMETRÍA GPS EN VIVO
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

-- 8. TABLA DE CONFIGURACIÓN POR SEDE
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

-- 9. TABLA DE MENÚ EJECUTIVO DEL DÍA
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

-- 10. TABLA DE GASTOS Y SALIDAS DE CAJA
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'laslomas',
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Efectivo',
  date TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLA DE CRÉDITOS Y FIADOS (TRANSACCIONES)
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

-- 12. TABLA DE PROMOCIONES Y CUPONES
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

-- HABILITAR REALTIME EN TABLAS CLAVE
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
```

---

## 10. GUÍA DE INSTALACIÓN, CONFIGURACIÓN & DESPLIEGUE

### 💻 Requisitos Previos:
- Node.js versión 18 o superior.
- Navegador web moderno (Chrome, Edge, Safari, Firefox).
- Cuenta en Supabase (opcional para sincronización en la nube).

### 🚀 Pasos para Iniciar en Local:
1. Abrir terminal en la carpeta del proyecto:
   ```bash
   cd "D:\cafetín-manager"
   ```
2. Instalar dependencias (si es primera vez):
   ```bash
   npm install
   ```
3. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir en el navegador:
   👉 **`http://localhost:3000/`**

---
*Fin de la Documentación Oficial — Sistema Gastronómico Las Lomas Grill & Paradero 104.*
