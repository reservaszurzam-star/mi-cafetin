import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { Users, UserPlus, Shield, Lock } from 'lucide-react';
import { cn } from "../../lib/utils";
import { User, RoleType, AppModuleKey } from "../../types";
import { ALL_ROLES } from "./userConstants";
import { UsersListTab } from "./UsersListTab";
import { RolesTab } from "./RolesTab";
import { PermissionsMatrixTab } from "./PermissionsMatrixTab";
import RolePermissionsView from "./RolePermissionsView";
import { UserModal } from "./UserModal";

export default function UsersView() {
  const { 
    users, addUser, updateUser, deleteUser, 
    currentUser, setCurrentUser,
    rolePermissions, updateRolePermission, resetRolePermissions,
    ownerSimulatedRole,
  } = useAppStore();

  const effectiveRole = ownerSimulatedRole || currentUser.role;
  const isOwner = effectiveRole === 'Owner';

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<RoleType | 'todos'>('todos');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSaveUser = (userData: {
    name: string;
    username: string;
    pin: string;
    role: RoleType;
    phone: string;
    email: string;
    active: boolean;
  }) => {
    if (editingUser) {
      updateUser(editingUser.id, userData);
      if (currentUser.id === editingUser.id) {
        setCurrentUser({ ...currentUser, ...userData });
      }
    } else {
      addUser(userData);
    }
    setShowModal(false);
  };

  const handleToggleUserActive = (user: User) => {
    if (user.id === currentUser.id) {
      alert('No puedes desactivar tu propio usuario activo.');
      return;
    }
    updateUser(user.id, { active: !user.active });
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('No puedes eliminar el usuario de la sesión actual.');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el usuario "${user.name}"?`)) {
      deleteUser(user.id);
    }
  };

  const handleConfigureRole = (role: RoleType) => {
    setSelectedRoleForPerms(role);
    setActiveTab('permissions');
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER SUPERIOR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Seguridad & Accesos
            </span>
            <span className="text-xs text-stone-400 font-bold">· Módulo de Administración</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-amber-500" />
            Gestión de Roles, Permisos & Usuarios
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-0.5">
            Control de credenciales, códigos PIN y matriz de accesos por perfil de trabajo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Pestañas */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5",
                activeTab === 'users' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuarios ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5",
                activeTab === 'roles' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Roles ({ALL_ROLES.length})</span>
            </button>
            <button
              onClick={() => {
                setSelectedRoleForPerms('todos');
                setActiveTab('permissions');
              }}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5",
                activeTab === 'permissions' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Matriz de Permisos</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> 
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* ── BANNER DE SESIÓN ACTIVA & CAMBIO RÁPIDO ── */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-3xl p-5 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 border border-stone-700">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300/40 shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                Sesión Activa
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h3 className="font-black text-xl leading-tight text-stone-100 mt-1">{currentUser.name}</h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 mt-0.5">
              <span>@{currentUser.username}</span>
              <span>·</span>
              <span className="text-amber-300 font-bold">{effectiveRole}</span>
              <span>·</span>
              <span>PIN: ****</span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-stone-800/80 border border-stone-700 px-3 py-2 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs font-bold text-stone-400">Cambiar perfil a:</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const target = users.find(u => u.id === e.target.value);
                  if (target) setCurrentUser(target);
                }}
                className="bg-stone-900 text-amber-300 border border-stone-700 text-xs font-black px-3 py-1.5 rounded-xl outline-none cursor-pointer hover:border-amber-500 transition"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-stone-900 text-white">
                    {u.name} ({u.role}) {!u.active ? '· [Inactivo]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── CONTENIDO POR PESTAÑA ── */}
      {activeTab === 'users' && (
        <UsersListTab
          users={users}
          currentUser={currentUser}
          isOwner={isOwner}
          onEditUser={handleOpenEdit}
          onDeleteUser={handleDeleteUser}
          onToggleUserActive={handleToggleUserActive}
          onSetCurrentUser={setCurrentUser}
          onOpenCreate={handleOpenCreate}
        />
      )}

      {activeTab === 'roles' && (
        <RolesTab
          users={users}
          rolePermissions={rolePermissions}
          onConfigureRole={handleConfigureRole}
        />
      )}

      {activeTab === 'permissions' && (
        <RolePermissionsView />
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveUser}
        initialUser={editingUser}
      />

    </div>
  );
}
