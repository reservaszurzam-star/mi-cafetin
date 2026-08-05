import React, { useState } from 'react';
import { ChefHat, Clock, CheckCircle2, AlertCircle, Utensils, Coffee, Printer } from 'lucide-react';
import { useAppStore } from '../hooks/StoreContext';
import { ThermalTicket } from './ThermalTicket';
import { RestaurantOrder } from '../types';

export default function KDSView() {
  const { orders, updateOrderStatus } = useAppStore();
  const [ticketToPrint, setTicketToPrint] = useState<RestaurantOrder | null>(null);

  const activeOrders = orders.filter((o) => o.status === 'sent' || o.status === 'partially_sent');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-amber-600" />
            Pantalla KDS Cocina
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            Gestión de barra, comandas de salón y comandas de delivery activas
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">En Preparación</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{activeOrders.length} Comandas</p>
          </div>
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Comandas Servidas</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
              {orders.filter((o) => o.status === 'served' || o.status === 'paid').length} Pedidos
            </p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Ítems de Barra</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {orders.flatMap((o) => o.items).filter((i) => i.station === 'Barra & Bebidas').length} ítems
            </p>
          </div>
          <Coffee className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Comandas Activas Grilla */}
      {activeOrders.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200/60 dark:border-stone-800 shadow-sm text-center py-12">
          <ChefHat className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-stone-800 dark:text-stone-200">No hay comandas pendientes</h3>
          <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
            Todas las comandas de cocina y barra han sido despachadas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map((order) => {
            const minutesElapsed = Math.floor(
              (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60)
            );
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border-2 border-amber-500/40 dark:border-amber-500/30 shadow-md flex flex-col overflow-hidden"
              >
                {/* Header Comanda */}
                <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      {order.type === 'salón' ? `Piso ${order.floor}` : order.type}
                    </span>
                    <h3 className="text-lg font-bold">{order.tableNumber}</h3>
                    {order.dinerName && <p className="text-xs text-stone-300">{order.dinerName}</p>}
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-amber-500 text-stone-950 font-bold text-xs rounded-lg flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {minutesElapsed} min
                    </span>
                    <p className="text-[10px] text-stone-400 mt-1">{order.waiterName || 'Atención'}</p>
                  </div>
                </div>

                {/* Lista de Ítems */}
                <div className="p-4 flex-1 space-y-3 divide-y divide-stone-100 dark:divide-stone-800">
                  {order.items.map((item) => (
                    <div key={item.id} className="pt-2 first:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {item.quantity}x
                          </span>
                          <span className="font-semibold text-stone-800 dark:text-stone-100 text-sm">
                            {item.productName}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                          {item.station}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium ml-8 mt-1 italic">
                          Nota: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer Acción */}
                <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2">
                  <button
                    onClick={() => setTicketToPrint(order)}
                    className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" /> Imprimir Ticket Térmico
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'served')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marcar como Servido / Listo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de vista previa e impresión de ticket térmico */}
      {ticketToPrint && (
        <ThermalTicket
          order={ticketToPrint}
          onClose={() => setTicketToPrint(null)}
        />
      )}
    </div>
  );
}
