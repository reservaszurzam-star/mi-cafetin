import React, { useEffect, useState } from 'react';
import { 
  Utensils, 
  LayoutGrid, 
  Settings, 
  LogOut, 
  ArrowRight, 
  ShieldCheck, 
  ChefHat, 
  Receipt, 
  Flame, 
  Package, 
  BarChart3, 
  Sliders, 
  Store,
  Sparkles,
  MapPin,
  Menu,
  X,
  Truck,
  Trophy
} from 'lucide-react';
import { useAppStore } from "../../hooks/StoreContext";
import { UniversalSyncButton } from "../../components/UniversalSyncButton";

type PortalViewProps = {
  onSelectModule: (module: 'menu' | 'restaurant' | 'tracking', initialView?: any, segment?: string) => void;
  onBackToBrands: () => void;
  tenantId?: string;
};

export default function PortalView({ onSelectModule, onBackToBrands, tenantId }: PortalViewProps) {
  const { settings, hasPermission } = useAppStore();
  const [animate, setAnimate] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isParadero = tenantId === 'paradero';

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const accent = isParadero ? 'text-blue-600' : 'text-amber-700';
  const accentBg = isParadero ? 'bg-blue-600' : 'bg-amber-500';
  const accentBorder = isParadero ? 'border-blue-400' : 'border-amber-400';
  const accentLight = isParadero ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900 border border-amber-200';
  const accentHover = isParadero
    ? 'hover:text-blue-700 hover:bg-blue-50/80 hover:border-blue-200'
    : 'hover:text-amber-800 hover:bg-amber-50/80 hover:border-amber-200';

  // Botones del sidebar agrupados
  const NavLinks = ({ onClose }: { onClose?: () => void }) => (
    <nav className="flex flex-col gap-5">

      <div className="flex flex-col gap-1">
        <div className={`text-[10px] font-black tracking-[0.2em] px-3 py-1 uppercase flex items-center gap-2 ${accent}`}>
          <Utensils className="w-3 h-3" />
          <span>MENÚ DIGITAL</span>
        </div>
        {[
          { label: 'App Delivery (PedidosYa / Rappi)', show: true, iconEl: <Store className={`w-4 h-4 ${isParadero ? 'text-blue-500' : 'text-amber-600'}`} />, action: () => { onSelectModule('menu'); onClose?.(); } },
          { label: 'Menú del Día (Entradas/Fondos)', show: hasPermission('daily_menu'), iconEl: <Utensils className={`w-4 h-4 ${isParadero ? 'text-blue-500' : 'text-amber-600'}`} />, action: () => { onSelectModule('restaurant', { name: 'daily_menu' }, 'menu_admin'); onClose?.(); } },
          { label: 'Ranking de Platos', show: hasPermission('dish_ranking'), iconEl: <Trophy className={`w-4 h-4 ${isParadero ? 'text-blue-500' : 'text-amber-600'}`} />, action: () => { onSelectModule('restaurant', { name: 'dish_ranking' }, 'menu_admin'); onClose?.(); } },
          { label: 'Rastreo GPS en Vivo', show: hasPermission('delivery'), iconEl: <Truck className={`w-4 h-4 ${isParadero ? 'text-blue-500' : 'text-amber-600'}`} />, action: () => { onSelectModule('tracking' as any); onClose?.(); } },
          { label: 'Administrar Carta & Precios', show: hasPermission('products'), iconEl: <ChefHat className={`w-4 h-4 ${isParadero ? 'text-blue-500' : 'text-amber-600'}`} />, action: () => { onSelectModule('restaurant', { name: 'products' }, 'menu_admin'); onClose?.(); } },
        ].filter(i => i.show).map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all w-full text-left border border-transparent text-stone-600 ${accentHover}`}
          >
            {item.iconEl}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-black tracking-[0.2em] px-3 py-1 uppercase flex items-center gap-2 text-stone-400">
          <LayoutGrid className="w-3 h-3" />
          <span>GESTIÓN INTERNA</span>
        </div>
        {[
          { label: 'Punto de Venta (POS)', show: hasPermission('pos'), iconEl: <Receipt className="w-4 h-4 text-stone-400" />, action: () => { onSelectModule('restaurant', { name: 'pos' }, 'ops_ventas'); onClose?.(); } },
          { label: 'Cocina (KDS)', show: hasPermission('kds'), iconEl: <Flame className="w-4 h-4 text-orange-500" />, action: () => { onSelectModule('restaurant', { name: 'kds' }, 'ops_cocina'); onClose?.(); } },
          { label: 'Inventario', show: hasPermission('inventory'), iconEl: <Package className="w-4 h-4 text-stone-400" />, action: () => { onSelectModule('restaurant', { name: 'inventory' }, 'ops_inventario'); onClose?.(); } },
        ].filter(i => i.show).map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all w-full text-left border border-transparent text-stone-600 ${accentHover}`}
          >
            {item.iconEl}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-black tracking-[0.2em] px-3 py-1 uppercase flex items-center gap-2 text-stone-400">
          <Settings className="w-3 h-3" />
          <span>CONFIGURACIÓN</span>
        </div>
        {[
          { label: 'Usuarios & Permisos', show: hasPermission('users') || hasPermission('role_permissions'), iconEl: <ShieldCheck className="w-4 h-4 text-purple-600" />, action: () => { onSelectModule('restaurant', { name: 'users' }, 'admin_sistema'); onClose?.(); } },
          { label: 'Reportes', show: hasPermission('reports'), iconEl: <BarChart3 className="w-4 h-4 text-stone-400" />, action: () => { onSelectModule('restaurant', { name: 'reports' }, 'admin_finanzas'); onClose?.(); } },
          { label: 'Ajustes Generales', show: hasPermission('settings'), iconEl: <Sliders className="w-4 h-4 text-stone-400" />, action: () => { onSelectModule('restaurant', { name: 'settings' }, 'admin_sistema'); onClose?.(); } },
        ].filter(i => i.show).map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all w-full text-left border border-transparent text-stone-600 ${accentHover}`}
          >
            {item.iconEl}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-stone-200/70">
        <button
          onClick={onBackToBrands}
          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-all border bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100 hover:border-stone-300 shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <Store className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black tracking-wider uppercase">Cambiar Negocio</span>
          </div>
          <LogOut className="w-4 h-4 rotate-180 text-stone-400 group-hover:text-stone-700 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

    </nav>
  );

  const heroImage = isParadero ? '/fondo-web/ceviche-portal.jpg' : '/assets/portal/menu/bg.jpg';
  const heroFallback = isParadero ? '/fondo-web/paradero-seafood.jpg' : '/assets/portal/menu/bg.jpg';

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none ${isParadero ? 'bg-[#f4f8fc] text-slate-800' : 'bg-[#faf8f5] text-stone-800'}`}>

      {/* ── TOPBAR MOBILE ── */}
      {/* ── TOPBAR MOBILE ── */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={isParadero ? '/Logo/logo-paradero-104.png' : (settings.logoUrl && settings.logoUrl !== '/icono.png' ? settings.logoUrl : '/Logo/logo-lomas-grill.png')}
            alt="Logo"
            className="w-9 h-9 rounded-xl object-contain border border-stone-200 bg-white p-0.5 shrink-0"
            onError={(e) => { e.currentTarget.src = '/logo-web.png'; }}
          />
          <div className="min-w-0 truncate">
            <div className="font-black text-sm text-stone-900 leading-tight truncate">{isParadero ? 'Paradero 104' : settings.companyName}</div>
            <div className={`text-[9px] font-bold uppercase tracking-wider ${accent}`}>Sistema Gastronómico</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UniversalSyncButton variant="compact" />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── DRAWER LATERAL MOBILE ── */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-[78vw] max-w-[300px] bg-white z-50 flex flex-col shadow-2xl md:hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200">
              <span className="font-black text-sm text-stone-900">Menú Principal</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-xl bg-stone-100 text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 border-b border-stone-200 bg-emerald-50/40">
              <UniversalSyncButton variant="full" />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NavLinks onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* ── LAYOUT PRINCIPAL (desktop: sidebar + main, mobile: solo main) ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── SIDEBAR DESKTOP ── */}
        <aside className={`hidden md:flex w-[290px] xl:w-[320px] flex-col justify-between py-8 px-6 shrink-0 z-30 border-r bg-white/95 backdrop-blur-xl ${isParadero ? 'border-blue-100' : 'border-stone-200/80'} shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
          <div className="flex flex-col">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className={`w-32 h-32 rounded-2xl p-3.5 flex items-center justify-center shadow-md ${isParadero ? 'bg-blue-50/50 border border-blue-100' : 'bg-stone-50/70 border border-stone-200'}`}>
                <img
                  src={isParadero ? '/Logo/logo-paradero-104.png' : (settings.logoUrl && settings.logoUrl !== '/icono.png' ? settings.logoUrl : '/Logo/logo-lomas-grill.png')}
                  alt="Logo"
                  className="w-full h-full object-contain drop-shadow-sm"
                  onError={(e) => { e.currentTarget.src = '/logo-web.png'; }}
                />
              </div>
            </div>

            {/* Sincronizar Supabase Botón */}
            <div className="mb-4">
              <UniversalSyncButton variant="full" />
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-360px)] pr-1 custom-scrollbar">
              <NavLinks />
            </div>
          </div>
        </aside>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 relative flex flex-col overflow-y-auto">

          {/* Background atmospherics (desktop only) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 hidden md:block">
            <div className="absolute top-0 right-0 w-[60%] h-[480px] opacity-15">
              <img src={heroImage} alt="" className="w-full h-full object-cover object-center" onError={(e) => { e.currentTarget.src = heroFallback; }} />
              <div className={`absolute inset-0 bg-gradient-to-l from-transparent to-90% ${isParadero ? 'to-[#f4f8fc]' : 'to-[#faf8f5]'}`} />
              <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-90% ${isParadero ? 'to-[#f4f8fc]' : 'to-[#faf8f5]'}`} />
            </div>
            <div className={`absolute top-10 right-20 w-[450px] h-[300px] rounded-full filter blur-[100px] ${isParadero ? 'bg-blue-300/25' : 'bg-amber-200/30'}`} />
            <div className={`absolute bottom-10 left-20 w-[350px] h-[250px] rounded-full filter blur-[90px] ${isParadero ? 'bg-sky-200/20' : 'bg-orange-100/30'}`} />
          </div>

          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 xl:px-12 py-6 sm:py-10 flex flex-col justify-center flex-1">

            {/* Header */}
            <header className={`mb-6 sm:mb-8 transition-all duration-700 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] sm:text-[11px] font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full ${accentLight}`}>
                  BIENVENIDO A
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-stone-900 tracking-tight mb-1.5">
                {isParadero ? 'PARADERO 104' : settings.companyName.toUpperCase()}
              </h1>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-base sm:text-lg font-bold tracking-wider ${accent}`}>
                  {isParadero ? 'BARRA CEVICHERA' : 'RESTAURANTE & GRILL'}
                </span>
              </div>
              <div className={`h-1 w-14 rounded-full mb-3 ${accentBg}`} />
              <p className="text-xs sm:text-sm font-semibold text-stone-500">Selecciona el módulo al que deseas acceder</p>
            </header>

            {/* ── ACTION CARDS ── */}
            <div className="flex flex-col gap-4 sm:gap-6 w-full">

              {/* CARD 1: Menú Digital */}
              <button
                onClick={() => onSelectModule('menu')}
                className={`group relative flex items-center w-full h-[130px] sm:h-[145px] md:h-[150px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border text-left transition-all duration-500 bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.12)] ${isParadero ? 'border-blue-100 hover:border-blue-400' : 'border-stone-200/90 hover:border-amber-400'} ${animate ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                style={{ transitionDelay: '150ms' }}
              >
                {/* Image strip — hidden on very small phones, shown from sm up */}
                <div className="hidden sm:block w-[180px] md:w-[240px] xl:w-[280px] h-full relative overflow-hidden shrink-0 bg-stone-100">
                  <img src={heroImage} alt="Menú Digital" className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700" onError={(e) => { e.currentTarget.src = heroFallback; }} />
                  <svg viewBox="0 0 40 100" preserveAspectRatio="none" className="absolute top-0 -right-px h-full w-14 fill-current text-white z-10">
                    <path d="M40,0 C15,30 15,70 40,100 Z" />
                    <path d="M40,0 C15,30 15,70 40,100" fill="none" strokeWidth="1.5" className={`transition-colors duration-500 ${isParadero ? 'stroke-blue-200 group-hover:stroke-blue-500' : 'stroke-amber-200 group-hover:stroke-amber-500'}`} />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 h-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 min-w-0">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-500 ${isParadero ? 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-[#1976d2] group-hover:text-white' : 'bg-amber-50 border-amber-200 text-amber-700 group-hover:bg-amber-500 group-hover:text-white'} group-hover:scale-105`}>
                      <Utensils className="w-6 h-6 sm:w-7 sm:h-7 xl:w-8 xl:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg xl:text-xl font-black text-stone-900 tracking-wide uppercase">MENÚ DIGITAL</h2>
                      <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5 line-clamp-2">Carta completa, delivery, promociones y pedidos por WhatsApp.</p>
                    </div>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all duration-300 group-hover:scale-110 ${isParadero ? 'bg-[#1976d2] text-white shadow-blue-500/25 group-hover:bg-[#1565c0]' : 'bg-amber-500 text-white shadow-amber-500/25 group-hover:bg-amber-600'}`}>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* CARD 2: Gestión Interna */}
              <button
                onClick={() => onSelectModule('restaurant', { name: 'dashboard' }, 'ops_ventas')}
                className={`group relative flex items-center w-full h-[130px] sm:h-[145px] md:h-[150px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border text-left transition-all duration-500 bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.12)] ${isParadero ? 'border-blue-100 hover:border-blue-400' : 'border-stone-200/90 hover:border-amber-400'} ${animate ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                style={{ transitionDelay: '250ms' }}
              >
                <div className="hidden sm:block w-[180px] md:w-[240px] xl:w-[280px] h-full relative overflow-hidden shrink-0 bg-stone-100">
                  <img src="/assets/portal/gestion/pos-modern.jpg" alt="Gestión" className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700" onError={(e) => { e.currentTarget.src = heroFallback; }} />
                  <svg viewBox="0 0 40 100" preserveAspectRatio="none" className="absolute top-0 -right-px h-full w-14 fill-current text-white z-10">
                    <path d="M40,0 C15,30 15,70 40,100 Z" />
                    <path d="M40,0 C15,30 15,70 40,100" fill="none" strokeWidth="1.5" className={`transition-colors duration-500 ${isParadero ? 'stroke-blue-200 group-hover:stroke-blue-500' : 'stroke-amber-200 group-hover:stroke-amber-500'}`} />
                  </svg>
                </div>

                <div className="flex-1 h-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 min-w-0">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 xl:w-16 xl:h-16 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-105 ${isParadero ? 'bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-[#1976d2] group-hover:text-white' : 'bg-amber-50 border-amber-200 text-amber-700 group-hover:bg-amber-500 group-hover:text-white'}`}>
                      <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7 xl:w-8 xl:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base sm:text-lg xl:text-xl font-black text-stone-900 tracking-wide uppercase">GESTIÓN INTERNA</h2>
                      <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5 line-clamp-2">POS, caja, cocina, inventario, reportes y configuración del sistema.</p>
                    </div>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all duration-300 group-hover:scale-110 ${isParadero ? 'bg-[#1976d2] text-white shadow-blue-500/25 group-hover:bg-[#1565c0]' : 'bg-amber-500 text-white shadow-amber-500/25 group-hover:bg-amber-600'}`}>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

            </div>

            {/* Footer */}
            <footer className={`mt-6 sm:mt-8 flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-stone-400 transition-all duration-700 ${animate ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>SISTEMA SEGURO • DATOS PROTEGIDOS</span>
            </footer>

          </div>
        </main>
      </div>
    </div>
  );
}
