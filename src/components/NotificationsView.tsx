import React from 'react';
import { useAppStore } from '../hooks/StoreContext';
import { AlertCircle, PackageX, Users, ArrowRight } from 'lucide-react';
import { ViewState } from '../App';

export default function NotificationsView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { settings, products, customers, transactions } = useAppStore();

  const getCustomerBalance = (customerId: string) => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .reduce((acc, t) => acc + (t.type === 'charge' ? t.amount : -t.amount), 0);
  };

  const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock <= settings.lowStockThreshold);
  
  const overdueCustomers = customers.map(c => {
    const balance = getCustomerBalance(c.id);
    if (balance <= 0) return null;
    
    const charges = transactions.filter(t => t.customerId === c.id && t.type === 'charge').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (charges.length === 0) return null;
    
    const oldestCharge = charges[0];
    const daysOld = Math.floor((new Date().getTime() - new Date(oldestCharge.date).getTime()) / (1000 * 3600 * 24));
    
    if (daysOld > settings.overdueDaysThreshold) {
      return { ...c, balance, daysOld };
    }
    return null;
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  const hasNotifications = lowStockProducts.length > 0 || overdueCustomers.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display text-stone-800 dark:text-stone-100 tracking-tight">Notificaciones</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Alertas importantes sobre tu inventario y clientes.</p>
      </div>

      {!hasNotifications ? (
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/60 dark:border-stone-800 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-medium text-stone-800 dark:text-stone-100 mb-2">Todo en orden</h2>
          <p className="text-stone-500 dark:text-stone-400 max-w-md">No tienes notificaciones pendientes. Tu inventario es suficiente y no hay deudas vencidas importantes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdueCustomers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-rose-600 dark:text-rose-400 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Pagos Atrasados
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueCustomers.map(c => (
                  <div key={c.id} className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/60 dark:border-stone-800 shadow-sm p-5 border-l-4 border-l-rose-500 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50" onClick={() => onNavigate({ name: 'customer_detail', customerId: c.id })}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-stone-800 dark:text-stone-100">{c.name}</h3>
                        <p className="text-sm text-rose-600 mt-1">{settings.currency} {c.balance.toFixed(2)} adeudado</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Cargo más antiguo: hace {c.daysOld} días</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-amber-600 dark:text-amber-500 flex items-center">
                <PackageX className="w-5 h-5 mr-2" />
                Inventario Bajo
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/60 dark:border-stone-800 shadow-sm p-5 border-l-4 border-l-amber-500 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50" onClick={() => onNavigate({ name: 'products' })}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-stone-800 dark:text-stone-100">{p.name}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{p.category}</p>
                        <p className="text-sm font-medium text-amber-600 mt-2">
                          {p.stock === 0 ? 'Agotado' : `Quedan ${p.stock} unidad${p.stock === 1 ? '' : 'es'}`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
