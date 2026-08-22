import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { User, RoleType } from '../../types';
import { ROLES_INFO, ALL_ROLES, MODULE_DEFINITIONS } from './userConstants';

interface RolesTabProps {
  users: User[];
  rolePermissions: Record<string, string[]>;
  onConfigureRole: (role: RoleType) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({
  users,
  rolePermissions,
  onConfigureRole,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ALL_ROLES.map((role) => {
          const meta = ROLES_INFO[role];
          const RoleIcon = meta.icon;
          const assignedUsers = users.filter(u => u.role === role);
          const isFullAccess = role === 'Owner' || role === 'Administrador';
          const allowedModules = isFullAccess 
            ? MODULE_DEFINITIONS.map(m => m.key) 
            : (rolePermissions[role] || []);

          return (
            <div 
              key={role}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between gap-5 hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5",
                    meta.badgeColor
                  )}>
                    <RoleIcon className="w-4 h-4" />
                    {role}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                    {meta.level}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-stone-900">{meta.label}</h3>
                  <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">{meta.desc}</p>
                </div>

                {/* Módulos habilitados summary */}
                <div className="pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-stone-600">Acceso a Módulos:</span>
                    <span className="text-amber-700 font-black">
                      {isFullAccess ? 'Todos (23/23)' : `${allowedModules.length} de ${MODULE_DEFINITIONS.length}`}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${(allowedModules.length / MODULE_DEFINITIONS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Personal Asignado */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-stone-600">
                  <span>Personal con este rol:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-stone-900 font-black">
                    {assignedUsers.length}
                  </span>
                </div>
                {assignedUsers.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {assignedUsers.map(u => (
                      <span 
                        key={u.id} 
                        className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-lg border",
                          u.active ? "bg-white text-stone-800 border-stone-200" : "bg-stone-200 text-stone-500 line-through"
                        )}
                      >
                        {u.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-400 italic">No hay personal asignado actualmente.</p>
                )}
              </div>

              {/* Botón de acción */}
              <button
                onClick={() => onConfigureRole(role)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-stone-600" />
                <span>Configurar Permisos de {role}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
