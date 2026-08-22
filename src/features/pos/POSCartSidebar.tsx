import React, { useState } from 'react';
import { 
  Plus, Minus, Trash2, Send, CreditCard, Printer, 
  Edit2, Check, MessageSquare, Clock, User,
  Utensils, Truck, ClipboardList, ChevronLeft
} from 'lucide-react';
import { RestaurantOrder, OrderItem, Settings } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface POSCartSidebarProps {
  activeOrder: RestaurantOrder | null;
  selectedTable: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onSaveNote: (productId: string, note: string) => void;
  onSendToKitchen: () => void;
  onOpenCheckout: () => void;
  onPrintPreBill: () => void;
  onSaveCustomerName: (name: string) => void;
  onBackToCatalog?: () => void;
  settings: Settings;
}

export const POSCartSidebar: React.FC<POSCartSidebarProps> = ({
  activeOrder,
  selectedTable,
  onUpdateQuantity,
  onRemoveItem,
  onSaveNote,
  onSendToKitchen,
  onOpenCheckout,
  onPrintPreBill,
  onSaveCustomerName,
  onBackToCatalog,
  settings,
}) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isEditingCustomerName, setIsEditingCustomerName] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState(activeOrder?.dinerName || '');

  const items = activeOrder?.items || [];
  const unsentCount = items.filter(i => !i.sentToKitchen).length;
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleStartEditNote = (item: OrderItem) => {
    setEditingNoteId(item.productId);
    setNoteText(item.notes || '');
  };

  const handleCommitNote = (productId: string) => {
    onSaveNote(productId, noteText);
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleCommitCustomerName = () => {
    onSaveCustomerName(tempCustomerName);
    setIsEditingCustomerName(false);
  };

  return (
    <div className="w-full lg:w-96 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between overflow-hidden shrink-0 min-h-0">
      
      {/* Header Comanda */}
      <div className="p-3 sm:p-4 border-b border-stone-100 bg-stone-50 space-y-2">
        {onBackToCatalog && (
          <button
            type="button"
            onClick={onBackToCatalog}
            className="w-full py-2 px-3 bg-stone-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 lg:hidden mb-1"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span>← Volver a Catálogo de Platos</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center">
              {selectedTable.startsWith('D-') ? (
                <Truck className="w-4 h-4" />
              ) : (
                <Utensils className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm text-stone-900 leading-tight">
                Mesa / Pedido: <span className="text-amber-600">{selectedTable}</span>
              </h3>
              <p className="text-[10px] text-stone-500 font-semibold">{items.length} ítems en comanda</p>
            </div>
          </div>

          <button
            onClick={onPrintPreBill}
            disabled={items.length === 0}
            className="p-2 text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold transition disabled:opacity-40"
            title="Imprimir Pre-cuenta para cliente"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Nombre de Cliente Editable */}
        <div className="bg-white p-2 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
          {isEditingCustomerName ? (
            <div className="flex items-center gap-1.5 w-full">
              <input
                type="text"
                placeholder="Nombre del comensal..."
                value={tempCustomerName}
                onChange={(e) => setTempCustomerName(e.target.value)}
                autoFocus
                className="w-full bg-stone-50 text-xs font-bold p-1 rounded-lg outline-none border border-amber-400"
              />
              <button
                onClick={handleCommitCustomerName}
                className="p-1 bg-amber-500 text-white rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-stone-600 font-bold">
                <User className="w-3.5 h-3.5 text-stone-400" />
                {activeOrder?.dinerName || 'Sin comensal asignado'}
              </span>
              <button
                onClick={() => {
                  setTempCustomerName(activeOrder?.dinerName || '');
                  setIsEditingCustomerName(true);
                }}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Ítems en Carrito */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {items.length === 0 ? (
          <div className="text-center py-16 text-stone-400 space-y-2">
            <ClipboardList className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-xs font-bold text-stone-500">Comanda vacía</p>
            <p className="text-[11px]">Selecciona platos del catálogo para agregarlos.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className={`p-3 rounded-2xl border transition-all ${
                item.sentToKitchen ? 'bg-stone-50/70 border-stone-200' : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-black text-xs text-stone-900 leading-tight">{item.productName}</h5>
                    {item.sentToKitchen ? (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        En Cocina
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded animate-pulse">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-stone-500">
                    {formatMoney(item.price, settings.currency)} c/u
                  </span>
                </div>

                <span className="font-black font-mono text-xs text-stone-900 shrink-0">
                  {formatMoney(item.price * item.quantity, settings.currency)}
                </span>
              </div>

              {/* Controles de Cantidad y Notas */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-stone-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEditNote(item)}
                    className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
                    title="Agregar especificación de cocina"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  {item.notes && (
                    <span className="text-[10px] text-amber-800 italic truncate max-w-[120px]">
                      "{item.notes}"
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-xl border border-stone-200">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, -1)}
                    className="p-1 text-stone-500 hover:text-stone-900"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-black font-mono text-xs px-1 text-stone-900">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, 1)}
                    className="p-1 text-stone-500 hover:text-stone-900"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="p-1 text-stone-300 hover:text-rose-600 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Input de Nota en Vivo */}
              {editingNoteId === item.productId && (
                <div className="mt-2 pt-2 border-t border-amber-200 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Ej: Sin cebolla / Pecho bien dorado"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    autoFocus
                    className="w-full bg-white text-xs p-1.5 rounded-lg border border-amber-300 outline-none font-bold"
                  />
                  <button
                    onClick={() => handleCommitNote(item.productId)}
                    className="px-2 bg-stone-900 text-white rounded-lg text-xs font-bold"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Totales y Acciones */}
      <div className="p-4 bg-stone-50 border-t border-stone-100 space-y-3">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-stone-500 font-semibold">
            <span>Subtotal (sin IGV):</span>
            <span className="font-mono">{formatMoney(total / 1.18, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-stone-500 font-semibold">
            <span>IGV (18%):</span>
            <span className="font-mono">{formatMoney(total - (total / 1.18), settings.currency)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-stone-900 pt-1 border-t border-stone-200">
            <span>Total a Pagar:</span>
            <span className="font-mono text-amber-600">{formatMoney(total, settings.currency)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSendToKitchen}
            disabled={unsentCount === 0}
            className="py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar ({unsentCount})</span>
          </button>

          <button
            onClick={onOpenCheckout}
            disabled={items.length === 0}
            className="py-3 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-40"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cobrar</span>
          </button>
        </div>
      </div>

    </div>
  );
};
