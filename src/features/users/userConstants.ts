import React from 'react';
import { 
  ShieldCheck, Banknote, UserCheck, ChefHat, Bike, 
  LayoutGrid, Receipt, CreditCard, Lock, Truck, Calendar,
  Utensils, BookOpen, Ticket, Layers, Package, ShoppingCart,
  BarChart3, TrendingUp, FileText, UsersRound, Users, Printer,
  ShieldAlert, Bell, Settings, Crown
} from 'lucide-react';
import { RoleType, AppModuleKey } from '../../types';

export interface RoleMeta {
  label: string;
  desc: string;
  level: string;
  icon: React.ElementType;
  badgeColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

export const ROLES_INFO: Record<RoleType, RoleMeta> = {
  Owner: {
    label: "Owner / Dueño Supremo",
    desc: "Propietario general con acceso irrestricto y absoluto a todas las sedes, módulos, configuraciones y finanzas de la corporación.",
    level: "Nivel 0 · Acceso Multi-Sede Total",
    icon: Crown,
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    borderColor: "border-amber-400",
    bgColor: "bg-amber-50",
    textColor: "text-amber-800"
  },
  Administrador: {
    label: "Administrador General",
    desc: "Acceso total sin restricciones a todas las funciones, reportes, usuarios, configuración y finanzas.",
    level: "Nivel 1 · Acceso Total",
    icon: ShieldCheck,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    borderColor: "border-purple-300",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700"
  },
  Cajero: {
    label: "Cajero / Facturación",
    desc: "Apertura y cierre de caja, cobro de cuentas, emisión de comprobantes SUNAT y ventas libres.",
    level: "Nivel 2 · Comercial & Caja",
    icon: Banknote,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700"
  },
  Mozo: {
    label: "Mozo / Salón",
    desc: "Toma de comandas por mesa, selección de platos, envío a cocina y pre-cuentas para clientes.",
    level: "Nivel 3 · Atención Salón",
    icon: UserCheck,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    borderColor: "border-amber-300",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700"
  },
  Cocinero: {
    label: "Chef / Cocina & Horno",
    desc: "Visualización del Monitor KDS, actualización de estados de preparación y recetarios.",
    level: "Nivel 3 · Operación Cocina",
    icon: ChefHat,
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
    borderColor: "border-orange-300",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700"
  },
  Repartidor: {
    label: "Repartidor / Motorizado",
    desc: "Recepción de pedidos de delivery, navegación de rutas GPS y confirmación de entrega.",
    level: "Nivel 3 · Despacho & Rutas",
    icon: Bike,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700"
  }
};

export interface ModuleDef {
  key: AppModuleKey;
  name: string;
  desc: string;
  category: 'operaciones' | 'cocina_carta' | 'inventario' | 'finanzas' | 'sistema';
  icon: React.ElementType;
}

export const MODULE_DEFINITIONS: ModuleDef[] = [
  // Operaciones & Ventas
  { key: 'dashboard', name: 'Panel Principal', desc: 'Resumen en tiempo real y métricas del día', category: 'operaciones', icon: LayoutGrid },
  { key: 'pos', name: 'Punto de Venta (POS)', desc: 'Toma de pedidos, comandas y salón', category: 'operaciones', icon: Receipt },
  { key: 'billing', name: 'Cobranza & Cuentas', desc: 'Cobro de mesas, división de cuentas y boletas', category: 'operaciones', icon: CreditCard },
  { key: 'cash_register', name: 'Cierre de Caja', desc: 'Arqueo de caja físico y conciliación diaria', category: 'operaciones', icon: Lock },
  { key: 'delivery', name: 'Delivery & Rutas', desc: 'Despacho de pedidos, motorizados y mapas', category: 'operaciones', icon: Truck },
  { key: 'reservations', name: 'Reservas & Mesas', desc: 'Control de reservas y pre-pedidos de clientes', category: 'operaciones', icon: Calendar },

  // Cocina & Carta
  { key: 'kds', name: 'Monitor KDS Cocina', desc: 'Pantalla de cocina y tiempos de preparación', category: 'cocina_carta', icon: ChefHat },
  { key: 'products', name: 'Gestión de Carta', desc: 'Platos, categorías, fotos y precios', category: 'cocina_carta', icon: Utensils },
  { key: 'daily_menu', name: 'Menú del Día Digital', desc: 'Configuración de entradas, fondos y bebidas', category: 'cocina_carta', icon: BookOpen },
  { key: 'promotions', name: 'Promociones & Ofertas', desc: 'Descuentos, combos y precios especiales', category: 'cocina_carta', icon: Ticket },
  { key: 'recipes', name: 'Recetas & Rendimiento', desc: 'Fichas técnicas y costos de preparación', category: 'cocina_carta', icon: Layers },

  // Inventario & Proveedores
  { key: 'inventory', name: 'Inventario & Stock', desc: 'Control de insumos, stock mínimo y mermas', category: 'inventario', icon: Package },
  { key: 'suppliers', name: 'Compras & Proveedores', desc: 'Órdenes de compra y cuentas de insumos', category: 'inventario', icon: ShoppingCart },

  // Finanzas & Legal
  { key: 'reports', name: 'Reportes & Estadísticas', desc: 'Reportes de ventas, platos top y exportación', category: 'finanzas', icon: BarChart3 },
  { key: 'expenses', name: 'Ingresos & Gastos', desc: 'Flujo de caja menor, egresos y servicios', category: 'finanzas', icon: TrendingUp },
  { key: 'sunat', name: 'Facturación SUNAT', desc: 'Emisión y envío de Boletas y Facturas electrónicas', category: 'finanzas', icon: FileText },

  // Administración & Sistema
  { key: 'users', name: 'Usuarios & Credenciales', desc: 'Gestión de cuentas, nombres y códigos PIN', category: 'sistema', icon: Users },
  { key: 'role_permissions', name: 'Permisos de Pestañas', desc: 'Configuración visual de visibilidad de módulos por rol', category: 'sistema', icon: ShieldCheck },
  { key: 'staff', name: 'Personal & Turnos', desc: 'Asistencia, horarios y control de personal [Exclusivo Owner]', category: 'sistema', icon: UsersRound },
  { key: 'customers', name: 'Clientes & Fidelización', desc: 'Base de clientes, puntos y crédito fiado', category: 'sistema', icon: Users },
  { key: 'printers', name: 'Impresoras de Comandas', desc: 'Ruteo a horno, cocina, barra y caja', category: 'sistema', icon: Printer },
  { key: 'audit_log', name: 'Log de Auditoría', desc: 'Registro de seguridad de acciones críticas', category: 'sistema', icon: ShieldAlert },
  { key: 'notifications', name: 'Notificaciones', desc: 'Alertas de stock, pedidos y avisos', category: 'sistema', icon: Bell },
  { key: 'settings', name: 'Ajustes del Negocio', desc: 'Configuración general, logo y moneda', category: 'sistema', icon: Settings },
];

export const CATEGORY_NAMES: Record<string, { label: string; icon: React.ElementType }> = {
  operaciones: { label: 'Ventas y Operaciones de Salón', icon: LayoutGrid },
  cocina_carta: { label: 'Cocina, Carta & Menú Digital', icon: ChefHat },
  inventario: { label: 'Inventario, Stock & Compras', icon: Package },
  finanzas: { label: 'Finanzas, Caja & Facturación SUNAT', icon: Banknote },
  sistema: { label: 'Administración, Personal & Sistema', icon: Settings },
};

export const ALL_ROLES: RoleType[] = ['Owner', 'Administrador', 'Cajero', 'Mozo', 'Cocinero', 'Repartidor'];
