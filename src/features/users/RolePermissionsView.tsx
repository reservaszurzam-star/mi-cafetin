import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Lock, Check, X, RotateCcw, Search, 
  Crown, Sparkles, Eye, EyeOff, LayoutGrid, AlertTriangle, 
  CheckCircle2, Cloud, HelpCircle, Layers, ArrowRight,
  Sliders, Shield, Users
} from 'lucide-react';
import { useAppStore } from '../../hooks/StoreContext';
import { RoleType, AppModuleKey } from '../../types';
import { ROLES_INFO, ALL_ROLES, MODULE_DEFINITIONS, CATEGORY_NAMES } from './userConstants';
import { cn } from '../../lib/utils';

export default function RolePermissionsView() {
  const { 
    rolePermissions, 
    updateRolePermission, 
    resetRolePermissions, 
    users, 
    currentUser,
    ownerSimulatedRole,
    setOwnerSimulatedRole
  } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<RoleType>('Administrador');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showResetModal, setShowResetModal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const roleMeta = ROLES_INFO[selectedRole];
  const isOwnerSelected = selectedRole === 'Owner';

  // Obtener permisos activos para el rol seleccionado
  const activePermissions = useMemo(() => {
    if (isOwnerSelected) {
      return MODULE_DEFINITIONS.map(m => m.key);
    }
    return rolePermissions[selectedRole] || [];
  }, [selectedRole, isOwnerSelected, rolePermissions]);

  // Contar usuarios asignados a cada rol
  const roleUserCounts = useMemo(() => {
    const counts: Record<RoleType, number> = {
      Owner: 0,
      Administrador: 0,
      Cajero: 0,
      Mozo: 0,
      Cocinero: 0,
      Repartidor: 0,
    };
    users.forEach(u => {
      if (counts[u.role] !== undefined) {
        counts[u.role]++;
      }
    });
    return counts;
  }, [users]);

  // Manejador de cambio con toast de feedback
  const handleToggle = (moduleKey: AppModuleKey) => {
    if (isOwnerSelected) return; // Owner no es modificable
    const isCurrentlyActive = activePermissions.includes(moduleKey);
    updateRolePermission(selectedRole, moduleKey, !isCurrentlyActive);
    
    // Feedback visual
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  // Activar o desactivar todos los módulos de una categoría para el rol
  const handleToggleCategory = (categoryKey: string, enableAll: boolean) => {
    if (isOwnerSelected) return;
    const catModules = MODULE_DEFINITIONS.filter(m => m.category === categoryKey);
    catModules.forEach(m => {
      const isCurrentlyActive = activePermissions.includes(m.key);
      if (enableAll && !isCurrentlyActive) {
        updateRolePermission(selectedRole, m.key, true);
      } else if (!enableAll && isCurrentlyActive) {
        updateRolePermission(selectedRole, m.key, false);
      }
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  // Activar todos los módulos para el rol
  const handleEnableAllForRole = () => {
    if (isOwnerSelected) return;
    MODULE_DEFINITIONS.forEach(m => {
      if (!activePermissions.includes(m.key)) {
        updateRolePermission(selectedRole, m.key, true);
      }
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  // Desactivar todos los módulos para el rol
  const handleDisableAllForRole = () => {
    if (isOwnerSelected) return;
    activePermissions.forEach(key => {
      updateRolePermission(selectedRole, key, false);
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  // Filtrar módulos por búsqueda y categoría
  const filteredCategories = useMemo(() => {
    return Object.entries(CATEGORY_NAMES).filter(([catKey]) => {
      if (selectedCategory !== 'todos' && selectedCategory !== catKey) return false;
      return true;
    });
  }, [selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* ── HEADER SUPERIOR ── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-stone-950 border border-amber-300 flex items-center gap-1.5 shadow-xs">
              <Crown className="w-3.5 h-3.5" />
              Consola Maestra de Roles · Exclusivo Owner
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              Sincronizado con Supabase Cloud
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            Gobernanza de Roles & Visibilidad de Pestañas
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-500 mt-1">
            Control de privilegios y visibilidad de módulos para colaboradores en <strong>Paradero 104</strong> y <strong>Las Lomas Grill</strong>.
          </p>
        </div>

        {/* Acciones Globales */}
        <div className="flex items-center gap-2 shrink-0">
          {savedToast && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold animate-in fade-in slide-in-from-right duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Guardado en Supabase</span>
            </div>
          )}

          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition active:scale-95 cursor-pointer"
            title="Restablecer todos los roles a sus valores sugeridos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Recomendados</span>
          </button>
        </div>
      </div>

      {/* ── SELECTOR DE ROL INTERACTIVO (TARJETAS GRANDES) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ALL_ROLES.map((role) => {
          const meta = ROLES_INFO[role];
          const isSelected = selectedRole === role;
          const isOwner = role === 'Owner';
          const userCount = roleUserCounts[role] || 0;
          const permCount = isOwner ? MODULE_DEFINITIONS.length : (rolePermissions[role] || []).length;
          const totalModules = MODULE_DEFINITIONS.length;
          const RoleIcon = meta.icon;

          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={cn(
                "p-3.5 rounded-3xl text-left transition-all duration-200 border relative flex flex-col justify-between overflow-hidden cursor-pointer",
                isSelected
                  ? "bg-stone-900 text-white border-stone-900 shadow-lg scale-[1.02] ring-2 ring-amber-500/50"
                  : "bg-white text-stone-800 border-stone-200 hover:border-amber-400/60 hover:bg-stone-50/80 shadow-xs"
              )}
            >
              {/* Top Row: Icon & Status */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className={cn(
                  "w-9 h-9 rounded-2xl flex items-center justify-center border",
                  isSelected ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : `${meta.bgColor} ${meta.textColor} ${meta.borderColor}`
                )}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                {isOwner ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-stone-950 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> ROOT
                  </span>
                ) : (
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full",
                    isSelected ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-600"
                  )}>
                    {permCount}/{totalModules}
                  </span>
                )}
              </div>

              {/* Title & Level */}
              <div>
                <div className={cn("font-black text-sm leading-tight truncate", isSelected ? "text-white" : "text-stone-900")}>
                  {role}
                </div>
                <div className={cn("text-[10px] font-semibold mt-0.5 truncate", isSelected ? "text-stone-400" : "text-stone-500")}>
                  {userCount} {userCount === 1 ? 'usuario' : 'usuarios'}
                </div>
              </div>

              {/* Progress Bar indicator */}
              <div className="w-full bg-stone-200/40 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    isOwner ? "bg-amber-400 w-full" : isSelected ? "bg-amber-400" : "bg-stone-400"
                  )}
                  style={{ width: isOwner ? '100%' : `${(permCount / totalModules) * 100}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── BANNER DEL ROL SELECCIONADO ── */}
      <div className={cn(
        "rounded-3xl p-5 sm:p-6 border shadow-sm transition-all",
        isOwnerSelected 
          ? "bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 text-white border-amber-600/40"
          : "bg-white border-stone-200 text-stone-900"
      )}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Info del rol */}
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 mt-0.5",
              isOwnerSelected 
                ? "bg-amber-500 text-stone-950 border-amber-300"
                : `${roleMeta.bgColor} ${roleMeta.textColor} ${roleMeta.borderColor}`
            )}>
              {React.createElement(roleMeta.icon, { className: "w-6 h-6" })}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={cn("text-xl font-black", isOwnerSelected ? "text-amber-300" : "text-stone-900")}>
                  {roleMeta.label}
                </h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
                  isOwnerSelected ? "bg-amber-400 text-stone-950 border-amber-300" : roleMeta.badgeColor
                )}>
                  {roleMeta.level}
                </span>
              </div>
              <p className={cn("text-xs mt-1 leading-relaxed max-w-3xl font-medium", isOwnerSelected ? "text-stone-300" : "text-stone-600")}>
                {roleMeta.desc}
              </p>
            </div>
          </div>

          {/* Controles de Acción Rápida para este Rol */}
          {!isOwnerSelected ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-100">
              {currentUser.role === 'Owner' && (
                <button
                  onClick={() => setOwnerSimulatedRole(ownerSimulatedRole === selectedRole ? null : selectedRole)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95",
                    ownerSimulatedRole === selectedRole
                      ? "bg-amber-500 text-stone-950 ring-2 ring-amber-400"
                      : "bg-stone-900 hover:bg-black text-amber-400 border border-amber-500/40"
                  )}
                  title="Simula la vista de este rol en toda la aplicación para comprobar que funcione"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{ownerSimulatedRole === selectedRole ? 'Probando rol (Activo)' : 'Probar vista de este rol'}</span>
                </button>
              )}
              <button
                onClick={handleEnableAllForRole}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Activar Todas</span>
              </button>
              <button
                onClick={handleDisableAllForRole}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>Desactivar Todas</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-bold shrink-0">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Privilegio Supremo Inmutable</span>
            </div>
          )}

        </div>
      </div>

      {/* ── CUERPO PRINCIPAL: FILTROS + GRID DE MÓDULOS + SIMULADOR SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── COLUMNA IZQUIERDA: CONFIGURADOR DE PESTAÑAS (8 COLS) ── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Barra de Filtro de Módulos */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Buscador */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar pestaña (ej. KDS, SUNAT, POS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 text-xs font-bold pl-8 pr-3 py-2 rounded-xl outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            {/* Selector de Categoría */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('todos')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer",
                  selectedCategory === 'todos' ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                Todas las secciones
              </button>
              {Object.entries(CATEGORY_NAMES).map(([k, c]) => (
                <button
                  key={k}
                  onClick={() => setSelectedCategory(k)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1",
                    selectedCategory === k ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  {c.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Grupos de Categorías y Módulos */}
          {filteredCategories.map(([catKey, catMeta]) => {
            const CatIcon = catMeta.icon;
            const categoryModules = MODULE_DEFINITIONS.filter(m => {
              if (m.category !== catKey) return false;
              if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                return m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.key.toLowerCase().includes(q);
              }
              return true;
            });

            if (categoryModules.length === 0) return null;

            const totalInCat = categoryModules.length;
            const activeInCat = categoryModules.filter(m => activePermissions.includes(m.key)).length;
            const allActive = totalInCat > 0 && activeInCat === totalInCat;

            return (
              <div key={catKey} className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                
                {/* Cabecera de Categoría */}
                <div className="p-4 sm:px-6 bg-stone-50/80 border-b border-stone-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-stone-900">{catMeta.label}</h3>
                      <p className="text-[11px] font-semibold text-stone-500">
                        {activeInCat} de {totalInCat} pestañas activas para {selectedRole}
                      </p>
                    </div>
                  </div>

                  {!isOwnerSelected && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCategory(catKey, !allActive)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer",
                          allActive 
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        )}
                      >
                        {allActive ? 'Desactivar Sección' : 'Activar Sección'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid de Pestañas / Módulos */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {categoryModules.map((mod) => {
                    const ModIcon = mod.icon;
                    const isAllowed = isOwnerSelected ? true : activePermissions.includes(mod.key);
                    const isStaffExclusive = mod.key === 'staff' && !isOwnerSelected;

                    return (
                      <div
                        key={mod.key}
                        onClick={() => {
                          if (!isOwnerSelected && !isStaffExclusive) {
                            handleToggle(mod.key);
                          }
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-3 select-none",
                          isOwnerSelected
                            ? "bg-amber-50/50 border-amber-200 cursor-default"
                            : isStaffExclusive
                            ? "bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed"
                            : isAllowed
                            ? "bg-emerald-50/60 border-emerald-300/80 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer shadow-xs"
                            : "bg-stone-50/60 border-stone-200 hover:border-stone-300 hover:bg-white cursor-pointer"
                        )}
                      >
                        {/* Info de la Pestaña */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                            isAllowed
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-stone-200 text-stone-500 border-stone-300"
                          )}>
                            <ModIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className={cn("font-black text-xs leading-tight truncate", isAllowed ? "text-stone-900" : "text-stone-600")}>
                                {mod.name}
                              </h4>
                              {isStaffExclusive && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-purple-100 text-purple-800">
                                  Owner Only
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 font-medium leading-tight mt-1 line-clamp-2">
                              {mod.desc}
                            </p>
                            <span className="inline-block font-mono text-[9px] text-stone-400 mt-1">
                              key: {mod.key}
                            </span>
                          </div>
                        </div>

                        {/* Switch Toggle */}
                        <div className="shrink-0 mt-1">
                          {isOwnerSelected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                              <Check className="w-3 h-3 stroke-[3]" /> Activo
                            </span>
                          ) : isStaffExclusive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-200 text-stone-500 text-[9px] font-bold">
                              <Lock className="w-3 h-3" /> Bloqueado
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggle(mod.key);
                              }}
                              className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                isAllowed ? "bg-emerald-500" : "bg-stone-300"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center",
                                  isAllowed ? "translate-x-5" : "translate-x-0"
                                )}
                              >
                                {isAllowed ? (
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                ) : (
                                  <X className="w-3 h-3 text-stone-400" />
                                )}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>

        {/* ── COLUMNA DERECHA: SIMULADOR DE BARRA LATERAL EN VIVO (4 COLS) ── */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          
          <div className="bg-white rounded-3xl border border-stone-200 shadow-md p-5 overflow-hidden">
            
            {/* Header del Simulador */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-stone-900 uppercase tracking-wider">
                    Simulador en Tiempo Real
                  </h3>
                  <p className="text-[10px] font-bold text-stone-500">
                    Así ve el menú un <span className="text-amber-600 underline font-black">{selectedRole}</span>
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-stone-100 text-stone-800 border border-stone-200">
                {activePermissions.length} visibles
              </span>
            </div>

            {/* Marco de Simulación Sidebar */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 max-h-[580px] overflow-y-auto custom-scrollbar space-y-3">
              
              {Object.entries(CATEGORY_NAMES).map(([catKey, catMeta]) => {
                const catModules = MODULE_DEFINITIONS.filter(m => m.category === catKey);
                const visibleInCat = catModules.filter(m => activePermissions.includes(m.key));

                return (
                  <div key={catKey} className="space-y-1">
                    <div className="px-2 pt-1 text-[9px] font-black text-stone-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{catMeta.label.split(' ')[0]}</span>
                      <span>{visibleInCat.length}/{catModules.length}</span>
                    </div>

                    {catModules.map((m) => {
                      const isVisible = activePermissions.includes(m.key);
                      const ModIcon = m.icon;

                      return (
                        <div
                          key={m.key}
                          className={cn(
                            "px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border",
                            isVisible
                              ? "bg-white text-stone-900 border-stone-200/80 shadow-2xs"
                              : "bg-stone-100/60 text-stone-400 border-transparent opacity-40 line-through"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ModIcon className={cn("w-3.5 h-3.5 shrink-0", isVisible ? "text-amber-600" : "text-stone-400")} />
                            <span className="truncate text-[11px]">{m.name}</span>
                          </div>
                          {isVisible ? (
                            <Eye className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-stone-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            </div>

            {/* Footer explicativo */}
            <div className="mt-4 pt-3 border-t border-stone-200 text-[10px] text-stone-500 font-medium leading-relaxed">
              <div className="flex items-center gap-1.5 text-stone-700 font-bold mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>¿Cómo funciona?</span>
              </div>
              Cualquier cambio se guarda automáticamente y oculta de inmediato las pestañas a los colaboradores de este rol cuando inician sesión.
            </div>

          </div>

        </div>

      </div>

      {/* ── MODAL DE RESTAURACIÓN ── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full space-y-4 border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-stone-900">¿Restablecer permisos por defecto?</h3>
                <p className="text-xs text-stone-500 font-medium">
                  Se aplicará la matriz recomendada por el sistema para Administrador, Cajera, Mesera, Cocinero y Repartidor.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1 font-medium">
              <p>• Los cambios se sincronizarán directamente con Supabase.</p>
              <p>• El rol <strong>Owner</strong> mantendrá su acceso total garantizado.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetRolePermissions();
                  setShowResetModal(false);
                  setSavedToast(true);
                  setTimeout(() => setSavedToast(false), 2000);
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-md cursor-pointer active:scale-95"
              >
                Confirmar y Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
