import React from 'react';
import {
  LayoutGrid, Receipt, ChefHat, Utensils, Lock, ShieldAlert,
  Printer, Users, CreditCard, Building2, TrendingUp, BarChart3,
  Bell, Settings as SettingsIcon, LogOut, Package, Calendar,
  Truck, ShoppingCart, Ticket, FileText, ClipboardList,
  UsersRound, ArrowLeft, BookOpen, ShieldCheck, Sliders, Crown, Trophy
} from 'lucide-react';
import { ViewState, AppSegment } from '../../App';
import { Settings, AppModuleKey } from '../../types';
import { UniversalSyncButton } from '../../components/UniversalSyncButton';

interface AppSidebarProps {
  settings: Settings;
  view: ViewState;
  activeSegment: AppSegment | null;
  notificationCount: number;
  hasPermission: (module: AppModuleKey) => boolean;
  onNavigate: (view: ViewState) => void;
  onBackToPortal: () => void;
  onLogout: () => void;
  onOpenTutorials: () => void;
}

interface NavItemProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: string | number;
  badgeType?: 'dark' | 'gold' | 'rose';
  active: boolean;
  onClick: () => void;
}

function NavItem({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeType = 'dark',
  active,
  onClick,
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-2.5 rounded-2xl transition-all duration-200 text-left flex items-center justify-between border cursor-pointer ${
        active
          ? 'bg-stone-900 text-white border-stone-900 shadow-md'
          : 'bg-white text-stone-800 border-stone-200 hover:border-amber-500/50 hover:bg-stone-50/80 shadow-xs'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div
          className={`p-2 rounded-xl flex-shrink-0 ${
            active
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-stone-100 text-stone-700'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="truncate">
          <div className={`font-bold text-xs leading-tight ${active ? 'text-white' : 'text-stone-900'}`}>
            {title}
          </div>
          <div className={`text-[10px] truncate mt-0.5 ${active ? 'text-stone-400' : 'text-stone-500'}`}>
            {subtitle}
          </div>
        </div>
      </div>
      {badge !== undefined && (
        <span
          className={`ml-1.5 flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
            badgeType === 'gold'
              ? 'bg-stone-900 text-amber-400 border border-amber-500/30'
              : badgeType === 'rose'
              ? 'bg-rose-500 text-white'
              : 'bg-stone-900 text-white'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  settings,
  view,
  activeSegment,
  notificationCount,
  hasPermission,
  onNavigate,
  onBackToPortal,
  onLogout,
  onOpenTutorials,
}) => {
  return (
    <div className="hidden md:flex w-80 bg-white border-r border-stone-200 flex-col sticky top-0 h-screen z-20 shadow-xs">
      
      {/* Brand Header */}
      <div className="p-5 flex items-center space-x-3 border-b border-stone-100">
        <img
          src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/logo-web.png"}
          alt="Logo"
          className="w-10 h-10 rounded-xl object-contain border border-stone-200 bg-white shrink-0 p-0.5"
        />
        <div className="truncate">
          <span className="text-base font-black text-stone-900 tracking-tight block truncate">
            {settings.companyName}
          </span>
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
            Sistema Gastronómico Pro
          </span>
        </div>
      </div>

      {/* Botón Universal Sincronizar Supabase */}
      <div className="px-4 pt-3 pb-1">
        <UniversalSyncButton variant="full" />
      </div>

      {/* Nav Content List */}
      <div className="p-4 pt-2 flex flex-col flex-1 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* Volver al Portal */}
        <div className="pb-2 mb-2 border-b border-stone-200">
          <button
            onClick={onBackToPortal}
            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl transition-all text-stone-600 hover:bg-stone-100 hover:text-stone-900 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Portal principal</span>
          </button>
        </div>

        {/* 1. ADMINISTRAR PLATOS */}
        {activeSegment === 'menu_admin' && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-black text-amber-800 tracking-wider uppercase">
              Gestión de Carta
            </div>
            <div className="space-y-1.5">
              {hasPermission('products') && <NavItem icon={Utensils} title="Gestión de Carta" subtitle="Platos, combos, categorías y precios" active={view.name === "products"} onClick={() => onNavigate({ name: "products" })} />}
              {hasPermission('daily_menu') && <NavItem icon={BookOpen} title="Menú del Día" subtitle="Agregar y quitar platos del menú digital" active={view.name === "daily_menu"} onClick={() => onNavigate({ name: "daily_menu" })} />}
              {hasPermission('dish_ranking') && <NavItem icon={Trophy} title="Ranking de Platos" subtitle="Top más vendidos y recaudación" badge="Top Platos" badgeType="gold" active={view.name === "dish_ranking"} onClick={() => onNavigate({ name: "dish_ranking" })} />}
              {hasPermission('promotions') && <NavItem icon={Ticket} title="Promociones & Ofertas" subtitle="Descuentos y combos" active={view.name === "promotions"} onClick={() => onNavigate({ name: "promotions" })} />}
            </div>
          </div>
        )}

        {/* 2. PUNTO DE VENTA & OPERACIONES */}
        {activeSegment === 'ops_ventas' && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-black text-amber-800 tracking-wider uppercase">
              Ventas y Operaciones
            </div>
            <div className="space-y-1.5">
              {hasPermission('dashboard') && <NavItem icon={LayoutGrid} title="Panel Principal" subtitle="Resumen en tiempo real" active={view.name === "dashboard"} onClick={() => onNavigate({ name: "dashboard" })} />}
              {hasPermission('pos') && <NavItem icon={Receipt} title="Punto de Venta" subtitle="POS y comandas" badge="POS" badgeType="gold" active={view.name === "pos"} onClick={() => onNavigate({ name: "pos" })} />}
              {hasPermission('billing') && <NavItem icon={CreditCard} title="Cobranza & Cuentas" subtitle="Boletas y divisiones" active={view.name === "billing"} onClick={() => onNavigate({ name: "billing" })} />}
              {hasPermission('cash_register') && <NavItem icon={Lock} title="Cierre de Caja" subtitle="Arqueo físico y conciliación" badge="Cierre Diario" badgeType="gold" active={view.name === "cash_register"} onClick={() => onNavigate({ name: "cash_register" })} />}
              {hasPermission('delivery') && <NavItem icon={Truck} title="Delivery & Motorizados" subtitle="Rutas y despachos WhatsApp" active={view.name === "delivery"} onClick={() => onNavigate({ name: "delivery" })} />}
              {hasPermission('reservations') && <NavItem icon={Calendar} title="Reservas & Pre-pedidos" subtitle="Mesas y adelantos" active={view.name === "reservations"} onClick={() => onNavigate({ name: "reservations" })} />}
            </div>
          </div>
        )}

        {/* 3. COCINA */}
        {activeSegment === 'ops_cocina' && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-black text-amber-800 tracking-wider uppercase">
              Operaciones de Cocina
            </div>
            <div className="space-y-1.5">
              {hasPermission('kds') && <NavItem icon={ChefHat} title="KDS Cocina & Horno" subtitle="Control de pedidos y tiempos" badge="KDS" badgeType="gold" active={view.name === "kds"} onClick={() => onNavigate({ name: "kds" })} />}
            </div>
          </div>
        )}

        {/* 4. INVENTARIO */}
        {activeSegment === 'ops_inventario' && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-black text-amber-800 tracking-wider uppercase">
              Control de Inventario
            </div>
            <div className="space-y-1.5">
              {hasPermission('inventory') && <NavItem icon={Package} title="Inventario & Stock" subtitle="Insumos y movimientos" active={view.name === "inventory"} onClick={() => onNavigate({ name: "inventory" })} />}
              {hasPermission('suppliers') && <NavItem icon={ShoppingCart} title="Compras & Proveedores" subtitle="Historial de compras" active={view.name === "suppliers"} onClick={() => onNavigate({ name: "suppliers" })} />}
              {hasPermission('recipes') && <NavItem icon={ClipboardList} title="Recetas & Escandallos" subtitle="Costos y mermas" active={view.name === "recipes"} onClick={() => onNavigate({ name: "recipes" })} />}
            </div>
          </div>
        )}

        {/* 5. FINANZAS & REPORTES */}
        {activeSegment === 'admin_finanzas' && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-black text-amber-800 tracking-wider uppercase">
              Análisis y Finanzas
            </div>
            <div className="space-y-1.5">
              {hasPermission('reports') && <NavItem icon={BarChart3} title="Reportes Diarios & Ventas" subtitle="Descarga Excel/PDF y arqueo" active={view.name === "reports"} onClick={() => onNavigate({ name: "reports" })} />}
              {hasPermission('dish_ranking') && <NavItem icon={Trophy} title="Ranking de Platos" subtitle="Top más vendidos y demanda" badge="Top Platos" badgeType="gold" active={view.name === "dish_ranking"} onClick={() => onNavigate({ name: "dish_ranking" })} />}
              {hasPermission('expenses') && <NavItem icon={TrendingUp} title="Ingresos & Gastos" subtitle="Flujo de caja" active={view.name === "expenses"} onClick={() => onNavigate({ name: "expenses" })} />}
              {hasPermission('sunat') && <NavItem icon={FileText} title="Facturación SUNAT" subtitle="Boletas y Facturas B001/F001" active={view.name === "sunat"} onClick={() => onNavigate({ name: "sunat" })} />}
              {hasPermission('cash_register') && <NavItem icon={Lock} title="Cierre de Caja" subtitle="Arqueo físico y conciliación" badge="Cierre Diario" badgeType="gold" active={view.name === "cash_register"} onClick={() => onNavigate({ name: "cash_register" })} />}
            </div>
          </div>
        )}

        {/* 6. CONFIGURACIÓN DEL SISTEMA */}
        {activeSegment === 'admin_sistema' && (
          <div>
            <div className="px-2 mb-2 text-[10px] font-black text-amber-800 tracking-wider uppercase">
              Configuración del Sistema
            </div>
            <div className="space-y-1.5">
              {hasPermission('users') && <NavItem icon={Users} title="Usuarios & Credenciales" subtitle="PINs, mozos y perfiles" active={view.name === "users"} onClick={() => onNavigate({ name: "users" })} />}
              {hasPermission('role_permissions') && <NavItem icon={Crown} title="Gobernanza de Roles" subtitle="Control de pestañas y accesos" badge="Owner" badgeType="gold" active={view.name === "role_permissions"} onClick={() => onNavigate({ name: "role_permissions" })} />}
              {hasPermission('staff') && <NavItem icon={UsersRound} title="Personal & Turnos" subtitle="Asistencia y propinas" active={view.name === "staff"} onClick={() => onNavigate({ name: "staff" })} />}
              {hasPermission('customers') && <NavItem icon={Users} title="Clientes & CRM" subtitle="Puntos y fidelización" active={view.name === "customers" || view.name === "customer_detail"} onClick={() => onNavigate({ name: "customers" })} />}
              {hasPermission('printers') && <NavItem icon={Printer} title="Impresoras & Ruteo" subtitle="Horno, Cocina, Barra y Caja" badge={4} active={view.name === "printers"} onClick={() => onNavigate({ name: "printers" })} />}
              {hasPermission('audit_log') && <NavItem icon={ShieldAlert} title="Log de Auditoría" subtitle="Eventos críticos y accesos" badge="Seguridad" badgeType="gold" active={view.name === "audit_log"} onClick={() => onNavigate({ name: "audit_log" })} />}
              {hasPermission('notifications') && <NavItem icon={Bell} title="Notificaciones" subtitle="Alertas del sistema" badge={notificationCount > 0 ? notificationCount : undefined} badgeType="rose" active={view.name === "notifications"} onClick={() => onNavigate({ name: "notifications" })} />}
              {hasPermission('settings') && <NavItem icon={SettingsIcon} title="Ajustes Generales" subtitle="Datos del negocio y logos" active={view.name === "settings"} onClick={() => onNavigate({ name: "settings" })} />}
            </div>
          </div>
        )}

        {/* Tutoriales / Guías */}
        <div className="pt-2">
          <button
            onClick={onOpenTutorials}
            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl transition-all bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold border border-amber-200 shadow-xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Tutoriales & Guías del Módulo</span>
          </button>
        </div>

        {/* Cerrar Sesión */}
        <div className="pt-2 border-t border-stone-200 mt-auto">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl transition-all text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>

      </div>
    </div>
  );
};
