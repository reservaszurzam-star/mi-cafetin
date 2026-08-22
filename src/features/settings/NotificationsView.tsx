import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  Bell, AlertCircle, PackageX, Users, ArrowRight, CheckCircle2, 
  Clock, Flame, Bike, MessageCircle, Check, Trash2, Filter, 
  Sparkles, ExternalLink, ShieldAlert
} from 'lucide-react';
import { ViewState } from "../../App";
import { cn } from "../../lib/utils";

type NotifCategory = 'todas' | 'inventario' | 'deudas' | 'cocina' | 'delivery';

export default function NotificationsView({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { settings, products, customers, transactions, orders, inventoryItems } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<NotifCategory>('todas');
  const [readIds, setReadIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('cafetin_read_notifs');
    return saved ? JSON.parse(saved) : [];
  });

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadIds(prev => {
      const updated = [...new Set([...prev, id])];
      localStorage.setItem('cafetin_read_notifs', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = generatedNotifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('cafetin_read_notifs', JSON.stringify(allIds));
  };

  const getCustomerBalance = (customerId: string) => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .reduce((acc, t) => acc + (t.type === 'charge' ? t.amount : -t.amount), 0);
  };

  // Generar notificaciones dinámicas del sistema
  const generatedNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      category: NotifCategory;
      severity: 'critico' | 'advertencia' | 'info';
      title: string;
      desc: string;
      time: string;
      actionLabel: string;
      onAction: () => void;
      whatsappPhone?: string;
      whatsappMsg?: string;
    }> = [];

    // 1. Productos con Stock Bajo / Agotado
    products.forEach(p => {
      if (p.stock !== undefined && p.stock <= (settings.lowStockThreshold || 5)) {
        list.push({
          id: `stock-${p.id}`,
          category: 'inventario',
          severity: p.stock === 0 ? 'critico' : 'advertencia',
          title: p.stock === 0 ? `Producto Agotado: ${p.name}` : `Stock Crítico: ${p.name}`,
          desc: p.stock === 0 
            ? `Se han agotado todas las unidades de ${p.name} (${p.category}). Desactívalo o repón stock.`
            : `Quedan únicamente ${p.stock} unidades en carta. El umbral mínimo es de ${settings.lowStockThreshold || 5}.`,
          time: 'En tiempo real',
          actionLabel: 'Ver Productos',
          onAction: () => onNavigate({ name: 'products' })
        });
      }
    });

    // 2. Insumos de Almacén con Stock Mínimo
    inventoryItems.forEach(item => {
      if (item.currentStock <= item.minStock) {
        list.push({
          id: `inv-${item.id}`,
          category: 'inventario',
          severity: 'advertencia',
          title: `Insumo Bajo: ${item.name}`,
          desc: `Stock actual: ${item.currentStock} ${item.unit} (Mínimo: ${item.minStock} ${item.unit}). Se requiere compra a proveedor.`,
          time: 'Almacén',
          actionLabel: 'Ver Inventario',
          onAction: () => onNavigate({ name: 'inventory' })
        });
      }
    });

    // 3. Clientes con Deudas Vencidas
    customers.forEach(c => {
      const balance = getCustomerBalance(c.id);
      if (balance > 0) {
        const charges = transactions
          .filter(t => t.customerId === c.id && t.type === 'charge')
          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (charges.length > 0) {
          const oldestCharge = charges[0];
          const daysOld = Math.floor((Date.now() - new Date(oldestCharge.date).getTime()) / (1000 * 3600 * 24));
          
          if (daysOld >= (settings.overdueDaysThreshold || 7)) {
            list.push({
              id: `debt-${c.id}`,
              category: 'deudas',
              severity: 'advertencia',
              title: `Pago Vencido: ${c.name}`,
              desc: `Mantiene una deuda de ${settings.currency} ${balance.toFixed(2)} desde hace ${daysOld} días (excede el plazo de ${settings.overdueDaysThreshold || 7} días).`,
              time: `Hace ${daysOld} días`,
              actionLabel: 'Cobrar Cliente',
              onAction: () => onNavigate({ name: 'customer_detail', customerId: c.id }),
              whatsappPhone: c.phone,
              whatsappMsg: `Hola ${c.name}, te saludamos de ${settings.companyName}. Te recordamos amablemente que mantienes un saldo pendiente de ${settings.currency} ${balance.toFixed(2)}. ¡Muchas gracias!`
            });
          }
        }
      }
    });

    // 4. Comandas con demora en Cocina
    const delayedOrders = orders.filter(o => o.status === 'sent_to_kitchen');
    if (delayedOrders.length > 0) {
      list.push({
        id: 'kds-alert-1',
        category: 'cocina',
        severity: 'critico',
        title: `${delayedOrders.length} Comanda(s) en Preparación`,
        desc: `Existen órdenes pendientes de despacho en el monitor KDS de cocina. Revisa los tiempos de atención.`,
        time: 'Cocina Activa',
        actionLabel: 'Abrir KDS',
        onAction: () => onNavigate({ name: 'kds' })
      });
    }

    return list;
  }, [products, inventoryItems, customers, transactions, orders, settings, onNavigate]);

  const filteredNotifications = useMemo(() => {
    return generatedNotifications.filter(n => {
      if (activeCategory === 'todas') return true;
      return n.category === activeCategory;
    });
  }, [generatedNotifications, activeCategory]);

  const unreadCount = useMemo(() => {
    return generatedNotifications.filter(n => !readIds.includes(n.id)).length;
  }, [generatedNotifications, readIds]);

  const openWhatsApp = (phone: string, msg: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = phone.replace(/\D/g, '');
    const full = clean.startsWith('51') ? clean : `51${clean}`;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Centro de Control & Alertas
            </span>
            <span className="text-xs text-stone-400 font-bold">· {settings.companyName}</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-amber-500" />
            Notificaciones & Alertas en Vivo
          </h1>
          <p className="text-xs text-stone-500 font-semibold mt-0.5">
            Alertas automáticas de inventario bajo, deudas por cobrar vencidas y comandas en cocina.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="h-10 px-4 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 rounded-xl font-bold flex items-center justify-center gap-2 transition text-xs"
            >
              <Check className="w-4 h-4 text-emerald-600" /> Marcar Todo como Leído
            </button>
          )}
        </div>
      </div>

      {/* ── MÉTRICAS DE ALERTAS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Alertas Activas</span>
            <Bell className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{generatedNotifications.length}</div>
          <span className="text-[10px] font-bold text-amber-700">{unreadCount} pendientes por revisar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Alertas Críticas</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {generatedNotifications.filter(n => n.severity === 'critico').length}
          </div>
          <span className="text-[10px] font-bold text-rose-600">Atención urgente requerida</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Stock & Carta</span>
            <PackageX className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {generatedNotifications.filter(n => n.category === 'inventario').length}
          </div>
          <span className="text-[10px] font-bold text-amber-600">Platos/Insumos por reponer</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Cobranzas Pendientes</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {generatedNotifications.filter(n => n.category === 'deudas').length}
          </div>
          <span className="text-[10px] font-bold text-purple-600">Fiados fuera de fecha</span>
        </div>
      </div>

      {/* ── TABS DE FILTRO ── */}
      <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200 overflow-x-auto">
        <button
          onClick={() => setActiveCategory('todas')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5",
            activeCategory === 'todas' ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
          )}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Todas ({generatedNotifications.length})</span>
        </button>

        <button
          onClick={() => setActiveCategory('inventario')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5",
            activeCategory === 'inventario' ? "bg-amber-500 text-white shadow-xs" : "text-amber-800 hover:bg-amber-100"
          )}
        >
          <PackageX className="w-3.5 h-3.5" />
          <span>Inventario & Stock</span>
        </button>

        <button
          onClick={() => setActiveCategory('deudas')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5",
            activeCategory === 'deudas' ? "bg-rose-600 text-white shadow-xs" : "text-rose-800 hover:bg-rose-100"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Cobranzas & Fiados</span>
        </button>

        <button
          onClick={() => setActiveCategory('cocina')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5",
            activeCategory === 'cocina' ? "bg-orange-600 text-white shadow-xs" : "text-orange-800 hover:bg-orange-100"
          )}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Cocina & KDS</span>
        </button>
      </div>

      {/* ── LISTADO DE NOTIFICACIONES ── */}
      <div className="flex-1 min-h-0 space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-black text-lg text-stone-900">¡Todo se encuentra en orden!</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm font-medium">
              No tienes alertas pendientes en esta categoría. El inventario está abastecido y no hay anomalías.
            </p>
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const isRead = readIds.includes(notif.id);
            const isCritico = notif.severity === 'critico';

            return (
              <div 
                key={notif.id}
                onClick={notif.onAction}
                className={cn(
                  "bg-white rounded-3xl p-5 border shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer relative overflow-hidden group",
                  isCritico ? "border-l-4 border-l-rose-500 hover:border-rose-300" : "border-l-4 border-l-amber-500 hover:border-amber-300",
                  isRead ? "opacity-75 bg-stone-50/60" : "bg-white"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black border",
                    isCritico ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-amber-50 border-amber-200 text-amber-700"
                  )}>
                    {notif.category === 'inventario' ? <PackageX className="w-6 h-6" /> :
                     notif.category === 'deudas' ? <Users className="w-6 h-6" /> :
                     <Flame className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-stone-900 group-hover:text-amber-700 transition">
                        {notif.title}
                      </h4>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      )}
                      <span className="text-[10px] font-mono font-bold text-stone-400">
                        · {notif.time}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed max-w-3xl">
                      {notif.desc}
                    </p>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                  {notif.whatsappPhone && (
                    <button
                      onClick={(e) => openWhatsApp(notif.whatsappPhone!, notif.whatsappMsg || '', e)}
                      title="Enviar recordatorio por WhatsApp"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); notif.onAction(); }}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-xs"
                  >
                    <span>{notif.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {!isRead && (
                    <button
                      onClick={(e) => markAsRead(notif.id, e)}
                      title="Marcar como leído"
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

