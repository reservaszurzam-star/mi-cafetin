import React, { useState } from 'react';
import { RefreshCw, Check, Cloud, Wifi } from 'lucide-react';
import { useAppStore } from '../hooks/StoreContext';

interface UniversalSyncButtonProps {
  variant?: 'compact' | 'full' | 'floating';
  className?: string;
}

export const UniversalSyncButton: React.FC<UniversalSyncButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { syncWithSupabase, isManualSyncing, isLoadingFromDB } = useAppStore();
  const [showToast, setShowToast] = useState(false);

  const isBusy = isManualSyncing || isLoadingFromDB;

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBusy) return;
    try {
      await syncWithSupabase();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      console.error("Error sincronizando:", err);
    }
  };

  if (variant === 'floating') {
    return (
      <>
        <div className={`fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 ${className}`}>
          <button
            type="button"
            onClick={handleSync}
            disabled={isBusy}
            title="Sincronizar datos con Supabase ahora (Celular ↔ Web)"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-900/90 hover:bg-stone-900 text-white rounded-2xl shadow-xl border border-stone-700/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center">
              <RefreshCw className={`w-4 h-4 text-amber-400 transition-transform ${isBusy ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
              {!isBusy && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div className="text-left leading-none hidden sm:block">
              <span className="text-[11px] font-black block">
                {isBusy ? 'Sincronizando...' : 'Sincronizar'}
              </span>
              <span className="text-[9px] text-amber-400/90 font-bold block">
                Supabase En Vivo
              </span>
            </div>
          </button>
        </div>

        {/* Toast Notificación */}
        {showToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-xs">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">¡Datos sincronizados al momento con Supabase!</span>
          </div>
        )}
      </>
    );
  }

  if (variant === 'full') {
    return (
      <>
        <button
          type="button"
          onClick={handleSync}
          disabled={isBusy}
          title="Actualizar todos los datos con Supabase"
          className={`w-full p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-stone-900 border border-amber-500/30 flex items-center justify-between transition active:scale-98 cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
              <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <span>{isBusy ? 'Sincronizando...' : 'Sincronizar Supabase'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </div>
              <div className="text-[10px] text-stone-500 font-bold truncate">
                Actualizar cambios Móvil ↔ Web
              </div>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/80 px-2 py-1 rounded-lg border border-amber-200 text-amber-900">
            Live
          </span>
        </button>

        {showToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-xs">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">¡Datos sincronizados con Supabase!</span>
          </div>
        )}
      </>
    );
  }

  // Variant Compact (para Navbar Mobile y Header)
  return (
    <>
      <button
        type="button"
        onClick={handleSync}
        disabled={isBusy}
        title="Sincronizar datos con Supabase (Celular ↔ Web)"
        className={`px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold rounded-xl border border-emerald-300 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-2xs ${className}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isBusy ? 'animate-spin' : ''}`} />
        <span className="hidden xs:inline sm:inline">
          {isBusy ? 'Sincronizando...' : 'Sincronizar'}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      </button>

      {showToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center font-bold text-xs">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold">¡Datos actualizados al momento!</span>
        </div>
      )}
    </>
  );
};
