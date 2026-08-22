import React from 'react';
import {
  LayoutGrid, Receipt, ChefHat, Truck, Menu, X, BookOpen
} from 'lucide-react';
import { ViewState, AppSegment } from '../../App';
import { Settings, AppModuleKey } from '../../types';
import { AppSidebar } from './AppSidebar';

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
  onLogout,
  onOpenTutorials,
}) => {
  return (
    <>
      {/* ── TOPBAR MOBILE ── */}
      <div className="md:hidden bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-2.5 font-bold text-stone-900">
          <img
            src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/logo-web.png"}
            alt="Logo"
            className="w-8 h-8 rounded-lg object-contain bg-white border border-stone-200 shrink-0"
          />
          <span className="text-sm tracking-tight leading-tight truncate max-w-[160px]">{settings.companyName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTutorials}
            className="p-2 text-amber-600 bg-amber-50 rounded-lg border border-amber-200"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── OVERLAY + PANEL LATERAL SLIDE-IN (MOBILE) ── */}
      {isMobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-xs"
            onClick={onCloseMobileMenu}
          />
          <div className="md:hidden fixed top-0 right-0 bottom-0 w-[80vw] max-w-xs bg-white z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/logo-web.png"}
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-contain border border-stone-200 bg-white"
                />
                <div>
                  <div className="font-black text-xs text-stone-900 truncate max-w-[130px]">{settings.companyName}</div>
                  <div className="text-[9px] text-amber-700 font-bold uppercase tracking-wider">Sistema Pro</div>
                </div>
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="p-1.5 rounded-xl bg-stone-100 text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <AppSidebar
                  settings={settings}
                  view={view}
                  activeSegment={activeSegment}
                  notificationCount={notificationCount}
                  hasPermission={hasPermission}
                  onNavigate={onNavigate}
                  onBackToPortal={onBackToPortal}
                  onLogout={onLogout}
                  onOpenTutorials={onOpenTutorials}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB-BAR INFERIOR MOBILE ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 shadow-[0_-2px_16px_rgba(0,0,0,0.07)]" style={{ height: 60 }}>
        <div className="flex items-stretch h-full">
          <button
            onClick={() => { onNavigate({ name: "dashboard" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              view.name === "dashboard" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <LayoutGrid className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Panel</span>
          </button>

          <button
            onClick={() => { onNavigate({ name: "pos" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              view.name === "pos" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <Receipt className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">POS</span>
          </button>

          <button
            onClick={() => { onNavigate({ name: "delivery" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              view.name === "delivery" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <Truck className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Delivery</span>
          </button>

          <button
            onClick={() => { onNavigate({ name: "kds" }); onCloseMobileMenu(); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              view.name === "kds" && !isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <ChefHat className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Cocina</span>
          </button>

          <button
            onClick={onToggleMobileMenu}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isMobileMenuOpen ? "text-amber-600 border-t-2 border-amber-500 bg-amber-50/60" : "text-stone-400 border-t-2 border-transparent"
            }`}
          >
            <Menu className="w-[19px] h-[19px]" />
            <span className="text-[9px] font-black">Menú</span>
          </button>
        </div>
      </nav>
    </>
  );
};
