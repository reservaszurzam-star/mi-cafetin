import React from 'react';
import { useAppStore } from '../hooks/StoreContext';
import { Printer, Wifi, CheckCircle2, ServerCrash, RefreshCw } from 'lucide-react';

export default function PrintersView() {
  const { printers } = useAppStore();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-3">
            <Printer className="w-8 h-8 text-amber-500" />
            Estado de Impresoras
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Monitor de conectividad de los equipos de impresión en cocina y barra.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {printers.map(printer => {
          // Mock connection status
          const isConnected = true; 

          return (
            <div key={printer.id} className="bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 p-6 lg:p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
              {/* Status indicator glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -z-10 opacity-20 transition-all group-hover:opacity-40 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isConnected ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'}`}>
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-stone-900 dark:text-white">{printer.name}</h3>
                    <p className="text-xs font-mono text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded inline-block mt-1">
                      {printer.ip || '192.168.1.100'} : {printer.port || '9100'}
                    </p>
                  </div>
                </div>
                
                {isConnected ? (
                  <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-inner">
                    <CheckCircle2 className="w-3.5 h-3.5" /> En Línea
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-inner">
                    <ServerCrash className="w-3.5 h-3.5" /> Fuera de Línea
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Estación Asignada</h4>
                  <span className="font-bold text-sm text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 px-3 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
                    {printer.station}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Categorías Ruteadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {printer.categories.map(cat => (
                      <span key={cat} className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200/50 dark:border-stone-700">
                        {cat}
                      </span>
                    ))}
                    {printer.categories.length === 0 && (
                      <span className="text-xs font-medium italic text-stone-400">Sin categorías asignadas.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                <button className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/10 dark:hover:bg-amber-900/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
                  <Wifi className="w-4 h-4" /> Probar Conexión
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800 p-6 rounded-2xl flex items-start gap-4">
        <div className="text-amber-500 mt-1">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-amber-800 dark:text-amber-200 text-sm">¿Deseas configurar las reglas de impresión?</h3>
          <p className="text-sm text-amber-700/80 dark:text-amber-300/80 mt-1">
            El ruteo de categorías (qué platos salen en qué impresora) se configura ahora desde <strong>Configuración {'>'} Restaurante</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
