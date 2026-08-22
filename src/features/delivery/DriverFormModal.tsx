import React, { useState, useEffect } from 'react';
import { Bike, X } from 'lucide-react';
import { DeliveryDriver, User } from '../../types';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (driverData: {
    name: string;
    phone: string;
    plateNumber: string;
    vehicleType: 'Moto' | 'Bicicleta' | 'Auto';
    userId?: string;
  }) => void;
  editingDriver?: DeliveryDriver | null;
  users: User[];
}

export const DriverFormModal: React.FC<DriverFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDriver,
  users,
}) => {
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverPlate, setDriverPlate] = useState('');
  const [driverVehicle, setDriverVehicle] = useState<'Moto' | 'Bicicleta' | 'Auto'>('Moto');
  const [driverUserId, setDriverUserId] = useState('');

  useEffect(() => {
    if (editingDriver) {
      setDriverName(editingDriver.name);
      setDriverPhone(editingDriver.phone);
      setDriverPlate(editingDriver.plateNumber || '');
      setDriverVehicle(editingDriver.vehicleType);
      setDriverUserId(editingDriver.userId || '');
    } else {
      setDriverName('');
      setDriverPhone('');
      setDriverPlate('');
      setDriverVehicle('Moto');
      setDriverUserId('');
    }
  }, [editingDriver, isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = (userId: string) => {
    setDriverUserId(userId);
    const selected = users.find(u => u.id === userId);
    if (selected) {
      if (!driverName) setDriverName(selected.name);
      if (!driverPhone && selected.phone) setDriverPhone(selected.phone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    onSave({
      name: driverName.trim(),
      phone: driverPhone.trim() || '987000000',
      plateNumber: driverPlate.trim() || 'M-0000',
      vehicleType: driverVehicle,
      userId: driverUserId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Bike className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">
                {editingDriver ? 'Editar Motorizado' : 'Registrar Nuevo Motorizado'}
              </h3>
              <p className="text-xs text-stone-500 font-semibold">Datos del repartidor y vehículo de despacho</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Vincular con usuario */}
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Vincular a Cuenta de Usuario (Opcional)
            </label>
            <select
              value={driverUserId}
              onChange={(e) => handleSelectUser(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            >
              <option value="">-- Sin vincular a usuario --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} (@{u.username} · {u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              placeholder="Ej: Carlos Rivas"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="text"
                placeholder="987654321"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Tipo de Vehículo
              </label>
              <select
                value={driverVehicle}
                onChange={(e) => setDriverVehicle(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                <option value="Moto">Motocicleta</option>
                <option value="Bicicleta">Bicicleta</option>
                <option value="Auto">Auto / Camioneta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Placa / Identificación
            </label>
            <input
              type="text"
              placeholder="Ej: M-4589"
              value={driverPlate}
              onChange={(e) => setDriverPlate(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
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
              {editingDriver ? 'Guardar Cambios' : 'Registrar Motorizado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
