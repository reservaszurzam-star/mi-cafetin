import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/StoreContext';
import { Truck, Motorbike, MapPin, Phone, User, CheckCircle2, PackageSearch, Navigation, Clock, Search, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { RestaurantOrder } from '../types';

export default function DeliveryView() {
  const { orders, updateOrder, updateOrderStatus } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Estados modales
  const [assigningOrder, setAssigningOrder] = useState<RestaurantOrder | null>(null);
  const [driverName, setDriverName] = useState('');

  // Filtrar comandas que son delivery
  const deliveryOrders = useMemo(() => {
    return orders.filter(o => o.type === 'delivery' && o.status !== 'draft');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return deliveryOrders.filter(o => 
      o.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (o.customerPhone && o.customerPhone.includes(searchTerm)) ||
      (o.dinerName && o.dinerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [deliveryOrders, searchTerm]);

  // Agrupadas por estado
  const preparingOrders = filteredOrders.filter(o => o.status === 'sent' || o.status === 'partially_sent');
  const readyOrders = filteredOrders.filter(o => o.status === 'served' && !o.driverName);
  const onWayOrders = filteredOrders.filter(o => o.status === 'served' && o.driverName); // Custom logic for 'en camino'
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'paid');

  const handleAssignDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigningOrder && driverName.trim()) {
      updateOrder(assigningOrder.id, { driverName: driverName.trim() });
      setAssigningOrder(null);
      setDriverName('');
    }
  };

  const renderCard = (ord: RestaurantOrder, type: 'preparing' | 'ready' | 'onWay' | 'delivered') => {
    const mins = Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000);
    const isLate = type === 'preparing' && mins > 20;

    return (
      <div key={ord.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-400/50 transition-all group flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-black text-stone-900 dark:text-white flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-amber-500" /> {ord.tableNumber}
            </h4>
            {ord.dinerName && <p className="text-xs text-stone-500 flex items-center gap-1 mt-1"><User className="w-3 h-3"/> {ord.dinerName}</p>}
            {ord.customerPhone && <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/> {ord.customerPhone}</p>}
          </div>
          <span className={cn(
            "px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1",
            isLate ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
          )}>
            <Clock className="w-3 h-3"/> {mins} min
          </span>
        </div>
        
        {ord.deliveryAddress && (
          <div className="bg-stone-50 dark:bg-stone-950/50 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800/80">
            <p className="text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-1.5 leading-tight">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5"/> 
              <span className="font-medium">{ord.deliveryAddress}</span>
            </p>
          </div>
        )}

        {type === 'onWay' && ord.driverName && (
          <div className="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-800/50 flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0">
              <Navigation className="w-3 h-3" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Motorizado Asignado</p>
              <p className="text-xs font-bold text-stone-900 dark:text-white">{ord.driverName}</p>
            </div>
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
          {type === 'ready' && (
            <button onClick={() => setAssigningOrder(ord)} className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
              <Send className="w-3.5 h-3.5"/> Asignar Repartidor
            </button>
          )}
          {type === 'onWay' && (
            <button onClick={() => updateOrderStatus(ord.id, 'delivered')} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5"/> Marcar Entregado
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-8 h-8 text-amber-500" />
            Central de Delivery
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Gestiona los despachos y motorizados en tiempo real.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            placeholder="Buscar pedido, cliente, tlf..." 
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* ── KANBAN BOARD ── */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        
        {/* Columna 1 */}
        <div className="flex flex-col w-80 shrink-0 bg-stone-50/50 dark:bg-stone-950/30 border border-stone-200/50 dark:border-stone-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-stone-200/50 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50">
            <h3 className="font-black text-stone-700 dark:text-stone-300 flex items-center justify-between">
              En Cocina
              <span className="bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs px-2 py-0.5 rounded-full">{preparingOrders.length}</span>
            </h3>
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
            {preparingOrders.map(o => renderCard(o, 'preparing'))}
          </div>
        </div>

        {/* Columna 2 */}
        <div className="flex flex-col w-80 shrink-0 bg-stone-50/50 dark:bg-stone-950/30 border border-stone-200/50 dark:border-stone-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-stone-200/50 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50">
            <h3 className="font-black text-stone-700 dark:text-stone-300 flex items-center justify-between">
              Listo (Despacho)
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 text-xs px-2 py-0.5 rounded-full">{readyOrders.length}</span>
            </h3>
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
            {readyOrders.map(o => renderCard(o, 'ready'))}
          </div>
        </div>

        {/* Columna 3 */}
        <div className="flex flex-col w-80 shrink-0 bg-stone-50/50 dark:bg-stone-950/30 border border-stone-200/50 dark:border-stone-800 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-stone-200/50 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50">
            <h3 className="font-black text-stone-700 dark:text-stone-300 flex items-center justify-between">
              En Camino
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 text-xs px-2 py-0.5 rounded-full">{onWayOrders.length}</span>
            </h3>
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
            {onWayOrders.map(o => renderCard(o, 'onWay'))}
          </div>
        </div>

        {/* Columna 4 */}
        <div className="flex flex-col w-80 shrink-0 bg-stone-50/50 dark:bg-stone-950/30 border border-stone-200/50 dark:border-stone-800 rounded-3xl overflow-hidden opacity-70">
          <div className="p-4 border-b border-stone-200/50 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50">
            <h3 className="font-black text-stone-700 dark:text-stone-300 flex items-center justify-between">
              Entregados
              <span className="bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs px-2 py-0.5 rounded-full">{deliveredOrders.length}</span>
            </h3>
          </div>
          <div className="p-3 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3">
            {deliveredOrders.map(o => renderCard(o, 'delivered'))}
          </div>
        </div>

      </div>

      {/* ── MODAL ASIGNAR MOTORIZADO ── */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-md flex items-center justify-center p-4">
           <form onSubmit={handleAssignDriver} className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-sm border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-stone-50 dark:bg-stone-950/50 px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Motorbike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-white leading-tight">Asignar Repartidor</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{assigningOrder.tableNumber}</p>
                </div>
              </div>
              <div className="p-6">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Nombre del Motorizado</label>
                <input 
                  placeholder="Ej. Carlos V." 
                  value={driverName} 
                  onChange={e=>setDriverName(e.target.value)} 
                  required 
                  autoFocus
                  className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" 
                />
              </div>
              <div className="bg-stone-50 dark:bg-stone-950/50 p-6 flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
                <button type="button" onClick={()=>setAssigningOrder(null)} className="px-5 py-2.5 font-bold text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 font-black text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 active:scale-95 transition-all shadow-md">Despachar Pedido</button>
              </div>
           </form>
        </div>
      )}

    </div>
  );
}
