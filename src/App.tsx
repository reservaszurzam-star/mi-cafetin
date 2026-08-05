import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Receipt,
  ChefHat,
  Utensils,
  Lock,
  ShieldAlert,
  Printer,
  Users,
  CreditCard,
  Building2,
  TrendingUp,
  BarChart3,
  Bell,
  UtensilsCrossed,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Package,
  Calendar,
  Truck,
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import CustomersList from "./components/CustomersList";
import CustomerDetail from "./components/CustomerDetail";
import ProductsList from "./components/ProductsList";
import Reports from "./components/Reports";
import ExpensesList from "./components/ExpensesList";
import SettingsView from "./components/SettingsView";
import NotificationsView from "./components/NotificationsView";
import LoginView from "./components/LoginView";
import LoadingScreen from "./components/LoadingScreen";
import POSView from "./components/POSView";
import KDSView from "./components/KDSView";
import CashRegisterView from "./components/CashRegisterView";
import AuditLogView from "./components/AuditLogView";
import PrintersView from "./components/PrintersView";
import BillingView from "./components/BillingView";
import InventoryView from "./components/InventoryView";
import ReservationsView from "./components/ReservationsView";
import DeliveryView from "./components/DeliveryView";
import GraceAssistant from "./components/GraceAssistant";
import { useAppStore } from "./hooks/StoreContext";

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
  | { name: "customer_detail"; customerId: string };

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewState>({ name: "dashboard" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings, products, customers, transactions } = useAppStore();

  useEffect(() => {
    const auth = localStorage.getItem("cafetin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }

    // Slight delay to showcase the loading screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("cafetin_auth", "true");
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const navigate = (newView: ViewState) => {
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("cafetin_auth");
    setView({ name: "dashboard" });
  };

  // Calculate notifications
  const lowStockProducts = products.filter(
    (p) => p.stock !== undefined && p.stock <= settings.lowStockThreshold,
  );
  const getCustomerBalance = (customerId: string) => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .reduce(
        (acc, t) => acc + (t.type === "charge" ? t.amount : -t.amount),
        0,
      );
  };
  const overdueCustomers = customers.filter((c) => {
    const balance = getCustomerBalance(c.id);
    if (balance <= 0) return false;
    // Find oldest unpaid charge roughly
    const charges = transactions
      .filter((t) => t.customerId === c.id && t.type === "charge")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (charges.length === 0) return false;
    const oldestCharge = charges[0];
    const daysOld =
      (new Date().getTime() - new Date(oldestCharge.date).getTime()) /
      (1000 * 3600 * 24);
    return daysOld > settings.overdueDaysThreshold;
  });

  const notificationCount = lowStockProducts.length + overdueCustomers.length;

  interface NavItemProps {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    badge?: string | number;
    badgeType?: "dark" | "gold" | "rose";
    active: boolean;
    onClick: () => void;
  }

  function NavItem({
    icon: Icon,
    title,
    subtitle,
    badge,
    badgeType = "dark",
    active,
    onClick,
  }: NavItemProps) {
    return (
      <button
        onClick={onClick}
        className={`w-full p-2.5 rounded-2xl transition-all duration-200 text-left flex items-center justify-between border ${
          active
            ? "bg-stone-900 text-white border-stone-900 shadow-md dark:bg-stone-100 dark:text-stone-900 dark:border-white"
            : "bg-white text-stone-800 border-stone-200/90 hover:border-amber-500/50 hover:bg-stone-50/80 dark:bg-stone-900/90 dark:text-stone-200 dark:border-stone-800 dark:hover:bg-stone-800/80 shadow-sm"
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div
            className={`p-2 rounded-xl flex-shrink-0 ${
              active
                ? "bg-amber-500/20 text-amber-400 dark:bg-amber-600 dark:text-white"
                : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="truncate">
            <div
              className={`font-bold text-xs leading-tight ${
                active
                  ? "text-white dark:text-stone-900"
                  : "text-stone-900 dark:text-stone-100"
              }`}
            >
              {title}
            </div>
            <div
              className={`text-[10px] truncate mt-0.5 ${
                active
                  ? "text-stone-400 dark:text-stone-600"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              {subtitle}
            </div>
          </div>
        </div>
        {badge !== undefined && (
          <span
            className={`ml-1.5 flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
              badgeType === "gold"
                ? "bg-stone-900 text-amber-400 dark:bg-stone-800 dark:text-amber-300 border border-amber-500/30"
                : badgeType === "rose"
                ? "bg-rose-500 text-white"
                : "bg-stone-900 text-white dark:bg-stone-800 dark:text-stone-100"
            }`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }

  const NavContent = () => (
    <div className="space-y-4">
      {/* Sección 1: OPERACIONES Y SALA */}
      <div>
        <div className="px-2 mb-2 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
          Operaciones y Sala
        </div>
        <div className="space-y-1.5">
          <NavItem
            icon={LayoutGrid}
            title="Panel Principal"
            subtitle="Resumen en tiempo real"
            active={view.name === "dashboard"}
            onClick={() => navigate({ name: "dashboard" })}
          />
          <NavItem
            icon={Receipt}
            title="Control de Pedidos"
            subtitle="Planos de 4 pisos y comandas"
            badge={1}
            active={view.name === "pos"}
            onClick={() => navigate({ name: "pos" })}
          />
          <NavItem
            icon={Truck}
            title="Delivery"
            subtitle="Gestión de envíos y rutas"
            active={view.name === "delivery"}
            onClick={() => navigate({ name: "delivery" })}
          />
          <NavItem
            icon={ChefHat}
            title="Pantalla KDS Cocina"
            subtitle="Barra y comandas activas"
            badge={1}
            active={view.name === "kds"}
            onClick={() => navigate({ name: "kds" })}
          />
          <NavItem
            icon={Utensils}
            title="Gestión de Carta"
            subtitle="Platos, combos y precios"
            active={view.name === "products"}
            onClick={() => navigate({ name: "products" })}
          />
          <NavItem
            icon={Package}
            title="Inventario"
            subtitle="Control de insumos y stock"
            active={view.name === "inventory"}
            onClick={() => navigate({ name: "inventory" })}
          />
          <NavItem
            icon={Calendar}
            title="Reservaciones"
            subtitle="Gestión de reservas"
            active={view.name === "reservations"}
            onClick={() => navigate({ name: "reservations" })}
          />
        </div>
      </div>

      {/* Sección 2: ADMINISTRACIÓN Y BI */}
      <div>
        <div className="px-2 mb-2 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
          Administración y BI
        </div>
        <div className="space-y-1.5">
          <NavItem
            icon={Lock}
            title="Cierre de Caja"
            subtitle="Arqueo físico y conciliación"
            badge="Cierre Diario"
            badgeType="gold"
            active={view.name === "cash_register"}
            onClick={() => navigate({ name: "cash_register" })}
          />
          <NavItem
            icon={ShieldAlert}
            title="Log de Auditoría"
            subtitle="Eventos críticos y accesos"
            badge="Seguridad"
            badgeType="gold"
            active={view.name === "audit_log"}
            onClick={() => navigate({ name: "audit_log" })}
          />
          <NavItem
            icon={Printer}
            title="Config. Impresoras"
            subtitle="Ruteo IP, Barra y Cocina"
            badge={4}
            active={view.name === "printers"}
            onClick={() => navigate({ name: "printers" })}
          />
          <NavItem
            icon={Users}
            title="Clientes & CRM"
            subtitle="Puntos y fidelización"
            active={view.name === "customers" || view.name === "customer_detail"}
            onClick={() => navigate({ name: "customers" })}
          />
          <NavItem
            icon={CreditCard}
            title="Cobranza & Cuentas"
            subtitle="Boletas y divisiones"
            active={view.name === "billing"}
            onClick={() => navigate({ name: "billing" })}
          />
          <NavItem
            icon={TrendingUp}
            title="Ingresos y Gastos"
            subtitle="Flujo de caja del turno"
            active={view.name === "expenses"}
            onClick={() => navigate({ name: "expenses" })}
          />
          <NavItem
            icon={BarChart3}
            title="Reportes BI"
            subtitle="Horas pico y ranking"
            active={view.name === "reports"}
            onClick={() => navigate({ name: "reports" })}
          />
        </div>
      </div>

      {/* Utilidades / Sistema */}
      <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60 space-y-1.5">
        <NavItem
          icon={Bell}
          title="Notificaciones"
          subtitle="Alertas del sistema"
          badge={notificationCount > 0 ? notificationCount : undefined}
          badgeType="rose"
          active={view.name === "notifications"}
          onClick={() => navigate({ name: "notifications" })}
        />
        <NavItem
          icon={SettingsIcon}
          title="Ajustes"
          subtitle="Configuración general"
          active={view.name === "settings"}
          onClick={() => navigate({ name: "settings" })}
        />
      </div>

      <div className="pt-2">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl transition-all text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/20 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      {/* Mobile top bar */}
      <div className="md:hidden bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-800/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3 text-stone-900 dark:text-white font-display font-bold text-xl">
          <img
            src={settings.logoUrl || "/icono.png"}
            alt="Logo"
            className="w-8 h-8 rounded-full object-cover shadow-sm border border-stone-100 dark:border-stone-700"
          />
          <span className="tracking-tight">{settings.companyName}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-stone-600 dark:text-stone-400 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl z-20 p-4 border-b border-stone-200/50 dark:border-stone-800/50 overflow-y-auto">
          <NavContent />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-80 bg-stone-100/50 dark:bg-stone-900/80 backdrop-blur-xl border-r border-stone-200/60 dark:border-stone-800/60 flex-col sticky top-0 h-screen z-20 transition-colors duration-300">
        <div className="p-6 flex items-center space-x-3.5 border-b border-stone-200/60 dark:border-stone-800/60">
          <img
            src={settings.logoUrl || "/icono.png"}
            alt="Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-stone-100 dark:border-stone-700 bg-white"
          />
          <div className="truncate">
            <span className="font-display text-lg font-bold text-stone-900 dark:text-white tracking-tight block truncate">
              {settings.companyName}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider block">
              Cafetín POS & BI
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          <NavContent />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8">
        {view.name === "dashboard" && <Dashboard onNavigate={navigate} />}
        {view.name === "pos" && <POSView />}
        {view.name === "delivery" && <DeliveryView />}
        {view.name === "kds" && <KDSView />}
        {view.name === "products" && <ProductsList onNavigate={navigate} />}
        {view.name === "inventory" && <InventoryView />}
        {view.name === "reservations" && <ReservationsView />}
        {view.name === "cash_register" && <CashRegisterView />}
        {view.name === "audit_log" && <AuditLogView />}
        {view.name === "printers" && <PrintersView />}
        {view.name === "customers" && <CustomersList onNavigate={navigate} />}
        {view.name === "billing" && <BillingView />}
        {view.name === "expenses" && <ExpensesList />}
        {view.name === "reports" && <Reports />}
        {view.name === "settings" && <SettingsView />}
        {view.name === "notifications" && (
          <NotificationsView onNavigate={navigate} />
        )}
        {view.name === "customer_detail" && (
          <CustomerDetail customerId={view.customerId} onNavigate={navigate} />
        )}
      </main>

      {/* ── ASISTENTE VIRTUAL GRACE ── */}
      <GraceAssistant onNavigate={navigate} />
    </div>
  );
}
