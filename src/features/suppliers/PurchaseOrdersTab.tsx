import React, { useState } from 'react';
import { ShoppingCart, Search, Plus, CheckCircle2, Clock, XCircle, MessageCircle, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PurchaseOrder, Supplier } from './supplierTypes';
import { formatMoney, createWhatsAppUrl } from '../../lib/formatters';

interface PurchaseOrdersTabProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  onOpenCreate: () => void;
  onUpdateStatus: (orderId: string, status: PurchaseOrder['status']) => void;
}

export const PurchaseOrdersTab: React.FC<PurchaseOrdersTabProps> = ({
  orders,
  suppliers,
  onOpenCreate,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || o.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sendOrderToSupplier = (order: PurchaseOrder) => {
    const sup = suppliers.find(s => s.id === order.supplierId);
    const targetPhone = sup?.phone || "987654321";
    const itemsText = order.items.map(i => `• ${i.quantity} ${i.unit} de ${i.itemName} (S/ ${i.totalCost.toFixed(2)})`).join('\n');
    
    const msg = `*ORDEN DE COMPRA ${order.orderNumber}*\n\n` +
      `Estimado proveedor *${order.supplierName}*:\n` +
      `Solicitamos por favor la entrega de los siguientes insumos:\n\n` +
      `${itemsText}\n\n` +
      `*Total Estimado:* ${formatMoney(order.totalAmount)}\n` +
      (order.notes ? `*Notas:* ${order.notes}\n\n` : '\n') +
      `Agradecemos confirmar disponibilidad y fecha de despacho. Muchas gracias.`;

    const url = createWhatsAppUrl(targetPhone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° de orden o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Recibido">Recibido</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nueva Orden
          </button>
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-900 text-white font-black text-[11px] uppercase tracking-wider">
                <th className="p-3.5 px-4">N° Orden</th>
                <th className="p-3.5">Proveedor</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Detalle Ítems</th>
                <th className="p-3.5 text-right">Total</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-stone-50 transition">
                  <td className="p-3.5 px-4 font-mono font-black text-amber-700">{ord.orderNumber}</td>
                  <td className="p-3.5 font-bold text-stone-900">{ord.supplierName}</td>
                  <td className="p-3.5 text-stone-500 font-mono">{ord.date}</td>
                  <td className="p-3.5 text-stone-600">
                    <span className="font-semibold">{ord.items.length} insumos:</span> {ord.items.map(i => `${i.quantity} ${i.unit} ${i.itemName}`).slice(0, 2).join(', ')}{ord.items.length > 2 ? '...' : ''}
                  </td>
                  <td className="p-3.5 text-right font-black font-mono text-stone-900">{formatMoney(ord.totalAmount)}</td>
                  <td className="p-3.5 text-center">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black border",
                      ord.status === 'Recibido' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      ord.status === 'Pendiente' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => sendOrderToSupplier(ord)}
                        className="p-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg transition"
                        title="Enviar orden por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </button>
                      {ord.status === 'Pendiente' && (
                        <button
                          onClick={() => onUpdateStatus(ord.id, 'Recibido')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] transition"
                        >
                          Recibir Lote
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
