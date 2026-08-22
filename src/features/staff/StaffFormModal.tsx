import React, { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { StaffMember } from './staffTypes';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staffData: Omit<StaffMember, 'id'>) => void;
  editingStaff?: StaffMember | null;
  initialData?: StaffMember | null;
}

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStaff,
  initialData,
}) => {
  const currentItem = initialData || editingStaff;
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffMember['role']>('Mozo');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState<StaffMember['shift']>('Completo');
  const [status, setStatus] = useState<'Activo' | 'Inactivo'>('Activo');
  const [salaryDaily, setSalaryDaily] = useState<number>(50);

  useEffect(() => {
    if (currentItem) {
      setName(currentItem.name);
      setRole(currentItem.role);
      setDni(currentItem.dni);
      setPhone(currentItem.phone);
      setShift(currentItem.shift);
      setStatus(currentItem.status);
      setSalaryDaily(currentItem.salaryDaily || 50);
    } else {
      setName('');
      setRole('Mozo');
      setDni('');
      setPhone('');
      setShift('Completo');
      setStatus('Activo');
      setSalaryDaily(50);
    }
  }, [currentItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      role,
      dni: dni.trim(),
      phone: phone.trim(),
      shift,
      status,
      salaryDaily,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <UserPlus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">
                {editingStaff ? 'Editar Personal' : 'Registrar Nuevo Empleado'}
              </h3>
              <p className="text-xs text-stone-500 font-semibold">Datos personales, turno y salario</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              placeholder="Ej: Roberto Gómez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Puesto / Cargo *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                <option value="Mozo">Mozo</option>
                <option value="Cocinero">Cocinero</option>
                <option value="Parrillero">Parrillero</option>
                <option value="Cajero">Cajero</option>
                <option value="Bartender">Bartender</option>
                <option value="Repartidor">Repartidor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Turno Asignado
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                <option value="Mañana">Mañana (08:00 - 16:00)</option>
                <option value="Tarde">Tarde (13:00 - 21:00)</option>
                <option value="Noche">Noche (17:00 - 01:00)</option>
                <option value="Completo">Completo (08:00 - 18:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                DNI / Documento
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="72418902"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-mono font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                placeholder="987123456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Salario Diario (S/)
              </label>
              <input
                type="number"
                step="5"
                value={salaryDaily}
                onChange={(e) => setSalaryDaily(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
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
              {editingStaff ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
