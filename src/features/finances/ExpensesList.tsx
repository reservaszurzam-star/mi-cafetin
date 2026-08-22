import React, { useState } from "react";
import { useAppStore } from "../../hooks/StoreContext";
import { Plus, Search, Trash2, Wallet, Calendar, X, Receipt, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const EXPENSE_CATEGORIES = [
  "Insumos",
  "Servicios",
  "Planilla",
  "Mantenimiento",
  "Otros",
];

export default function ExpensesList() {
  const { expenses, addExpense, deleteExpense, settings, sales } = useAppStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  const PAYMENT_METHODS: import("../../types").PaymentMethod[] = [
    "Efectivo",
    "Yape",
    "Plin",
    "Tarjeta",
    "Transferencia",
    "Otro",
  ];
  const [paymentMethod, setPaymentMethod] = useState<import("../../types").PaymentMethod>("Efectivo");

  const filteredExpenses = expenses
    .filter(
      (e) =>
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Caja Chica Calculations (Only for today's date context)
  const today = new Date().toISOString().substring(0, 10);
  
  // Total cash sales today
  const cashSalesToday = sales
    .filter(s => s.date.startsWith(today) && s.paymentMethod === 'Efectivo')
    .reduce((sum, s) => sum + s.total, 0);

  // Total cash expenses today
  const cashExpensesToday = expenses
    .filter(e => e.date.startsWith(today) && (e.paymentMethod === 'Efectivo' || !e.paymentMethod))
    .reduce((sum, e) => sum + e.amount, 0);

  const cashInDrawer = cashSalesToday - cashExpensesToday;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (description.trim() && !isNaN(numAmount) && numAmount > 0) {
      addExpense(
        description.trim(),
        numAmount,
        category,
        new Date(date).toISOString(),
        paymentMethod,
      );
      setDescription("");
      setAmount("");
      setCategory(EXPENSE_CATEGORIES[0]);
      setDate(new Date().toISOString().substring(0, 10));
      setPaymentMethod("Efectivo");
      setIsAdding(false);
    }
  };

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-8 h-8 text-emerald-500" />
            Caja Chica & Egresos
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Controla el flujo de efectivo, ventas y pagos diarios.
          </p>
        </div>
        <button onClick={() => setIsAdding(true)} 
          className="h-11 px-5 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-rose-500/30"
        >
          <Plus className="w-5 h-5" /> Registrar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* CAJA CHICA TOTAL */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
          <div>
            <div className="flex items-center space-x-2 mb-2 relative z-10">
              <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2 rounded-xl text-emerald-600 dark:text-emerald-500">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-600 dark:text-stone-400 text-xs uppercase tracking-widest">
                Efectivo en Caja (Hoy)
              </h3>
            </div>
            <p className="text-4xl font-black text-stone-900 dark:text-white tracking-tighter relative z-10 font-mono mt-4">
              {settings.currency} {cashInDrawer.toFixed(2)}
            </p>
          </div>
        </div>

        {/* INGRESOS EFECTIVO */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-sky-500/5 group-hover:bg-sky-500/10 transition-colors pointer-events-none"></div>
          <div>
            <div className="flex items-center space-x-2 mb-2 relative z-10">
              <div className="bg-sky-100 dark:bg-sky-950/50 p-2 rounded-xl text-sky-600 dark:text-sky-500">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-600 dark:text-stone-400 text-xs uppercase tracking-widest">
                Ventas Efectivo (Hoy)
              </h3>
            </div>
            <p className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter relative z-10 font-mono mt-4">
              {settings.currency} {cashSalesToday.toFixed(2)}
            </p>
          </div>
        </div>

        {/* EGRESOS EFECTIVO */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors pointer-events-none"></div>
          <div>
            <div className="flex items-center space-x-2 mb-2 relative z-10">
              <div className="bg-rose-100 dark:bg-rose-950/50 p-2 rounded-xl text-rose-600 dark:text-rose-500">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-stone-600 dark:text-stone-400 text-xs uppercase tracking-widest">
                Gastos Efectivo (Hoy)
              </h3>
            </div>
            <p className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter relative z-10 font-mono mt-4 text-rose-600 dark:text-rose-400">
              - {settings.currency} {cashExpensesToday.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" placeholder="Buscar gastos..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:border-emerald-500 rounded-xl pl-11 pr-4 py-2 text-sm font-bold outline-none transition-all dark:text-white shadow-sm"
          />
        </div>
      </div>

      {/* ── LISTA DE GASTOS ── */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm flex flex-col">
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between">
           <h3 className="font-black text-lg text-stone-900 dark:text-white tracking-tight">Historial de Gastos</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredExpenses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8">
              <Receipt className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg text-stone-500 dark:text-stone-400">No se encontraron gastos.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center shrink-0">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-white text-base">{expense.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(expense.date), "dd MMM, yyyy", { locale: es })}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                          {expense.category}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                          {expense.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="font-mono font-black text-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-3 py-1 rounded-lg">
                      {settings.currency} {expense.amount.toFixed(2)}
                    </span>
                    <button onClick={() => { if (window.confirm("¿Seguro que deseas eliminar este gasto?")) deleteExpense(expense.id); }} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                      title="Eliminar Gasto"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL AÑADIR GASTO ── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddExpense} className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
              <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2"><Plus className="w-5 h-5 text-rose-500" /> Nuevo Gasto</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Descripción *</label>
                <input autoFocus placeholder="Ej. Compra de insumos..." value={description} onChange={e => setDescription(e.target.value)} required
                  className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-stone-900 transition-colors dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Monto ({settings.currency}) *</label>
                  <input type="number" step="0.10" min="0.10" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required
                    className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent dark:border-stone-700 rounded-xl px-4 py-3 font-mono font-black text-lg outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-stone-900 transition-colors dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Fecha</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                    className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-stone-900 transition-colors dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Categoría</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-stone-900 transition-colors dark:text-white"
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Método de Pago</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-stone-900 transition-colors dark:text-white"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2 transition shadow shadow-rose-500/20"><CheckCircle2 className="w-4 h-4" /> Registrar Gasto</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
