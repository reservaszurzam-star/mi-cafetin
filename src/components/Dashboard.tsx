import React, { useMemo } from "react";
import { useAppStore } from "../hooks/StoreContext";
import { ViewState } from "../App";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, TrendingUp, TrendingDown, Users, DollarSign, Wallet, CalendarDays, Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "../lib/utils";

export default function Dashboard({ onNavigate }: { onNavigate: (v: ViewState) => void; }) {
  const { customers, transactions, expenses, sales, getTotalReceivables, settings } = useAppStore();

  const totalReceivables = getTotalReceivables();
  const now = new Date();
  
  const currentMonthExpenses = expenses
    .filter(e => new Date(e.date) >= startOfMonth(now) && new Date(e.date) <= endOfMonth(now))
    .reduce((sum, e) => sum + e.amount, 0);

  const todaySales = sales
    .filter((s) => new Date(s.date).toDateString() === now.toDateString())
    .reduce((sum, s) => sum + s.total, 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayStr = format(d, "EEE", { locale: es });

      const dailyCharges = transactions
        .filter(t => t.type === "charge" && new Date(t.date).toDateString() === d.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);

      const dailySales = sales
        .filter((s) => new Date(s.date).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.total, 0);

      return { name: dayStr, Ingresos: dailyCharges + dailySales };
    });
  }, [transactions, sales]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            <p className="text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest text-[10px]">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Resumen General
          </h1>
        </div>
        <button 
          onClick={() => onNavigate({ name: "pos" })} 
          className="h-11 px-5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-stone-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-stone-900/20 dark:shadow-amber-500/20 active:scale-95"
        >
          Nueva Venta <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── BENTO GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        
        {/* MAIN CHART (Span 8) */}
        <div className="md:col-span-8 bg-white dark:bg-stone-900 rounded-[2rem] p-6 md:p-8 border border-stone-200/70 dark:border-stone-800 shadow-sm flex flex-col justify-between group hover:border-amber-500/50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
            <div className="space-y-1">
              <span className="flex items-center gap-2 text-stone-500 dark:text-stone-400 font-bold tracking-widest text-[10px] uppercase">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Ingresos de Hoy
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-stone-400">{settings.currency}</span>
                <span className="text-5xl lg:text-6xl font-black text-stone-900 dark:text-white tracking-tighter">
                  {todaySales.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col px-4 py-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Por Cobrar
                </span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-300">
                  {settings.currency} {totalReceivables.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-[220px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" axisLine={false} tickLine={false} 
                  tick={{ fill: "#A8A29E", fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }} dy={10} 
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)", padding: "12px 16px", backgroundColor: "rgba(255, 255, 255, 0.95)", fontWeight: 700 }}
                  itemStyle={{ color: "#f59e0b", fontSize: "16px", fontWeight: 900 }}
                  labelStyle={{ color: "#A8A29E", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
                />
                <Area type="monotone" dataKey="Ingresos" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIDE METRICS (Span 4) */}
        <div className="md:col-span-4 flex flex-col gap-4 md:gap-6">
          <div 
            className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 border border-stone-200/70 dark:border-stone-800 shadow-sm flex-1 flex flex-col justify-center cursor-pointer hover:border-amber-500/50 transition-colors group"
            onClick={() => onNavigate({ name: "expenses" })}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-stone-500 dark:text-stone-400 font-bold tracking-widest text-[10px] uppercase">Gastos del Mes</span>
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-stone-900 dark:text-white tracking-tight flex items-baseline gap-1">
               <span className="text-xl text-stone-400">{settings.currency}</span>
              {currentMonthExpenses.toFixed(2)}
            </div>
          </div>

          <div 
            className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 border border-stone-200/70 dark:border-stone-800 shadow-sm flex-1 flex flex-col justify-center cursor-pointer hover:border-amber-500/50 transition-colors group"
            onClick={() => onNavigate({ name: "customers" })}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-stone-500 dark:text-stone-400 font-bold tracking-widest text-[10px] uppercase">Clientes Activos</span>
              <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
              {customers.length}
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            Actividad Reciente
          </h2>
          <button onClick={() => onNavigate({ name: "customers" })} className="text-[11px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-widest transition-colors">
            Ver Todo
          </button>
        </div>
        
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm overflow-hidden">
          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentTransactions.map((tx) => {
                const customer = customers.find((c) => c.id === tx.customerId);
                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors gap-3"
                    onClick={() => onNavigate({ name: "customer_detail", customerId: tx.customerId })}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm",
                        tx.type === 'charge' ? 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-500'
                      )}>
                        {customer?.name.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 dark:text-white text-sm">
                          {customer?.name || "Cliente"}
                        </p>
                        <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5 flex items-center gap-1.5 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 block"></span>
                          {format(new Date(tx.date), "d MMM, p", { locale: es })} <span className="opacity-50">·</span> {tx.description}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-mono font-black text-base self-start sm:self-center px-3 py-1.5 rounded-lg",
                      tx.type === "charge" ? "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {tx.type === "charge" ? "+" : "-"} {settings.currency} {tx.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 flex flex-col items-center justify-center">
              <DollarSign className="w-10 h-10 mb-3 opacity-20" />
              <span className="text-sm font-medium">No hay transacciones todavía.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
