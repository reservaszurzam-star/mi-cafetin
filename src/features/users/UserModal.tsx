import React, { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { User, RoleType } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: {
    name: string;
    username: string;
    pin: string;
    role: RoleType;
    phone: string;
    email: string;
    active: boolean;
  }) => void;
  initialUser?: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialUser,
}) => {
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPin, setUserPin] = useState('1234');
  const [userRole, setUserRole] = useState<RoleType>('Mozo');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userActive, setUserActive] = useState(true);

  useEffect(() => {
    if (initialUser) {
      setUserName(initialUser.name);
      setUserUsername(initialUser.username);
      setUserPin(initialUser.pin || '1234');
      setUserRole(initialUser.role);
      setUserPhone(initialUser.phone || '');
      setUserEmail(initialUser.email || '');
      setUserActive(initialUser.active);
    } else {
      setUserName('');
      setUserUsername('');
      setUserPin('1234');
      setUserRole('Mozo');
      setUserPhone('');
      setUserEmail('');
      setUserActive(true);
    }
  }, [initialUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const finalUsername = userUsername.trim() || userName.toLowerCase().replace(/\s+/g, '');
    const finalEmail = userEmail.trim() || `${finalUsername}@stc.com`;

    onSave({
      name: userName.trim(),
      username: finalUsername,
      pin: userPin.trim() || '1234',
      role: userRole,
      phone: userPhone.trim(),
      email: finalEmail,
      active: userActive,
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
                {initialUser ? "Editar Usuario" : "Registrar Nuevo Personal"}
              </h3>
              <p className="text-xs text-stone-500 font-semibold">Configura sus accesos y PIN de seguridad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
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
              placeholder="Ej: Marcos Quispe Huamán"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              autoFocus
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                placeholder="Ej: marcos1"
                value={userUsername}
                onChange={(e) => setUserUsername(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                PIN (4 dígitos) *
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={userPin}
                onChange={(e) => setUserPin(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-black font-mono text-stone-900 outline-none focus:border-amber-500 focus:bg-white text-center tracking-widest"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Rol / Perfil de Cargo *
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as RoleType)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
            >
              <option value="Owner">Owner / Dueño Supremo (Acceso Total Multi-Sede)</option>
              <option value="Administrador">Administrador General (Acceso Total)</option>
              <option value="Cajero">Cajero / Facturación SUNAT</option>
              <option value="Mozo">Mozo / Salón & Comandas</option>
              <option value="Cocinero">Chef / Cocina & Monitor KDS</option>
              <option value="Repartidor">Repartidor / Motorizado Delivery</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Teléfono / Celular
              </label>
              <input
                type="text"
                placeholder="987654321"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="usuario@stc.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Toggle Activo */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-stone-50 p-2.5 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                checked={userActive}
                onChange={(e) => setUserActive(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <div className="text-xs">
                <span className="font-black text-stone-900 block">Usuario Habilitado</span>
                <span className="text-[10px] text-stone-500 font-semibold">Permitir iniciar sesión y operar comandas</span>
              </div>
            </label>
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
              {initialUser ? "Guardar Cambios" : "Crear Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
