import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { WasteRecord } from './recipeTypes';

interface WasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (waste: Omit<WasteRecord, 'id'>) => void;
}

export const WasteModal: React.FC<WasteModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('kg');
  const [cost, setCost] = useState<number>(10);
  const [reason, setReason] = useState<WasteRecord['reason']>('Mal estado');
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    onSave({
      itemId: `inv-${Date.now()}`,
      itemName: itemName.trim(),
      quantity,
      unit,
      cost,
      reason,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      responsible: responsible.trim() || 'Chef de Turno',
      notes: notes.trim() || undefined,
    });

    setItemName('');
    setQuantity(1);
    setCost(10);
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-black">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">Registrar Merma / Desperdicio</h3>
              <p className="text-xs text-stone-500 font-semibold">Pérdida de insumos o mermas operativas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Nombre del Insumo / Plato *
            </label>
            <input
              type="text"
              placeholder="Ej: Papa Canchán, Filete de Pollo..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              autoFocus
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Unidad
              </label>
              <input
                type="text"
                placeholder="kg, und"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Costo S/ *
              </label>
              <input
                type="number"
                step="0.50"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Motivo de Merma
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-rose-500"
              >
                <option value="Mal estado">Mal estado / Humedad</option>
                <option value="Vencimiento">Vencimiento</option>
                <option value="Error de cocina">Error de cocina / Quemado</option>
                <option value="Derrame / Rotura">Derrame / Rotura</option>
                <option value="Otro">Otro motivo</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Responsable
              </label>
              <input
                type="text"
                placeholder="Ej: Marcos Quispe"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Observaciones
            </label>
            <input
              type="text"
              placeholder="Detalles sobre lo ocurrido..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-600 text-white font-black rounded-xl text-xs hover:bg-rose-700 transition shadow-md"
            >
              Registrar Merma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
