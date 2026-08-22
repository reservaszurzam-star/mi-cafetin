import React, { useState } from 'react';
import { Bike, X } from 'lucide-react';
import { RestaurantOrder, DeliveryDriver } from '../../types';

interface AssignDriverModalProps {
  order: RestaurantOrder | null;
  drivers: DeliveryDriver[];
  onClose: () => void;
  onAssign: (order: RestaurantOrder, driverId: string) => void;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  order,
  drivers,
  onClose,
  onAssign,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState('');

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId) return;
    onAssign(order, selectedDriverId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Bike className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 leading-tight">Asignar Repartidor</h3>
              <p className="text-xs text-stone-500 font-semibold">Comanda {order.tableNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
              Seleccionar Motorizado
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {drivers.map(drv => (
                <label 
                  key={drv.id} 
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    selectedDriverId === drv.id 
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20' 
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="driver"
                      value={drv.id}
                      checked={selectedDriverId === drv.id}
                      onChange={() => setSelectedDriverId(drv.id)}
                      className="accent-amber-500"
                    />
                    <div>
                      <span className="font-black text-xs text-stone-900 block">{drv.name}</span>
                      <span className="text-[10px] text-stone-500 font-semibold">{drv.vehicleType} · Placa: {drv.plateNumber || 'N/A'}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    drv.status === 'disponible' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {drv.status === 'disponible' ? 'Disponible' : `${drv.activeOrdersCount || 1} en ruta`}
                  </span>
                </label>
              ))}
            </div>
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
              disabled={!selectedDriverId}
              className="flex-1 py-2.5 bg-stone-900 text-white font-black rounded-xl text-xs hover:bg-stone-800 transition disabled:opacity-50 shadow-md"
            >
              Despachar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
