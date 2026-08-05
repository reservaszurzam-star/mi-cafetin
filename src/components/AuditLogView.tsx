import React, { useState } from 'react';
import { ShieldAlert, KeyRound, AlertTriangle, FileText, Search, User, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function AuditLogView() {
  const [search, setSearch] = useState("");

  const mockLogs = [
    { id: 1, type: 'alert', title: 'Anulación de Comanda #1042', desc: 'Motivo: Error de digitación por parte del mesero.', user: 'Cajero Principal', time: 'Hace 15 min', icon: AlertTriangle, color: 'rose' },
    { id: 2, type: 'auth', title: 'Apertura manual de cajón de dinero', desc: 'Se detectó apertura sin transacción asociada.', user: 'Cajero Secundario', time: 'Hace 1 hora', icon: KeyRound, color: 'amber' },
    { id: 3, type: 'system', title: 'Cambio en precios de menú', desc: 'Actualización en categoría "Pollos a la Brasa".', user: 'Administrador', time: 'Hace 3 horas', icon: FileText, color: 'sky' },
    { id: 4, type: 'alert', title: 'Descuento aplicado al 100%', desc: 'Cortesía aplicada a pedido #1030 (S/ 45.00).', user: 'Administrador', time: 'Ayer, 18:45', icon: ShieldAlert, color: 'rose' },
    { id: 5, type: 'auth', title: 'Inicio de Sesión', desc: 'Nuevo inicio de sesión desde dispositivo desconocido.', user: 'Cajero Principal', time: 'Ayer, 14:00', icon: User, color: 'emerald' },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Log de Auditoría
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Registro inmutable de eventos críticos, anulaciones y accesos de seguridad.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm p-4 mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text" placeholder="Buscar por usuario, evento o folio..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-rose-500 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold outline-none transition-all dark:text-white"
          />
        </div>
        <button className="h-11 px-5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl font-bold text-sm transition-colors">
          Filtros Avanzados
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm flex flex-col">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between">
           <h3 className="font-black text-lg text-stone-900 dark:text-white tracking-tight">Últimos Eventos Detectados</h3>
           <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-lg">
             <CheckCircle2 className="w-3.5 h-3.5" /> Monitoreo Activo
           </span>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-stone-100 dark:divide-stone-800/50 relative">
            
            {/* Timeline line */}
            <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-stone-100 dark:bg-stone-800/80 z-0 hidden sm:block"></div>

            {mockLogs.map((log) => {
              const Icon = log.icon;
              return (
                <div key={log.id} className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group relative z-10">
                  
                  <div className="hidden sm:flex flex-col items-center gap-2 shrink-0 w-16">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-stone-900 shadow-sm
                      ${log.color === 'rose' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' : ''}
                      ${log.color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : ''}
                      ${log.color === 'sky' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400' : ''}
                      ${log.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : ''}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-stone-900 dark:text-white text-base leading-tight">{log.title}</h4>
                      <span className="text-[10px] font-mono font-bold text-stone-400 flex items-center gap-1 shrink-0 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> {log.time}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">{log.desc}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 flex items-center gap-1">
                        <User className="w-3 h-3" /> {log.user}
                      </span>
                      <button className="text-[10px] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 uppercase tracking-widest transition-colors flex items-center gap-1 ml-2">
                        Ver Detalles <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
