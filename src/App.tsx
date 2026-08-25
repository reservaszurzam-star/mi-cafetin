import React, { useState } from "react";
import PortalView from "./features/portal/PortalView";
import PublicMenuView from "./features/public/PublicMenuView";
import { ModuleTutorialModal } from './features/assistant/ModuleTutorialModal';
import GraceAssistant from "./features/assistant/GraceAssistant";
import { useAppStore } from "./hooks/StoreContext";

// Layout Subcomponents
import { AppSidebar } from "./features/layout/AppSidebar";
import { AppMobileNav } from "./features/layout/AppMobileNav";
import { AppViewRouter } from "./features/layout/AppViewRouter";
import { UniversalSyncButton } from "./components/UniversalSyncButton";

export type ViewState =
  | { name: "dashboard" }
  | { name: "pos" }
  | { name: "delivery" }
  | { name: "kds" }
  | { name: "products" }
  | { name: "inventory" }
  | { name: "reservations" }
  | { name: "cash_register" }
  | { name: "audit_log" }
  | { name: "printers" }
  | { name: "customers" }
  | { name: "billing" }
  | { name: "expenses" }
  | { name: "reports" }
  | { name: "settings" }
  | { name: "notifications" }
  | { name: "suppliers" }
  | { name: "staff" }
  | { name: "users" }
  | { name: "role_permissions" }
  | { name: "sunat" }
  | { name: "recipes" }
  | { name: "promotions" }
  | { name: "daily_menu" }
  | { name: "dish_ranking" }
  | { name: "customer_detail"; customerId: string };

type AppProps = {
  onBackToBrands: () => void;
  onLogout?: () => void;
  tenantId: string;
};

export type AppSegment = 'menu_admin' | 'ops_ventas' | 'ops_cocina' | 'ops_inventario' | 'admin_finanzas' | 'admin_crm' | 'admin_sistema';

export default function App({ onBackToBrands, onLogout, tenantId }: AppProps) {
  const [currentModule, setCurrentModule] = useState<'portal' | 'menu' | 'restaurant'>(() => {
    const saved = localStorage.getItem(`cafetin_module_${tenantId}`);
    if (saved === 'portal' || saved === 'menu' || saved === 'restaurant') {
      return saved;
    }
    return 'portal';
  });
  const [view, setView] = useState<ViewState>(() => {
    const saved = localStorage.getItem(`cafetin_view_${tenantId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return { name: "dashboard" };
  });
  const [activeSegment, setActiveSegment] = useState<AppSegment | null>(() => {
    const saved = localStorage.getItem(`cafetin_segment_${tenantId}`);
    return (saved as AppSegment) || null;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  const { settings, products, customers, transactions, hasPermission } = useAppStore();

  const handleSelectModule = (
    module: 'portal' | 'menu' | 'restaurant', 
    initialView?: ViewState,
    segment?: AppSegment
  ) => {
    setCurrentModule(module);
    localStorage.setItem(`cafetin_module_${tenantId}`, module);
    if (initialView) {
      setView(initialView);
      localStorage.setItem(`cafetin_view_${tenantId}`, JSON.stringify(initialView));
    }
    if (segment) {
      setActiveSegment(segment);
      localStorage.setItem(`cafetin_segment_${tenantId}`, segment);
    } else if (module === 'restaurant' && !activeSegment) {
      setActiveSegment('ops_ventas');
      localStorage.setItem(`cafetin_segment_${tenantId}`, 'ops_ventas');
    }
  };

  const handleBackToPortal = () => {
    setCurrentModule('portal');
    localStorage.setItem(`cafetin_module_${tenantId}`, 'portal');
  };

  if (currentModule === 'portal') {
    return <PortalView onSelectModule={handleSelectModule} onBackToBrands={onBackToBrands} tenantId={tenantId} />;
  }

  if (currentModule === 'menu') {
    return <PublicMenuView onBack={handleBackToPortal} />;
  }

  const navigate = (newView: ViewState) => {
    setView(newView);
    localStorage.setItem(`cafetin_view_${tenantId}`, JSON.stringify(newView));
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("cafetin_auth");
    localStorage.removeItem(`cafetin_module_${tenantId}`);
    localStorage.removeItem(`cafetin_view_${tenantId}`);
    localStorage.removeItem(`cafetin_segment_${tenantId}`);
    setView({ name: "dashboard" });
    setCurrentModule('portal');
    setActiveSegment(null);
    if (onLogout) {
      onLogout();
    } else {
      onBackToBrands();
    }
  };

  // Notificaciones
  const lowStockProducts = products.filter(
    (p) => p.stock !== undefined && p.stock <= settings.lowStockThreshold
  );
  
  const getCustomerBalance = (customerId: string) => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .reduce((acc, t) => acc + (t.type === "charge" ? t.amount : -t.amount), 0);
  };

  const overdueCustomers = customers.filter((c) => {
    const balance = getCustomerBalance(c.id);
    if (balance <= 0) return false;
    const charges = transactions
      .filter((t) => t.customerId === c.id && t.type === "charge")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (charges.length === 0) return false;
    const oldestCharge = charges[0];
    const daysOld = (Date.now() - new Date(oldestCharge.date).getTime()) / (1000 * 3600 * 24);
    return daysOld > settings.overdueDaysThreshold;
  });

  const notificationCount = lowStockProducts.length + overdueCustomers.length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#faf8f5] text-stone-900 font-sans">
      
      {/* ── TOPBAR & MENÚ MOBILE ── */}
      <AppMobileNav
        settings={settings}
        view={view}
        activeSegment={activeSegment}
        notificationCount={notificationCount}
        hasPermission={hasPermission}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        onNavigate={navigate}
        onBackToPortal={handleBackToPortal}
        onBackToBrands={onBackToBrands}
        onLogout={handleLogout}
        onOpenTutorials={() => setShowTutorialModal(true)}
      />

      {/* ── SIDEBAR DESKTOP ── */}
      <AppSidebar
        settings={settings}
        view={view}
        activeSegment={activeSegment}
        notificationCount={notificationCount}
        hasPermission={hasPermission}
        onNavigate={navigate}
        onBackToPortal={handleBackToPortal}
        onLogout={handleLogout}
        onOpenTutorials={() => setShowTutorialModal(true)}
      />

      {/* ── ROUTER DE VISTAS ── */}
      <AppViewRouter
        view={view}
        onNavigate={navigate}
      />

      {/* ── MODAL DE TUTORIALES ── */}
      {showTutorialModal && (
        <ModuleTutorialModal
          initialModuleId={view.name === "pos" ? "pos" : view.name === "kds" ? "kds" : view.name === "delivery" ? "delivery" : view.name === "sunat" ? "sunat" : view.name === "reports" ? "reports" : "pos"}
          onClose={() => setShowTutorialModal(false)}
        />
      )}

      {/* ── ASISTENTE VIRTUAL GRACE IA ── */}
      <GraceAssistant onNavigate={navigate} />

      {/* ── BOTÓN UNIVERSAL FLOTANTE DE SINCRONIZACIÓN SUPABASE ── */}
      <UniversalSyncButton variant="floating" />

    </div>
  );
}
