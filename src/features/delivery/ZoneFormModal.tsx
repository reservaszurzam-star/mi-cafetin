import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

interface ZoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (zoneData: {
    name: string;
    cost: number;
    estimatedMinutes: number;
  }) => void;
}

export const ZoneFormModal: React.FC<ZoneFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [zoneName, setZoneName] = useState('');
  const [zoneCost, setZoneCost] = useState('6.00');
  const [zoneMins, setZoneMins] = useState('30');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    onSave({
      name: zoneName.trim(),
      cost: parseFloat(zoneCost) || 5.00,
      estimatedMinutes: parseInt(zoneMins) || 30,
    });
    setZoneName('');
    setZoneCost('6.00');
    setZoneMins('30');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <MapPin className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 leading-tight">Nueva Zona de Reparto</h3>
              <p className="text-xs text-stone-500 font-semibold">Configura costo y tiempo estimado</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Nombre de la Zona *
            </label>
            <input
              type="text"
              placeholder="Ej: Zona Sur (0 - 4 km)"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              required
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Tarifa (S/)
              </label>
              <input
                type="number"
                step="0.50"
                value={zoneCost}
                onChange={(e) => setZoneCost(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Tiempo Estimado (min)
              </label>
              <input
                type="number"
                value={zoneMins}
                onChange={(e) => setZoneMins(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-stone-900 text-white font-black rounded-xl text-xs hover:bg-stone-800 transition shadow-md"
            >
              Crear Zona
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
