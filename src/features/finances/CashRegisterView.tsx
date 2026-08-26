import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  Lock, Calculator, CheckCircle2, Wallet, CreditCard, 
  Banknote, Receipt, AlertCircle, Printer, Plus, 
  Trash2, Clock, User, ArrowRight, Eye, RefreshCw,
  ShoppingBag, Check, FileText
} from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ThermalTicket, TicketType } from '../tickets/ThermalTicket';
import { formatMoney } from '../../lib/formatters';
import { RestaurantOrder, PaymentMethod } from '../../types';

export default function CashRegisterView() {
  const { sales, expenses, settings, orders, addExpense, deleteExpense, currentUser } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'arqueo' | 'abiertas' | 'ventas' | 'gastos'>('arqueo');
  const [initialCash, setInitialCash] = useState<string>('100.00'); // Fondo inicial de caja (sencillo)
  const [actualCash, setActualCash] = useState<string>('');
  
  // Modal de Cierre de Caja
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [shiftClosedSuccessfully, setShiftClosedSuccessfully] = useState(false);
  const [selectedSaleToPrint, setSelectedSaleToPrint] = useState<any | null>(null);

  // Modal para agregar gasto rápido
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Insumos' | 'Servicios' | 'Personal' | 'Otros'>('Insumos');

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const todaySales = sales.filter(s => new Date(s.date) >= todayStart && new Date(s.date) <= todayEnd);
  const todayExpenses = expenses.filter(e => new Date(e.date) >= todayStart && new Date(e.date) <= todayEnd);

  // Totales de Ventas
  const cashSales = todaySales.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
  const yapeSales = todaySales.filter(s => s.paymentMethod === 'Yape' || s.paymentMethod === 'Plin').reduce((sum, s) => sum + s.total, 0);
  const cardSales = todaySales.filter(s => s.paymentMethod === 'Tarjeta' || s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + s.total, 0);
  const digitalSales = yapeSales + cardSales;
  const creditSales = todaySales.filter(s => s.paymentMethod === 'A crédito').reduce((sum, s) => sum + s.total, 0);
  const totalBilled = todaySales.reduce((sum, s) => sum + s.total, 0);

  // Gastos
  const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Cuentas Abiertas en Curso
  const activeOrdersTotal = orders.reduce((sum, o) => sum + o.total, 0);

  // Fondo Inicial y Efectivo Esperado
  const baseCash = parseFloat(initialCash) || 0;
  const expectedCash = baseCash + cashSales - totalExpenses;
  
  // Arqueo Físico
  const declaredCash = parseFloat(actualCash) || 0;
  const difference = declaredCash - expectedCash;
  const isBalanced = actualCash !== '' && Math.abs(difference) <= 0.5;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseDesc.trim() || isNaN(amt) || amt <= 0) return;

    addExpense({
      id: `exp-${Date.now()}`,
      description: expenseDesc.trim(),
      amount: amt,
      category: expenseCategory,
      date: new Date().toISOString(),
    });

    setExpenseDesc('');
    setExpenseAmount('');
    setShowAddExpenseModal(false);
  };

  const handleConfirmCloseShift = () => {
    setShiftClosedSuccessfully(true);
    setShowCloseModal(false);
    setShowPrintModal(true);
  };

  const dummyOrderForReport: RestaurantOrder = {
    id: `cierre-${Date.now()}`,
    tableNumber: 'CAJA',
    floor: 1,
    type: 'salón',
    status: 'delivered',
    items: [],
    total: totalBilled,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const salesReportData = {
    date: format(now, 'dd/MM/yyyy'),
    time: format(now, 'hh:mm a'),
    orders: todaySales.map(s => ({
      id: s.id,
      table: s.tableNumber || 'Mesa',
      waiter: s.waiterName || 'Caja',
      guests: 1,
      total: s.total,
    })),
    totalSales: totalBilled,
    totalOrders: todaySales.length,
    totalGuests: todaySales.length,
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <Lock className="w-8 h-8 text-amber-500" />
            Cierre de Caja & Control de Cuentas
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1 font-semibold">
            Conciliación diaria, cuentas abiertas y arqueo físico del {format(now, "EEEE, d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-stone-900/10 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir Reporte Z</span>
          </button>
        </div>
      </div>

      {/* ── SELECTOR DE PESTAÑAS ── */}
      <div className="flex items-center bg-stone-100 p-1.5 rounded-2xl gap-1.5 border border-stone-200 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('arqueo')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'arqueo'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-500" />
          <span>Arqueo & Cierre</span>
        </button>

        <button
          onClick={() => setActiveTab('abiertas')}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition relative cursor-pointer ${
            activeTab === 'abiertas'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Cuentas Abiertas ({orders.length})</span>
          {orders.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('ventas')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'ventas'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-500" />
          <span>Ventas Cobradas ({todaySales.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gastos')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'gastos'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Wallet className="w-4 h-4 text-rose-500" />
          <span>Gastos ({todayExpenses.length})</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════
          PESTAÑA 1: ARQUEO FÍSICO Y CONCILIACIÓN
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'arqueo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Tarjetas de Resumen Financiero */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <h2 className="text-base font-black text-stone-900">Resumen de Movimientos del Día</h2>
                <span className="text-xs font-bold text-stone-500 font-mono">
                  Total Facturado: <strong className="text-stone-900">{formatMoney(totalBilled, settings.currency)}</strong>
                </span>
              </div>

              {/* Fondo Inicial de Caja */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-black text-stone-700">Fondo Inicial de Caja (Base Sencillo)</label>
                  <p className="text-[10px] text-stone-500 font-semibold">Dinero con el que se abrió la caja en la mañana</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 shadow-2xs">
                  <span className="text-xs font-bold text-stone-400">{settings.currency}</span>
                  <input
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    className="w-20 text-right text-sm font-black font-mono outline-none text-stone-900"
                  />
                </div>
              </div>

              {/* Grid de Medios de Pago */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/60">
                  <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-black uppercase mb-1">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Efectivo</span>
                  </div>
                  <p className="text-xl font-black font-mono text-emerald-800">
                    {formatMoney(cashSales, settings.currency)}
                  </p>
                </div>

                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/60">
                  <div className="flex items-center gap-1.5 text-purple-700 text-[10px] font-black uppercase mb-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Yape / Plin</span>
                  </div>
                  <p className="text-xl font-black font-mono text-purple-800">
                    {formatMoney(yapeSales, settings.currency)}
                  </p>
                </div>

                <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200/60">
                  <div className="flex items-center gap-1.5 text-sky-700 text-[10px] font-black uppercase mb-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Tarjetas</span>
                  </div>
                  <p className="text-xl font-black font-mono text-sky-800">
                    {formatMoney(cardSales, settings.currency)}
                  </p>
                </div>

                <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/60">
                  <div className="flex items-center gap-1.5 text-rose-700 text-[10px] font-black uppercase mb-1">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Gastos / Salidas</span>
                  </div>
                  <p className="text-xl font-black font-mono text-rose-800">
                    - {formatMoney(totalExpenses, settings.currency)}
                  </p>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/60">
                  <div className="flex items-center gap-1.5 text-amber-700 text-[10px] font-black uppercase mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>En Mesas (Abiertas)</span>
                  </div>
                  <p className="text-xl font-black font-mono text-amber-800">
                    {formatMoney(activeOrdersTotal, settings.currency)}
                  </p>
                </div>

                <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200">
                  <div className="flex items-center gap-1.5 text-stone-700 text-[10px] font-black uppercase mb-1">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>A Crédito (Fiado)</span>
                  </div>
                  <p className="text-xl font-black font-mono text-stone-800">
                    {formatMoney(creditSales, settings.currency)}
                  </p>
                </div>
              </div>

              {/* Total Efectivo Esperado */}
              <div className="bg-stone-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div>
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    Efectivo Esperado en Gaveta
                  </p>
                  <p className="text-xs text-stone-400">
                    (Base: {formatMoney(baseCash, settings.currency)} + Efectivo: {formatMoney(cashSales, settings.currency)} - Gastos: {formatMoney(totalExpenses, settings.currency)})
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300">
                  {formatMoney(expectedCash, settings.currency)}
                </div>
              </div>

            </div>
          </div>

          {/* Arqueo Físico (Calculadora) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
              
              <div>
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900">Arqueo Físico</h2>
                    <p className="text-[11px] text-stone-500 font-semibold">Cuenta los billetes y monedas en la gaveta</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wider">
                    ¿Cuánto efectivo hay físicamente?
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-stone-400 font-mono">
                      {settings.currency}
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className="w-full h-16 pl-14 pr-4 rounded-2xl border-2 border-stone-200 focus:border-amber-500 bg-stone-50 focus:bg-white text-3xl font-black font-mono text-stone-900 outline-none transition shadow-inner"
                    />
                  </div>

                  {actualCash !== '' && (
                    <div className={`p-4 rounded-2xl border flex items-start gap-3 transition animate-in zoom-in-95 ${
                      isBalanced
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : difference < 0
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      {isBalanced ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-600" />
                      )}
                      <div>
                        <h4 className="font-black text-sm">
                          {isBalanced ? '✅ ¡Caja Cuadrada Perfecta!' : difference < 0 ? '❌ Faltante en Caja' : '⚠️ Sobrante en Caja'}
                        </h4>
                        <p className="text-xs font-semibold mt-1 opacity-90">
                          {isBalanced
                            ? 'El dinero físico coincide exactamente con el total del sistema.'
                            : `Hay una diferencia de ${formatMoney(Math.abs(difference), settings.currency)} (${difference < 0 ? 'Falta dinero' : 'Sobra dinero'}).`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Cerrar Turno */}
              <button
                type="button"
                disabled={actualCash === ''}
                onClick={() => setShowCloseModal(true)}
                className="w-full py-4 bg-stone-900 hover:bg-black disabled:opacity-40 disabled:hover:bg-stone-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-xl shadow-stone-900/10 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Confirmar Cierre de Turno</span>
              </button>

            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          PESTAÑA 2: CUENTAS Y MESAS ABIERTAS (EN CURSO)
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'abiertas' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-black text-stone-900">Mesas y Pedidos en Curso</h2>
              <p className="text-xs text-stone-500 font-semibold">Cuentas que aún no se han cobrado ni cerrado</p>
            </div>
            <span className="font-mono font-black text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              Total por Cobrar: {formatMoney(activeOrdersTotal, settings.currency)}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="font-bold text-sm text-stone-600">No hay cuentas abiertas pendientes</p>
              <p className="text-xs text-stone-400">Todas las mesas del restaurante están libres o cobradas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((ord) => (
                <div key={ord.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-stone-900">Mesa {ord.tableNumber}</span>
                      {ord.dinerName && (
                        <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-amber-200 truncate max-w-[120px]">
                          👤 {ord.dinerName}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-base text-stone-900">
                      {formatMoney(ord.total, settings.currency)}
                    </span>
                  </div>

                  {/* Detalle de Platos */}
                  <div className="bg-white rounded-xl p-2.5 border border-stone-200/80 space-y-1 text-xs max-h-36 overflow-y-auto custom-scrollbar">
                    {ord.items.map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between text-stone-700 font-semibold">
                        <span className="truncate pr-2">
                          <strong className="text-stone-900">{i.quantity}x</strong> {i.productName}
                        </span>
                        <span className="font-mono text-[11px] text-stone-500 shrink-0">
                          {formatMoney(i.price * i.quantity, settings.currency)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold pt-1">
                    <span>Mozo: {ord.waiterName || 'Caja'}</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-bold uppercase text-[9px]">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          PESTAÑA 3: VENTAS Y COBROS DEL DÍA
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ventas' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-black text-stone-900">Historial de Ventas Cobradas Hoy</h2>
              <p className="text-xs text-stone-500 font-semibold">Todas las transacciones liquidadas con su método de pago</p>
            </div>
            <span className="font-mono font-black text-sm text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              Total Cobrado: {formatMoney(totalBilled, settings.currency)}
            </span>
          </div>

          {todaySales.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
              <p className="font-bold text-sm text-stone-600">Aún no se han registrado ventas hoy</p>
              <p className="text-xs text-stone-400">Las ventas cobradas en el POS aparecerán automáticamente aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                    <th className="py-3 px-3">Hora</th>
                    <th className="py-3 px-3">Mesa / Origen</th>
                    <th className="py-3 px-3">Mozo / Atendido</th>
                    <th className="py-3 px-3">Método de Pago</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-center">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                  {todaySales.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-3 font-mono text-stone-500">
                        {format(new Date(s.date), 'hh:mm a')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-stone-900">Mesa {s.tableNumber || 'Directa'}</span>
                      </td>
                      <td className="py-3 px-3 text-stone-600">
                        {s.waiterName || 'Caja'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                          s.paymentMethod === 'Efectivo'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : s.paymentMethod === 'Yape' || s.paymentMethod === 'Plin'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}>
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-sm text-stone-900">
                        {formatMoney(s.total, settings.currency)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleToPrint(s)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-amber-500 hover:text-stone-950 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer shadow-2xs"
                          title="Ver e Imprimir Ticket de Venta"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ver Ticket</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════
          PESTAÑA 4: GASTOS Y SALIDAS DE CAJA
      ══════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'gastos' && (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-base font-black text-stone-900">Gastos y Salidas de Dinero de Hoy</h2>
              <p className="text-xs text-stone-500 font-semibold">Compras de insumos, pagos de gas, hielo, etc.</p>
            </div>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs hover:bg-rose-600 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Gasto</span>
            </button>
          </div>

          {todayExpenses.length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-stone-300" />
              <p className="font-bold text-sm text-stone-600">No hay gastos registrados hoy</p>
              <p className="text-xs text-stone-400">Si compraste algo con dinero de la caja, regístralo aquí para cuadrar exacto.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-[10px] font-black uppercase text-stone-400 tracking-wider">
                    <th className="py-3 px-3">Hora</th>
                    <th className="py-3 px-3">Descripción</th>
                    <th className="py-3 px-3">Categoría</th>
                    <th className="py-3 px-3 text-right">Monto</th>
                    <th className="py-3 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-800">
                  {todayExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-3 font-mono text-stone-500">
                        {format(new Date(exp.date), 'hh:mm a')}
                      </td>
                      <td className="py-3 px-3 font-bold text-stone-900">
                        {exp.description}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-700">
                        - {formatMoney(exp.amount, settings.currency)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CONFIRMACIÓN FINAL DE CIERRE DE TURNO ── */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-stone-900">Confirmación de Cierre de Caja</h3>
                <p className="text-xs text-stone-500 font-semibold">Resumen de liquidación del día</p>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Fondo Inicial:</span>
                <strong className="font-mono">{formatMoney(baseCash, settings.currency)}</strong>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>(+) Ventas en Efectivo:</span>
                <strong className="font-mono">{formatMoney(cashSales, settings.currency)}</strong>
              </div>
              <div className="flex justify-between text-purple-700 font-bold">
                <span>(+) Yape / Plin:</span>
                <strong className="font-mono">{formatMoney(yapeSales, settings.currency)}</strong>
              </div>
              <div className="flex justify-between text-sky-700 font-bold">
                <span>(+) Tarjetas / Banco:</span>
                <strong className="font-mono">{formatMoney(cardSales, settings.currency)}</strong>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>(-) Gastos de Caja:</span>
                <strong className="font-mono">- {formatMoney(totalExpenses, settings.currency)}</strong>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between font-black text-sm text-stone-900">
                <span>Efectivo Esperado:</span>
                <span className="font-mono text-amber-700">{formatMoney(expectedCash, settings.currency)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-stone-900">
                <span>Efectivo Contado:</span>
                <span className="font-mono text-stone-900">{formatMoney(declaredCash, settings.currency)}</span>
              </div>
              <div className={`flex justify-between font-black text-xs pt-1 border-t border-dashed border-stone-200 ${
                isBalanced ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                <span>Estado:</span>
                <span>{isBalanced ? 'Caja Cuadrada' : `Descuadre: ${formatMoney(difference, settings.currency)}`}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cerrar e Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR GASTO RÁPIDO ── */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                Registrar Gasto de Caja
              </h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-stone-400 hover:text-stone-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-stone-700 mb-1">Descripción del Gasto</label>
                <input
                  type="text"
                  placeholder="Ej: Balón de gas, 5kg limones, hielo..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-900 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 mb-1">Monto en {settings.currency}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-sm font-black font-mono text-stone-900 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 mb-1">Categoría</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-900 outline-none"
                >
                  <option value="Insumos">Insumos de Cocina</option>
                  <option value="Servicios">Servicios / Gas / Agua / Luz</option>
                  <option value="Personal">Adelanto / Pago Personal</option>
                  <option value="Otros">Otros Gastos Varios</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL IMPRESIÓN TICKET TÉRMICO DE CIERRE Z ── */}
      {showPrintModal && (
        <ThermalTicket
          order={dummyOrderForReport}
          ticketType="reporte_ventas"
          salesReportData={salesReportData}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {/* ── MODAL VER / RE-IMPRIMIR TICKET DE VENTA SELECCIONADA ── */}
      {selectedSaleToPrint && (
        <ThermalTicket
          order={{
            id: selectedSaleToPrint.id || 'sale-tk',
            type: selectedSaleToPrint.tableNumber?.startsWith('D-') ? 'delivery' : 'salón',
            floor: 1,
            tableNumber: selectedSaleToPrint.tableNumber || 'Directa',
            status: 'paid',
            items: selectedSaleToPrint.items || [],
            total: selectedSaleToPrint.total || 0,
            waiterName: selectedSaleToPrint.waiterName || 'Caja',
            createdAt: selectedSaleToPrint.date || new Date().toISOString(),
            updatedAt: selectedSaleToPrint.date || new Date().toISOString(),
          }}
          settings={settings}
          ticketType="boleta_venta"
          paymentMethod={selectedSaleToPrint.paymentMethod || 'Efectivo'}
          onClose={() => setSelectedSaleToPrint(null)}
        />
      )}

    </div>
  );
}
