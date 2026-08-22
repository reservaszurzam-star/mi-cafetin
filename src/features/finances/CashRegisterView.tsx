import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { Lock, Calculator, CheckCircle, Wallet, CreditCard, Banknote, Receipt, AlertCircle } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CashRegisterView() {
  const { sales, expenses, settings } = useAppStore();
  const [actualCash, setActualCash] = useState('');

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const todaySales = sales.filter(s => new Date(s.date) >= todayStart && new Date(s.date) <= todayEnd);
  const todayExpenses = expenses.filter(e => new Date(e.date) >= todayStart && new Date(e.date) <= todayEnd);

  // Totals
  const cashSales = todaySales.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
  const digitalSales = todaySales.filter(s => s.paymentMethod !== 'Efectivo' && s.paymentMethod !== 'A crédito').reduce((sum, s) => sum + s.total, 0);
  const creditSales = todaySales.filter(s => s.paymentMethod === 'A crédito').reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Expected Cash (Sales in Cash - Expenses)
  const expectedCash = cashSales - totalExpenses;
  
  // Difference
  const declaredCash = parseFloat(actualCash) || 0;
  const difference = declaredCash - expectedCash;
  const isBalanced = Math.abs(difference) <= 0.5; // allowing a small margin of error of 50 cents

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-3">
            <Lock className="w-8 h-8 text-amber-500" />
            Cierre de Caja
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Arqueo físico y conciliación del día {format(now, "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── RESUMEN DE MOVIMIENTOS ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm p-6 lg:p-8">
            <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight mb-6">Resumen del Turno</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 mb-2">
                  <Banknote className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ingresos Efectivo</span>
                </div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {settings.currency} {cashSales.toFixed(2)}
                </div>
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/30 rounded-2xl p-5 border border-sky-100 dark:border-sky-900/50">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-500 mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ingresos Digitales</span>
                </div>
                <div className="text-3xl font-black text-sky-700 dark:text-sky-400 font-mono">
                  {settings.currency} {digitalSales.toFixed(2)}
                </div>
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/50">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 mb-2">
                  <Receipt className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Egresos / Gastos</span>
                </div>
                <div className="text-3xl font-black text-rose-700 dark:text-rose-400 font-mono">
                  {settings.currency} {totalExpenses.toFixed(2)}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/50">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ventas a Crédito (Fiado)</span>
                </div>
                <div className="text-3xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  {settings.currency} {creditSales.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 dark:bg-white rounded-2xl p-6 shadow-xl">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 text-[10px] font-bold uppercase tracking-widest block mb-1">
                    Efectivo Esperado en Caja
                  </span>
                  <p className="text-stone-400 dark:text-stone-500 text-xs">
                    (Ventas Efectivo - Gastos Efectivo)
                  </p>
                </div>
                <div className="text-4xl lg:text-5xl font-black text-white dark:text-stone-900 font-mono tracking-tighter">
                  {settings.currency} {expectedCash.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ARQUEO FÍSICO ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm p-6 lg:p-8 flex flex-col h-full">
            <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              Arqueo
            </h2>

            <div className="flex-1">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                ¿Cuánto dinero en efectivo hay físicamente?
              </label>
              <div className="relative mb-8">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-stone-400">
                  {settings.currency}
                </span>
                <input 
                  type="number"
                  placeholder="0.00"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full h-16 pl-14 pr-4 rounded-xl border-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-3xl font-black font-mono text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600"
                />
              </div>

              {actualCash !== '' && (
                <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                  isBalanced 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400' 
                    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/30 dark:border-rose-800/50 dark:text-rose-400'
                }`}>
                  {isBalanced ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <div>
                    <h4 className="font-bold text-sm">
                      {isBalanced ? 'Caja Cuadrada' : 'Diferencia en Caja'}
                    </h4>
                    <p className="text-xs font-medium mt-1 opacity-80">
                      {isBalanced 
                        ? 'El monto físico coincide con el sistema. Todo está en orden.'
                        : `Hay un ${difference > 0 ? 'sobrante' : 'faltante'} de ${settings.currency} ${Math.abs(difference).toFixed(2)}. Verifica si olvidaste registrar algún gasto o venta.`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              disabled={actualCash === ''}
              className="w-full h-14 mt-8 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Cerrar Turno
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
