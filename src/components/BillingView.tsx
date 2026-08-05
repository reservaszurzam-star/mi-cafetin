import React from 'react';
import { CreditCard, FileCheck, Split, Receipt, ArrowRight, Wallet, CheckCircle2, QrCode } from 'lucide-react';

export default function BillingView() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-amber-500" />
            Facturación & Cobranza
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Gestión de comprobantes electrónicos, división de cuentas y pasarelas de pago.
          </p>
        </div>
        <button className="h-11 px-5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-stone-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-stone-900/20 dark:shadow-amber-500/20">
          Configurar Facturación Electrónica <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Module 1 */}
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm p-6 lg:p-8 flex flex-col h-full group hover:border-amber-400 dark:hover:border-amber-600 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-6 shadow-inner">
            <FileCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-stone-900 dark:text-white mb-2">Comprobantes Electrónicos</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-medium mb-6 flex-1">
            Integra el sistema con los entes tributarios (ej. SUNAT, SAT) para emitir Boletas y Facturas electrónicas de forma automática al cobrar.
          </p>
          <div className="pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Módulo Activo</span>
            <button className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 transition-colors">Ver Detalles</button>
          </div>
        </div>

        {/* Module 2 */}
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm p-6 lg:p-8 flex flex-col h-full group hover:border-sky-400 dark:hover:border-sky-600 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-500 flex items-center justify-center mb-6 shadow-inner">
            <Split className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-stone-900 dark:text-white mb-2">División de Cuentas (Split)</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-medium mb-6 flex-1">
            Herramienta avanzada para cobrar una mesa separando los platos por persona, o dividiendo el total en montos iguales.
          </p>
          <div className="pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Incluido</span>
            <button className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-500 transition-colors">Tutorial</button>
          </div>
        </div>

        {/* Module 3 */}
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm p-6 lg:p-8 flex flex-col h-full group hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center mb-6 shadow-inner">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-stone-900 dark:text-white mb-2">Pasarelas de Pago</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 font-medium mb-6 flex-1">
            Conecta terminales POS automáticos (ej. Niubiz, Izipay) o billeteras móviles para confirmar los pagos en tiempo real.
          </p>
          <div className="pt-5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-widest">Próximamente</span>
          </div>
        </div>

      </div>
    </div>
  );
}
