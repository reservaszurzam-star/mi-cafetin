import React, { useState, useMemo } from 'react';
import { 
  PackageSearch, User, Phone, Clock, MapPin, Navigation, 
  MessageCircle, Send, CheckCircle2, Search 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RestaurantOrder, DeliveryDriver, Settings } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface DeliveryKanbanTabProps {
  orders: RestaurantOrder[];
  drivers: DeliveryDriver[];
  settings: Settings;
  onAssignDriver: (order: RestaurantOrder) => void;
  onMarkDelivered: (orderId: string) => void;
  onSendWhatsAppToDriver: (order: RestaurantOrder) => void;
}

export const DeliveryKanbanTab: React.FC<DeliveryKanbanTabProps> = ({
  orders,
  drivers,
  settings,
  onAssignDriver,
  onMarkDelivered,
  onSendWhatsAppToDriver,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar pedidos delivery activos
  const deliveryOrders = useMemo(() => {
    return orders.filter(o => o.type === 'delivery' && o.status !== 'draft');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return deliveryOrders.filter(o => 
      o.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (o.customerPhone && o.customerPhone.includes(searchTerm)) ||
      (o.dinerName && o.dinerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [deliveryOrders, searchTerm]);

  // Grupos del Kanban
  const preparingOrders = filteredOrders.filter(o => o.status === 'sent' || o.status === 'partially_sent');
  const readyOrders = filteredOrders.filter(o => o.status === 'served' && !o.driverName);
  const onWayOrders = filteredOrders.filter(o => o.status === 'served' && o.driverName);
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered');

  const renderCard = (ord: RestaurantOrder, type: 'preparing' | 'ready' | 'onWay' | 'delivered') => {
    const mins = Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000);
    const isLate = type === 'preparing' && mins > 20;

    return (
      <div key={ord.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-black text-stone-900 flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-amber-500" /> {ord.tableNumber}
            </h4>
            {ord.dinerName && (
              <p className="text-xs text-stone-600 font-bold flex items-center gap-1 mt-1">
                <User className="w-3 h-3 text-stone-400"/> {ord.dinerName}
              </p>
            )}
            {ord.customerPhone && (
              <p className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-stone-400"/> {ord.customerPhone}
              </p>
            )}
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1",
            isLate ? "bg-rose-100 text-rose-800 animate-pulse" : "bg-stone-100 text-stone-700"
          )}>
            <Clock className="w-3 h-3"/> {mins} min
          </span>
        </div>
        
        {ord.deliveryAddress && (
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
            <p className="text-[11px] text-stone-700 flex items-start gap-1.5 leading-tight font-medium">
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5"/> 
              <span className="line-clamp-2">{ord.deliveryAddress}</span>
            </p>
            {ord.routeDistanceKm && (
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                <span>{ord.routeDistanceKm} km</span>
                <span>•</span>
                <span>~{ord.routeDurationMins || 20} min</span>
              </div>
            )}
          </div>
        )}

        {/* Detalle de ítems */}
        <div className="text-xs space-y-1 bg-stone-50/60 p-2 rounded-xl border border-stone-100">
          {ord.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-stone-700 text-[11px]">
              <span><strong>{item.quantity}x</strong> {item.productName}</span>
              <span className="font-mono font-bold text-stone-900">{formatMoney(item.price * item.quantity, settings.currency)}</span>
            </div>
          ))}
          <div className="border-t border-stone-200 pt-1.5 flex justify-between font-black text-xs text-stone-900">
            <span>Total:</span>
            <span>{formatMoney(ord.total, settings.currency)}</span>
          </div>
        </div>

        {type === 'onWay' && ord.driverName && (
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0">
                <Navigation className="w-3 h-3" />
              </div>
              <div>
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Motorizado</p>
                <p className="text-xs font-bold text-stone-900">{ord.driverName}</p>
              </div>
            </div>
            <button
              onClick={() => onSendWhatsAppToDriver(ord)}
              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              title="Enviar ruta y datos por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-stone-100 flex flex-col gap-2">
          {type === 'ready' && (
            <button 
              onClick={() => onAssignDriver(ord)} 
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5"/> Asignar Repartidor
            </button>
          )}
          {type === 'onWay' && (
            <button 
              onClick={() => onMarkDelivered(ord.id)} 
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5"/> Marcar Entregado
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por cliente, teléfono o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-stone-900 outline-none focus:border-amber-500 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Columna: En Cocina */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <span className="font-black text-xs text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              En Preparación ({preparingOrders.length})
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
            {preparingOrders.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">Sin pedidos en cocina</p>
            ) : (
              preparingOrders.map(o => renderCard(o, 'preparing'))
            )}
          </div>
        </div>

        {/* Columna: Listos para Despacho */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <span className="font-black text-xs text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Listos para Salir ({readyOrders.length})
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
            {readyOrders.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">Sin pedidos por asignar</p>
            ) : (
              readyOrders.map(o => renderCard(o, 'ready'))
            )}
          </div>
        </div>

        {/* Columna: En Ruta */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <span className="font-black text-xs text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
              En Ruta / Motorizado ({onWayOrders.length})
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
            {onWayOrders.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">Sin pedidos en camino</p>
            ) : (
              onWayOrders.map(o => renderCard(o, 'onWay'))
            )}
          </div>
        </div>

        {/* Columna: Entregados */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <span className="font-black text-xs text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Entregados Hoy ({deliveredOrders.length})
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
            {deliveredOrders.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">Sin pedidos entregados</p>
            ) : (
              deliveredOrders.map(o => renderCard(o, 'delivered'))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
