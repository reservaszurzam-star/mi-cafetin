import React from 'react';
import { ViewState } from '../../App';
import { useAppStore } from '../../hooks/StoreContext';
import { Lock } from 'lucide-react';

// Features
import Dashboard from '../dashboard/Dashboard';
import CustomersList from '../customers/CustomersList';
import CustomerDetail from '../customers/CustomerDetail';
import ProductsList from '../inventory/ProductsList';
import Reports from '../finances/Reports';
import ExpensesList from '../finances/ExpensesList';
import SettingsView from '../settings/SettingsView';
import NotificationsView from '../settings/NotificationsView';
import POSView from '../pos/POSView';
import KDSView from '../kds/KDSView';
import CashRegisterView from '../finances/CashRegisterView';
import AuditLogView from '../settings/AuditLogView';
import PrintersView from '../settings/PrintersView';
import BillingView from '../finances/BillingView';
import InventoryView from '../inventory/InventoryView';
import ReservationsView from '../reservations/ReservationsView';
import DeliveryView from '../delivery/DeliveryView';
import SunatView from '../finances/SunatView';
import PromotionsView from '../inventory/PromotionsView';
import SuppliersView from '../suppliers/SuppliersView';
import RecipesView from '../recipes/RecipesView';
import StaffView from '../staff/StaffView';
import UsersView from '../users/UsersView';
import RolePermissionsView from '../users/RolePermissionsView';
import DailyMenuAdminView from '../daily-menu/DailyMenuAdminView';
import DishRankingView from '../dishes/DishRankingView';

interface AppViewRouterProps {
  view: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const AppViewRouter: React.FC<AppViewRouterProps> = ({
  view,
  onNavigate,
}) => {
  const { currentUser, hasPermission, ownerSimulatedRole } = useAppStore();

  const isAllowed = hasPermission(view.name as any);

  if (!isAllowed) {
    const activeRole = ownerSimulatedRole || currentUser.role;
    return (
      <main className="flex-1 w-full overflow-x-hidden max-w-[1600px] mx-auto p-3 sm:p-4 md:p-8 pb-24 md:pb-8 flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-sm text-center max-w-md mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-stone-900">Acceso Restringido</h2>
          <p className="text-xs text-stone-600 font-medium mt-2 leading-relaxed">
            Tu perfil actual (<strong className="text-amber-700">{activeRole}</strong>) no tiene permisos asignados para acceder a esta pantalla.
          </p>
          <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold">
            💡 Por favor, solicita acceso a tu <strong>Administrador</strong> o al <strong>Owner</strong> para habilitar esta pestaña.
          </div>
          <button
            onClick={() => onNavigate({ name: "dashboard" })}
            className="mt-6 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Volver al Inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full overflow-x-hidden max-w-[1600px] mx-auto p-3 sm:p-4 md:p-8 pb-24 md:pb-8">
      {view.name === "dashboard" && <Dashboard onNavigate={onNavigate} />}
      {view.name === "pos" && <POSView />}
      {view.name === "delivery" && <DeliveryView />}
      {view.name === "kds" && <KDSView />}
      {view.name === "products" && <ProductsList onNavigate={onNavigate} />}
      {view.name === "inventory" && <InventoryView />}
      {view.name === "reservations" && <ReservationsView />}
      {view.name === "cash_register" && <CashRegisterView />}
      {view.name === "audit_log" && <AuditLogView />}
      {view.name === "printers" && <PrintersView />}
      {view.name === "customers" && <CustomersList onNavigate={onNavigate} />}
      {view.name === "billing" && <BillingView onNavigate={onNavigate} />}
      {view.name === "expenses" && <ExpensesList />}
      {view.name === "reports" && <Reports />}
      {view.name === "settings" && <SettingsView />}
      {view.name === "users" && <UsersView />}
      {view.name === "role_permissions" && (
        (currentUser.role === "Owner" || currentUser.role === "Administrador") ? (
          <RolePermissionsView />
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-stone-200 shadow-sm text-center max-w-md mx-auto my-12 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-stone-900">Acceso Restringido</h2>
            <p className="text-xs text-stone-500 font-medium mt-2 leading-relaxed">
              La vista de <strong>Gobernanza de Roles & Permisos</strong> está restringida únicamente para <strong>Administradores</strong> y el <strong>Owner</strong>.
            </p>
            <button
              onClick={() => onNavigate({ name: "dashboard" })}
              className="mt-6 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Volver al Panel Principal
            </button>
          </div>
        )
      )}
      {view.name === "notifications" && <NotificationsView onNavigate={onNavigate} />}
      {view.name === "customer_detail" && (
        <CustomerDetail customerId={view.customerId} onNavigate={onNavigate} />
      )}
      {view.name === "promotions" && <PromotionsView />}
      {view.name === "daily_menu" && <DailyMenuAdminView onBack={() => onNavigate({ name: "products" })} />}
      {view.name === "dish_ranking" && <DishRankingView onNavigate={onNavigate} />}
      {view.name === "suppliers" && <SuppliersView />}
      {view.name === "recipes" && <RecipesView />}
      {view.name === "sunat" && <SunatView />}
      {view.name === "staff" && (
        currentUser.role === "Owner" ? (
          <StaffView />
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-stone-200 shadow-sm text-center max-w-md mx-auto my-12 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-stone-900">Módulo en Desarrollo</h2>
            <p className="text-xs text-stone-500 font-medium mt-2 leading-relaxed">
              El módulo de <strong>Personal & Turnos</strong> se encuentra temporalmente oculto y en fase de desarrollo. Acceso exclusivo para el rol <strong>Owner (Valentino)</strong>.
            </p>
            <button
              onClick={() => onNavigate({ name: "dashboard" })}
              className="mt-6 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition"
            >
              Volver al Panel Principal
            </button>
          </div>
        )
      )}
    </main>
  );
};
