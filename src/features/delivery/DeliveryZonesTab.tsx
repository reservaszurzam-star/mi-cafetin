import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DeliveryZone, Settings } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface DeliveryZonesTabProps {
  zones: DeliveryZone[];
  settings: Settings;
  onOpenCreateZone: () => void;
  onDeleteZone: (zoneId: string) => void;
}

export const DeliveryZonesTab: React.FC<DeliveryZonesTabProps> = ({
  zones,
  settings,
  onOpenCreateZone,
  onDeleteZone,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-lg text-stone-900">Zonas de Cobertura y Costos</h3>
        <button
          onClick={onOpenCreateZone}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Nueva Zona
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((z) => (
          <div key={z.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-black text-sm text-stone-900">{z.name}</h4>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">Tiempo estimado: {z.estimatedMinutes} min</p>
              </div>
              <button onClick={() => onDeleteZone(z.id)} className="text-stone-400 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">Tarifa de Envío</span>
              <span className="text-2xl font-black font-mono text-stone-900">{formatMoney(z.cost, settings.currency)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
