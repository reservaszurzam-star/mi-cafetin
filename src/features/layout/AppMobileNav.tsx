import React from 'react';
import {
  LayoutGrid, Receipt, ChefHat, Truck, Menu, X, BookOpen,
  ArrowLeft, Building2, Utensils, Ticket, Lock, CreditCard,
  Calendar, Package, ShoppingCart, ClipboardList, BarChart3,
  TrendingUp, FileText, Users, Crown, UsersRound, Printer,
  ShieldAlert, Bell, Settings as SettingsIcon, LogOut
} from 'lucide-react';
import { ViewState, AppSegment } from '../../App';
import { Settings, AppModuleKey } from '../../types';
import { UniversalSyncButton } from '../../components/UniversalSyncButton';

interface AppMobileNavProps {
  settings: Settings;
  view: ViewState;
  activeSegment: AppSegment | null;
  notificationCount: number;
  hasPermission: (module: AppModuleKey) => boolean;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onNavigate: (view: ViewState) => void;
  onBackToPortal: () => void;
  onBackToBrands: () => void;
  onLogout: () => void;
  onOpenTutorials: () => void;
}

export const AppMobileNav: React.FC<AppMobileNavProps> = ({
  settings,
  view,
  activeSegment,
  notificationCount,
  hasPermission,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onNavigate,
  onBackToPortal,
  onBackToBrands,
  onLogout,
  onOpenTutorials,
}) => {
  const handleNav = (v: ViewState) => {
    onNavigate(v);
    onCloseMobileMenu();
  };

  return (
    <>
      {/* ── TOPBAR MOBILE ── */}
      <div className="md:hidden bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between sticky top-0 z-40 shadow-xs gap-2">
        <div className="flex items-center space-x-2 font-bold text-stone-900 min-w-0">
          <img
            src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/logo-web.png"}
            alt="Logo"
            className="w-8 h-8 rounded-lg object-contain bg-white border border-stone-200 shrink-0"
          />
          <div className="min-w-0">
            <span className="text-xs font-black tracking-tight leading-tight block truncate max-w-[110px]">
              {settings.companyName}
            </span>
            <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider block">
              Sistema Pro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Botón Sincronizar Supabase Universal */}
          <UniversalSyncButton variant="compact" />

          <button
            onClick={onBackToBrands}
            className="px-2 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] font-bold rounded-xl border border-stone-200 flex items-center gap-1 transition cursor-pointer"
            title="Cambiar de Sede o Negocio"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Sedes</span>
          </button>

          <button
            onClick={onBackToPortal}
            className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold rounded-xl border border-amber-200 flex items-center gap-1 transition cursor-pointer"
            title="Ir al Portal de Módulos"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Portal</span>
          </button>

          <button
            onClick={onToggleMobileMenu}
            className="p-1.5 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── OVERLAY + PANEL LATERAL SLIDE-IN (MOBILE) ── */}
      {isMobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobileMenu}
          />
          <div className="md:hidden fixed top-0 right-0 bottom-0 w-[88vw] max-w-sm bg-white z-[60] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            
            {/* Header del Cajón Móvil */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 shrink-0 bg-stone-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/logo-web.png"}
                  alt="Logo"
                  className="w-9 h-9 rounded-xl object-contain border border-stone-200 bg-white shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-black text-sm text-stone-900 truncate">{settings.companyName}</div>
                  <div className="text-[10px] text-amber-700 font-black uppercase tracking-wider">Menú de Navegación</div>
                </div>
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Sincronizar dentro del menú */}
            <div className="p-3 border-b border-stone-200 bg-emerald-50/40">
              <UniversalSyncButton variant="full" />
            </div>

            {/* Accesos Rápidos de Sede y Portal */}
            <div className="p-3 border-b border-stone-200 bg-amber-50/50 flex gap-2 shrink-0">
              <button
                onClick={() => { onBackToBrands(); onCloseMobileMenu(); }}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-900 border border-stone-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Cambiar Sede</span>
              </button>
              <button
                onClick={() => { onBackToPortal(); onCloseMobileMenu(); }}
                className="flex-1 py-2.5 px-3 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Ir al Portal</span>
              </button>
            </div>

            {/* Lista Completa de Módulos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              
              {/* Bloque 1: Salón & Ventas */}
              <div>
                <div className="px-2 mb-2 text-[10px] font-black text-amber-900 tracking-wider uppercase">
                  Ventas & Salón
                </div>
                <div className="space-y-1.5">
                  {hasPermission('dashboard') && (
                    <button
                      onClick={() => handleNav({ name: "dashboard" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "dashboard" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <LayoutGrid className={`w-4 h-4 ${view.name === "dashboard" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Panel Principal</div>
                          <div className={`text-[10px] ${view.name === "dashboard" ? "text-stone-400" : "text-stone-500"}`}>Resumen en tiempo real</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('pos') && (
                    <button
                      onClick={() => handleNav({ name: "pos" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "pos" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Receipt className={`w-4 h-4 ${view.name === "pos" ? "text-amber-400" : "text-amber-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Punto de Venta (POS)</div>
                          <div className={`text-[10px] ${view.name === "pos" ? "text-stone-400" : "text-stone-500"}`}>Mesas y comandas activas</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500 text-stone-950">POS</span>
                    </button>
                  )}

                  {hasPermission('billing') && (
                    <button
                      onClick={() => handleNav({ name: "billing" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "billing" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-4 h-4 ${view.name === "billing" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Cobranza & Cuentas</div>
                          <div className={`text-[10px] ${view.name === "billing" ? "text-stone-400" : "text-stone-500"}`}>Pre-cuentas y pagos en vivo</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('cash_register') && (
                    <button
                      onClick={() => handleNav({ name: "cash_register" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "cash_register" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className={`w-4 h-4 ${view.name === "cash_register" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Cierre de Caja & Arqueo</div>
                          <div className={`text-[10px] ${view.name === "cash_register" ? "text-stone-400" : "text-stone-500"}`}>Arqueo físico y reporte Z</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('delivery') && (
                    <button
                      onClick={() => handleNav({ name: "delivery" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "delivery" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className={`w-4 h-4 ${view.name === "delivery" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Delivery & Motorizados</div>
                          <div className={`text-[10px] ${view.name === "delivery" ? "text-stone-400" : "text-stone-500"}`}>Despachos y rutas</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('reservations') && (
                    <button
                      onClick={() => handleNav({ name: "reservations" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "reservations" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-4 h-4 ${view.name === "reservations" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Reservas & Pre-pedidos</div>
                          <div className={`text-[10px] ${view.name === "reservations" ? "text-stone-400" : "text-stone-500"}`}>Mesas y adelantos</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Bloque 2: Cocina & Carta */}
              <div>
                <div className="px-2 mb-2 text-[10px] font-black text-amber-900 tracking-wider uppercase">
                  Cocina & Carta
                </div>
                <div className="space-y-1.5">
                  {hasPermission('kds') && (
                    <button
                      onClick={() => handleNav({ name: "kds" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "kds" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ChefHat className={`w-4 h-4 ${view.name === "kds" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">KDS Cocina & Horno</div>
                          <div className={`text-[10px] ${view.name === "kds" ? "text-stone-400" : "text-stone-500"}`}>Control de preparación</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('products') && (
                    <button
                      onClick={() => handleNav({ name: "products" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "products" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Utensils className={`w-4 h-4 ${view.name === "products" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Gestión de Carta (Platos)</div>
                          <div className={`text-[10px] ${view.name === "products" ? "text-stone-400" : "text-stone-500"}`}>Precios y categorías</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('daily_menu') && (
                    <button
                      onClick={() => handleNav({ name: "daily_menu" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "daily_menu" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className={`w-4 h-4 ${view.name === "daily_menu" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Menú del Día Digital</div>
                          <div className={`text-[10px] ${view.name === "daily_menu" ? "text-stone-400" : "text-stone-500"}`}>Entradas, fondos y refrescos</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('promotions') && (
                    <button
                      onClick={() => handleNav({ name: "promotions" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "promotions" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className={`w-4 h-4 ${view.name === "promotions" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Promociones & Ofertas</div>
                          <div className={`text-[10px] ${view.name === "promotions" ? "text-stone-400" : "text-stone-500"}`}>Descuentos y 2x1</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('recipes') && (
                    <button
                      onClick={() => handleNav({ name: "recipes" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "recipes" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className={`w-4 h-4 ${view.name === "recipes" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Recetas & Fichas Técnicas</div>
                          <div className={`text-[10px] ${view.name === "recipes" ? "text-stone-400" : "text-stone-500"}`}>Costos y mermas</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Bloque 3: Finanzas, Stock y Reportes */}
              <div>
                <div className="px-2 mb-2 text-[10px] font-black text-amber-900 tracking-wider uppercase">
                  Almacén & Finanzas
                </div>
                <div className="space-y-1.5">
                  {hasPermission('inventory') && (
                    <button
                      onClick={() => handleNav({ name: "inventory" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "inventory" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Package className={`w-4 h-4 ${view.name === "inventory" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Inventario & Stock</div>
                          <div className={`text-[10px] ${view.name === "inventory" ? "text-stone-400" : "text-stone-500"}`}>Kardex e insumos</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('suppliers') && (
                    <button
                      onClick={() => handleNav({ name: "suppliers" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "suppliers" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart className={`w-4 h-4 ${view.name === "suppliers" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Proveedores & Compras</div>
                          <div className={`text-[10px] ${view.name === "suppliers" ? "text-stone-400" : "text-stone-500"}`}>Facturas de compra</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('expenses') && (
                    <button
                      onClick={() => handleNav({ name: "expenses" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "expenses" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className={`w-4 h-4 ${view.name === "expenses" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Gastos & Egresos</div>
                          <div className={`text-[10px] ${view.name === "expenses" ? "text-stone-400" : "text-stone-500"}`}>Salidas de efectivo</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('reports') && (
                    <button
                      onClick={() => handleNav({ name: "reports" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "reports" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 className={`w-4 h-4 ${view.name === "reports" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Reportes & Estadísticas</div>
                          <div className={`text-[10px] ${view.name === "reports" ? "text-stone-400" : "text-stone-500"}`}>Ranking y balance diario</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('sunat') && (
                    <button
                      onClick={() => handleNav({ name: "sunat" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "sunat" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`w-4 h-4 ${view.name === "sunat" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Facturación SUNAT</div>
                          <div className={`text-[10px] ${view.name === "sunat" ? "text-stone-400" : "text-stone-500"}`}>Boletas y Facturas electrónicas</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Bloque 4: Administración & Configuración */}
              <div>
                <div className="px-2 mb-2 text-[10px] font-black text-amber-900 tracking-wider uppercase">
                  Administración & Ajustes
                </div>
                <div className="space-y-1.5">
                  {hasPermission('users') && (
                    <button
                      onClick={() => handleNav({ name: "users" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "users" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className={`w-4 h-4 ${view.name === "users" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Usuarios & Mozos</div>
                          <div className={`text-[10px] ${view.name === "users" ? "text-stone-400" : "text-stone-500"}`}>PINs y accesos</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('role_permissions') && (
                    <button
                      onClick={() => handleNav({ name: "role_permissions" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "role_permissions" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Crown className={`w-4 h-4 ${view.name === "role_permissions" ? "text-amber-400" : "text-amber-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Gobernanza de Roles</div>
                          <div className={`text-[10px] ${view.name === "role_permissions" ? "text-stone-400" : "text-stone-500"}`}>Permisos por pestaña</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-200 text-amber-950">Owner</span>
                    </button>
                  )}

                  {hasPermission('staff') && (
                    <button
                      onClick={() => handleNav({ name: "staff" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "staff" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <UsersRound className={`w-4 h-4 ${view.name === "staff" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Personal & Turnos</div>
                          <div className={`text-[10px] ${view.name === "staff" ? "text-stone-400" : "text-stone-500"}`}>Asistencia y propinas</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('customers') && (
                    <button
                      onClick={() => handleNav({ name: "customers" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "customers" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className={`w-4 h-4 ${view.name === "customers" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Clientes & CRM</div>
                          <div className={`text-[10px] ${view.name === "customers" ? "text-stone-400" : "text-stone-500"}`}>Puntos y fiados</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('printers') && (
                    <button
                      onClick={() => handleNav({ name: "printers" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "printers" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Printer className={`w-4 h-4 ${view.name === "printers" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Impresoras Térmicas</div>
                          <div className={`text-[10px] ${view.name === "printers" ? "text-stone-400" : "text-stone-500"}`}>Ruteo de comandas</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('audit_log') && (
                    <button
                      onClick={() => handleNav({ name: "audit_log" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "audit_log" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert className={`w-4 h-4 ${view.name === "audit_log" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Log de Auditoría</div>
                          <div className={`text-[10px] ${view.name === "audit_log" ? "text-stone-400" : "text-stone-500"}`}>Historial de acciones</div>
                        </div>
                      </div>
                    </button>
                  )}

                  {hasPermission('notifications') && (
                    <button
                      onClick={() => handleNav({ name: "notifications" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "notifications" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bell className={`w-4 h-4 ${view.name === "notifications" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Notificaciones</div>
                          <div className={`text-[10px] ${view.name === "notifications" ? "text-stone-400" : "text-stone-500"}`}>Alertas de stock y mora</div>
                        </div>
                      </div>
                      {notificationCount > 0 && (
                        <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white">{notificationCount}</span>
                      )}
                    </button>
                  )}

                  {hasPermission('settings') && (
                    <button
                      onClick={() => handleNav({ name: "settings" })}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between border cursor-pointer ${
                        view.name === "settings" ? "bg-stone-900 text-white border-stone-900 shadow-md" : "bg-stone-50/80 text-stone-800 border-stone-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SettingsIcon className={`w-4 h-4 ${view.name === "settings" ? "text-amber-400" : "text-stone-600"}`} />
                        <div>
                          <div className="font-bold text-xs">Ajustes Generales</div>
                          <div className={`text-[10px] ${view.name === "settings" ? "text-stone-400" : "text-stone-500"}`}>Datos de empresa y tickets</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Tutoriales */}
              <div className="pt-2">
                <button
                  onClick={() => { onOpenTutorials(); onCloseMobileMenu(); }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 shadow-2xs cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Tutoriales & Guías del Módulo</span>
                </button>
              </div>

              {/* Cerrar Sesión */}
              <div className="pt-2 border-t border-stone-200">
                <button
                  onClick={() => { onLogout(); onCloseMobileMenu(); }}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-black border border-rose-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── TAB-BAR INFERIOR MOBILE (5 BOTONES PRINCIPALES) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 shadow-[0_-2px_16px_rgba(0,0,0,0.07)]" style={{ height: 60 }}>
        <div className="flex items-stretch h-full">
          <button
            onClick={() => { onNavigate({ name: "dashboard" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              view.name === "dashboard" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <LayoutGrid className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Panel</span>
          </button>

          <button
            onClick={() => { onNavigate({ name: "pos" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              view.name === "pos" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <Receipt className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">POS</span>
          </button>

          <button
            onClick={() => { onNavigate({ name: "delivery" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              view.name === "delivery" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <Truck className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Delivery</span>
          </button>

          <button
            onClick={() => { onNavigate({ name: "kds" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              view.name === "kds" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <ChefHat className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Cocina</span>
          </button>

          <button
            onClick={onToggleMobileMenu}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
              isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <Menu className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Módulos</span>
          </button>
        </div>
      </nav>
    </>
  );
};
