import React, { useState, useMemo } from 'react';
import { Search, X, Users, UserPlus } from 'lucide-react';
import { User } from '../../types';
import { ALL_ROLES } from './userConstants';
import { UserCard } from './UserCard';

interface UsersListTabProps {
  users: User[];
  currentUser: User;
  isOwner?: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onToggleUserActive: (user: User) => void;
  onSetCurrentUser: (user: User) => void;
  onOpenCreate: () => void;
}

export const UsersListTab: React.FC<UsersListTabProps> = ({
  users,
  currentUser,
  isOwner,
  onEditUser,
  onDeleteUser,
  onToggleUserActive,
  onSetCurrentUser,
  onOpenCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const togglePinVisibility = (userId: string) => {
    setShowPins(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchRole = roleFilter === 'todos' || u.role === roleFilter;
      const matchStatus = 
        statusFilter === 'todos' || 
        (statusFilter === 'activos' && u.active) || 
        (statusFilter === 'inactivos' && !u.active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const activeCount = users.filter(u => u.active).length;
  const adminCount = users.filter(u => u.role === 'Administrador').length;

  return (
    <div className="space-y-5">
      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Total Personal</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{users.length}</div>
          <span className="text-[10px] font-bold text-stone-500">Cuentas registradas</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Activos</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
          <span className="text-[10px] font-bold text-emerald-600">Con acceso habilitado</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Inactivos</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{users.length - activeCount}</div>
          <span className="text-[10px] font-bold text-rose-500">Acceso bloqueado</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider block">Administradores</span>
          <div className="text-2xl font-black text-purple-700 mt-1">{adminCount}</div>
          <span className="text-[10px] font-bold text-purple-600">Acceso total al sistema</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los Roles</option>
            {ALL_ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 sm:flex-none bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activos">Solo Activos</option>
            <option value="inactivos">Solo Inactivos</option>
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas de Usuario */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-black text-stone-900 text-base">No se encontraron usuarios</h3>
          <p className="text-xs text-stone-500 mt-1">Prueba cambiando los filtros de búsqueda o registra un nuevo usuario.</p>
          <button
            onClick={onOpenCreate}
            className="mt-4 px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Crear Usuario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelf={user.id === currentUser.id}
              isOwner={isOwner !== undefined ? isOwner : currentUser.role === 'Owner'}
              isPinVisible={!!showPins[user.id]}
              onTogglePin={() => togglePinVisibility(user.id)}
              onToggleActive={() => onToggleUserActive(user)}
              onEdit={() => onEditUser(user)}
              onUseProfile={() => onSetCurrentUser(user)}
              onDelete={() => onDeleteUser(user)}
              canDelete={users.length > 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
