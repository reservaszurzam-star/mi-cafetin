import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, X } from 'lucide-react';
import { Supplier, PurchaseOrder, PurchaseOrderItem } from './supplierTypes';
import { formatMoney } from '../../lib/formatters';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Omit<PurchaseOrder, 'id'>) => void;
  suppliers: Supplier[];
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  suppliers,
}) => {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    { itemId: '1', itemName: '', unit: 'kg', quantity: 1, unitCost: 10, totalCost: 10 },
  ]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { itemId: String(Date.now()), itemName: '', unit: 'kg', quantity: 1, unitCost: 10, totalCost: 10 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalCost = (updated.quantity || 0) * (updated.unitCost || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    if (!matchedSupplier || items.length === 0) return;

    const orderNumber = `OC-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    onSave({
      orderNumber,
      supplierId: matchedSupplier.id,
      supplierName: matchedSupplier.name,
      date: dateStr,
      status: 'Pendiente',
      items: items.filter(i => i.itemName.trim() !== ''),
      totalAmount,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">Generar Orden de Compra</h3>
              <p className="text-xs text-stone-500 font-semibold">Solicitud de insumos para abastecimiento de cocina</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Seleccionar Proveedor *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 cursor-pointer"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category} · {s.paymentTerms})</option>
              ))}
            </select>
          </div>

          {/* Tabla de Ítems de Compra */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider">
                Insumos a Solicitar
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Ítem
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Nombre del insumo (ej: Pollo fresco)"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Unidad (kg, saco)"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold text-center outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Cant."
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold text-center outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.10"
                      placeholder="Costo"
                      value={item.unitCost}
                      onChange={(e) => handleItemChange(index, 'unitCost', Number(e.target.value))}
                      required
                      className="w-full bg-white border border-stone-300 rounded-lg p-1.5 text-xs font-bold text-right outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Notas / Instrucciones de Entrega
            </label>
            <input
              type="text"
              placeholder="Ej: Entregar antes de las 10:00 AM en puerta de almacén"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          {/* Resumen Total */}
          <div className="flex items-center justify-between bg-stone-900 text-white p-4 rounded-2xl">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block">Total Estimado</span>
              <span className="text-2xl font-black font-mono text-amber-400">{formatMoney(totalAmount)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition"
              >
                Crear Orden
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
