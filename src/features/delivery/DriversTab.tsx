import React from 'react';
import { Plus, Bike, UserCheck, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DeliveryDriver, User } from '../../types';

interface DriversTabProps {
  drivers: DeliveryDriver[];
  users: User[];
  onOpenCreateDriver: () => void;
  onOpenEditDriver: (driver: DeliveryDriver) => void;
  onDeleteDriver: (driverId: string) => void;
}

export const DriversTab: React.FC<DriversTabProps> = ({
  drivers,
  users,
  onOpenCreateDriver,
  onOpenEditDriver,
  onDeleteDriver,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-black text-lg text-stone-900">Flota de Motorizados & Cuentas Vinculadas</h3>
          <p className="text-xs text-stone-500 font-semibold">Cada repartidor puede conectarse con su usuario del sistema para rastreo en tiempo real</p>
        </div>
        <button
          onClick={onOpenCreateDriver}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Agregar Motorizado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drivers.map((drv) => {
          const linkedUser = users.find(u => u.id === drv.userId);

          return (
            <div key={drv.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-stone-900">{drv.name}</h4>
                    <p className="text-xs text-stone-500 font-semibold">{drv.phone}</p>
                    {linkedUser && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1 border border-blue-200">
                        <UserCheck className="w-3 h-3" /> @{linkedUser.username} ({linkedUser.role})
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                  drv.status === 'disponible' ? "bg-emerald-100 text-emerald-800" :
                  drv.status === 'en_ruta' ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"
                )}>
                  {drv.status}
                </span>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1.5">
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Placa / Vehículo:</span>
                  <span className="font-bold text-stone-900">{drv.plateNumber || 'Sin Placa'} ({drv.vehicleType})</span>
                </div>
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Entregas activas:</span>
                  <span className="font-bold text-stone-900">{drv.activeOrdersCount || 0}</span>
                </div>
                <div className="flex justify-between text-stone-600 font-medium">
                  <span>Señal GPS:</span>
                  <span className="font-bold flex items-center gap-1.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      drv.isOnline ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                    )} />
                    <span className={drv.isOnline ? "text-emerald-700" : "text-stone-500"}>
                      {drv.isOnline ? 'En Tiempo Real' : 'Standby'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => {
                    const clean = drv.phone.replace(/\D/g, '');
                    window.open(`https://wa.me/${clean}`, '_blank');
                  }}
                  className="flex-1 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button
                  onClick={() => onOpenEditDriver(drv)}
                  className="p-2 text-stone-600 hover:text-amber-600 rounded-xl hover:bg-stone-100 transition"
                  title="Editar motorizado"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteDriver(drv.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                  title="Eliminar motorizado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
