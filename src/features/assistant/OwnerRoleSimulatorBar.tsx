import React, { useState } from 'react';
import { 
  Crown, ShieldCheck, Banknote, UserCheck, ChefHat, 
  Bike, RotateCcw, ChevronDown, ChevronUp, Eye, Sparkles,
  Sliders, X, Check
} from 'lucide-react';
import { useAppStore } from '../../hooks/StoreContext';
import { RoleType } from '../../types';
import { cn } from '../../lib/utils';

export default function OwnerRoleSimulatorBar() {
  const { 
    currentUser, 
    ownerSimulatedRole, 
    setOwnerSimulatedRole, 
    rolePermissions 
  } = useAppStore();

  const [isExpanded, setIsExpanded] = useState(true);

  // Solo se muestra si el usuario logueado en Supabase es el Owner real
  if (currentUser.role !== 'Owner') {
    return null;
  }

  const simulatedRoles: { role: RoleType | null; label: string; icon: React.ElementType; color: string }[] = [
    { role: null, label: 'Owner (Modo Real)', icon: Crown, color: 'text-amber-400 bg-amber-500/20 border-amber-400/40' },
    { role: 'Administrador', label: 'Administrador', icon: ShieldCheck, color: 'text-purple-400 bg-purple-500/20 border-purple-400/40' },
    { role: 'Cajero', label: 'Cajera', icon: Banknote, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-400/40' },
    { role: 'Mozo', label: 'Mesera', icon: UserCheck, color: 'text-amber-400 bg-amber-500/20 border-amber-400/40' },
    { role: 'Cocinero', label: 'Chef / Cocinero', icon: ChefHat, color: 'text-orange-400 bg-orange-500/20 border-orange-400/40' },
    { role: 'Repartidor', label: 'Motorizado', icon: Bike, color: 'text-blue-400 bg-blue-500/20 border-blue-400/40' },
  ];

  const currentActiveRole = ownerSimulatedRole || 'Owner';
  const activeCount = ownerSimulatedRole ? (rolePermissions[ownerSimulatedRole] || []).length : 23;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-lg w-full px-2 sm:px-0">
      
      {/* ── CARD PRINCIPAL FLOTANTE ── */}
      <div className="bg-stone-900/95 backdrop-blur-md text-white rounded-3xl border-2 border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Cabecera / Barra de Estado */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-3 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 flex items-center justify-between cursor-pointer border-b border-stone-800"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <Crown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Consola de Prueba de Roles
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <div className="font-black text-xs text-stone-100 flex items-center gap-1.5 truncate">
                <span>Viendo como:</span>
                <span className="text-amber-300 font-black underline">{currentActiveRole}</span>
                <span className="text-[10px] text-stone-400 font-bold">({activeCount} pestañas)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {ownerSimulatedRole && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOwnerSimulatedRole(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-black transition flex items-center gap-1 shadow-xs cursor-pointer"
                title="Volver al modo Owner con acceso total"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar</span>
              </button>
            )}
            <button className="p-1 text-stone-400 hover:text-white rounded-lg">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Cuerpo Expandible: Selector de Roles para el Owner */}
        {isExpanded && (
          <div className="p-3 sm:p-4 space-y-3">
            <p className="text-[11px] text-stone-400 font-medium leading-tight">
              Selecciona un rol para simular su experiencia exacta y comprobar que sus pestañas asignadas se muestren correctamente:
            </p>

            {/* Grid de Botones de Roles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {simulatedRoles.map((item) => {
                const isSelected = item.role === ownerSimulatedRole;
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    onClick={() => setOwnerSimulatedRole(item.role)}
                    className={cn(
                      "p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 cursor-pointer select-none",
                      isSelected
                        ? "bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-[1.02]"
                        : "bg-stone-800/80 hover:bg-stone-800 text-stone-200 border-stone-700 hover:border-stone-600"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border",
                      isSelected ? "bg-stone-950 text-amber-400 border-stone-900" : item.color
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate leading-tight">{item.label}</div>
                      <div className={cn(
                        "text-[9px] font-bold truncate mt-0.5",
                        isSelected ? "text-stone-900" : "text-stone-400"
                      )}>
                        {item.role === null ? 'Acceso 100%' : `${rolePermissions[item.role]?.length || 0} módulos`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Banner de Aviso en Simulación */}
            {ownerSimulatedRole && (
              <div className="p-2.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold">
                    El menú lateral y las vistas se han filtrado como <strong>{ownerSimulatedRole}</strong>.
                  </span>
                </div>
                <button
                  onClick={() => setOwnerSimulatedRole(null)}
                  className="text-amber-400 hover:text-white underline text-[10px] font-black ml-2 cursor-pointer whitespace-nowrap"
                >
                  Salir
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
