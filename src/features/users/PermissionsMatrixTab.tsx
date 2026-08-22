import React, { useState } from 'react';
import { Lock, Search, RotateCcw, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { RoleType, AppModuleKey } from '../../types';
import { ROLES_INFO, ALL_ROLES, MODULE_DEFINITIONS, CATEGORY_NAMES } from './userConstants';

interface PermissionsMatrixTabProps {
  rolePermissions: Record<string, string[]>;
  onUpdatePermission: (role: RoleType, module: AppModuleKey, enabled: boolean) => void;
  onResetPermissions: () => void;
  initialRoleFilter?: RoleType | 'todos';
}

export const PermissionsMatrixTab: React.FC<PermissionsMatrixTabProps> = ({
  rolePermissions,
  onUpdatePermission,
  onResetPermissions,
  initialRoleFilter = 'todos',
}) => {
  const [permSearch, setPermSearch] = useState('');
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<RoleType | 'todos'>(initialRoleFilter);
  const [showResetPermsModal, setShowResetPermsModal] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header de la Matriz & Controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Matriz Interactiva de Permisos
          </h3>
          <p className="text-xs text-stone-500 font-semibold mt-0.5">
            Activa o desactiva módulos por rol. Los cambios se aplican y guardan en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar módulo..."
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-xs font-bold pl-8 pr-3 py-2 rounded-xl outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedRoleForPerms}
            onChange={(e) => setSelectedRoleForPerms(e.target.value as any)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold px-3 py-2 rounded-xl outline-none cursor-pointer"
          >
            <option value="todos">Ver Todos los Roles</option>
            {ALL_ROLES.map(r => (
              <option key={r} value={r}>Solo {r}</option>
            ))}
          </select>

          <button
            onClick={() => setShowResetPermsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition"
            title="Restaurar matriz de permisos recomendada"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Predeterminados</span>
          </button>
        </div>
      </div>

      {/* Tabla de Matriz */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-900 text-white font-black text-[11px] uppercase tracking-wider">
                <th className="p-4 min-w-[280px]">Módulo / Vista del Sistema</th>
                {ALL_ROLES.filter(r => selectedRoleForPerms === 'todos' || selectedRoleForPerms === r).map(role => {
                  const meta = ROLES_INFO[role];
                  return (
                    <th key={role} className="p-4 text-center min-w-[130px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black border", meta.badgeColor)}>
                          {role}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400">
                          {role === 'Administrador' ? 'Full Access' : `${rolePermissions[role]?.length || 0} activos`}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {Object.entries(CATEGORY_NAMES).map(([catKey, catMeta]) => {
                const catModules = MODULE_DEFINITIONS.filter(m => 
                  m.category === catKey && 
                  (permSearch === '' || m.name.toLowerCase().includes(permSearch.toLowerCase()) || m.desc.toLowerCase().includes(permSearch.toLowerCase()))
                );

                if (catModules.length === 0) return null;

                return (
                  <React.Fragment key={catKey}>
                    {/* Fila separadora de categoría */}
                    <tr className="bg-amber-50/70 border-y border-amber-200/60 font-black text-stone-900">
                      <td 
                        colSpan={1 + ALL_ROLES.filter(r => selectedRoleForPerms === 'todos' || selectedRoleForPerms === r).length}
                        className="p-3 px-4 text-xs font-black text-amber-900 tracking-wide flex items-center gap-2"
                      >
                        <catMeta.icon className="w-4 h-4 text-amber-700" />
                        <span>{catMeta.label}</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md ml-1">
                          {catModules.length} módulos
                        </span>
                      </td>
                    </tr>

                    {/* Módulos de esta categoría */}
                    {catModules.map((mod) => {
                      const ModIcon = mod.icon;

                      return (
                        <tr key={mod.key} className="hover:bg-stone-50/80 transition">
                          <td className="p-3.5 px-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                                <ModIcon className="w-4 h-4 text-stone-600" />
                              </div>
                              <div>
                                <h5 className="font-black text-xs text-stone-900">{mod.name}</h5>
                                <p className="text-[10px] text-stone-500 font-medium leading-snug">{mod.desc}</p>
                              </div>
                            </div>
                          </td>

                          {/* Columna por cada Rol */}
                          {ALL_ROLES.filter(r => selectedRoleForPerms === 'todos' || selectedRoleForPerms === r).map(role => {
                            if (role === 'Owner' || role === 'Administrador') {
                              return (
                                <td key={role} className="p-3.5 text-center">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black",
                                    role === 'Owner' ? "bg-amber-50 text-amber-900 border-amber-300" : "bg-purple-50 text-purple-700 border-purple-200"
                                  )}>
                                    <Check className="w-3 h-3" /> Total
                                  </span>
                                </td>
                              );
                            }

                            const isAllowed = (rolePermissions[role] || []).includes(mod.key);

                            return (
                              <td key={role} className="p-3.5 text-center">
                                <button
                                  onClick={() => onUpdatePermission(role, mod.key, !isAllowed)}
                                  className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition-all shadow-xs cursor-pointer",
                                    isAllowed 
                                      ? "bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-500/20" 
                                      : "bg-stone-100 text-stone-300 hover:bg-stone-200 hover:text-stone-500 border border-stone-200"
                                  )}
                                  title={isAllowed ? `Desactivar ${mod.name} para ${role}` : `Activar ${mod.name} para ${role}`}
                                >
                                  {isAllowed ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CONFIRMACIÓN RESTAURAR PERMISOS */}
      {showResetPermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-stone-900">¿Restaurar permisos?</h3>
                <p className="text-xs text-stone-500">Se restablecerán las configuraciones de acceso por defecto para todos los roles.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetPermsModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onResetPermissions();
                  setShowResetPermsModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-black text-xs hover:bg-amber-600 transition shadow-md"
              >
                Sí, restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
