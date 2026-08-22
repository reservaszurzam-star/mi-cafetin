import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { ViewState } from "../../App";
import { 
  CreditCard, FileCheck, Split, Receipt, ArrowRight, 
  Wallet, CheckCircle2, QrCode, Clock, User, Printer,
  Eye, ShoppingBag, DollarSign, ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatMoney } from '../../lib/formatters';
import { ThermalTicket } from '../tickets/ThermalTicket';
import { RestaurantOrder } from '../../types';

interface BillingViewProps {
  onNavigate?: (view: ViewState) => void;
}

export default function BillingView({ onNavigate }: BillingViewProps) {
  const { orders, sales, sunatInvoices, settings } = useAppStore();
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<RestaurantOrder | null>(null);

  const activeOrdersTotal = orders.reduce((sum, o) => sum + o.total, 0);
  const todaySalesTotal = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-amber-500" />
            Cobranza & Cuentas Abiertas
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1 font-semibold">
            Monitorea en tiempo real los pedidos en curso, totales acumulados y comprobantes de pago
          </p>
        </div>

        {onNavigate && (
          <button 
            onClick={() => onNavigate({ name: "pos" })} 
            className="h-11 px-5 bg-stone-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-stone-900/10 active:scale-95 text-xs cursor-pointer"
          >
            <span>Ir al Punto de Venta (POS)</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </button>
        )}
      </div>

      {/* ── METRICAS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Cuentas por Cobrar (Mesas)
            </span>
            <span className="bg-amber-200/80 text-amber-950 text-xs font-black px-2 py-0.5 rounded-full">
              {orders.length} mesas
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-amber-900">
            {formatMoney(activeOrdersTotal, settings.currency)}
          </p>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Total Cobrado Hoy
            </span>
            <span className="bg-emerald-200/80 text-emerald-950 text-xs font-black px-2 py-0.5 rounded-full">
              {sales.length} ventas
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-emerald-900">
            {formatMoney(todaySalesTotal, settings.currency)}
          </p>
        </div>

        <div className="bg-sky-50/70 p-5 rounded-3xl border border-sky-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-sky-600" />
              Comprobantes SUNAT
            </span>
            <span className="bg-sky-200/80 text-sky-950 text-xs font-black px-2 py-0.5 rounded-full">
              {sunatInvoices.length} emitidos
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-sky-900">
            {sunatInvoices.length} Boletas / Fact.
          </p>
        </div>
      </div>

      {/* ── CUENTAS EN CURSO (MESAS) ── */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-black text-stone-900">Detalle de Mesas y Cuentas en Consumo</h2>
            <p className="text-xs text-stone-500 font-semibold">Revisa lo que va sumando cada mesa antes de cerrar la cuenta</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <p className="font-bold text-sm text-stone-600">No hay cuentas pendientes</p>
            <p className="text-xs text-stone-400">Cuando los mozos tomen un pedido en el POS, aparecerá aquí en tiempo real.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((ord) => (
              <div key={ord.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3 shadow-2xs hover:border-amber-400 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-stone-900">Mesa {ord.tableNumber}</span>
                    {ord.dinerName && (
                      <span className="bg-amber-100 text-amber-900 text-xs font-black px-2 py-0.5 rounded-lg border border-amber-300 truncate max-w-[130px]">
                        👤 {ord.dinerName}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-lg text-amber-700">
                    {formatMoney(ord.total, settings.currency)}
                  </span>
                </div>

                {/* Lista de platos consumidos */}
                <div className="bg-white rounded-xl p-3 border border-stone-200 space-y-1.5 text-xs max-h-40 overflow-y-auto custom-scrollbar">
                  {ord.items.map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between text-stone-700 font-semibold">
                      <span className="truncate pr-2">
                        <strong className="text-stone-900 font-black">{i.quantity}x</strong> {i.productName}
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 shrink-0">
                        {formatMoney(i.price * i.quantity, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-500 font-semibold">
                    Mozo: <strong className="text-stone-800">{ord.waiterName || 'Caja'}</strong>
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForPrint(ord)}
                      className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Imprimir Pre-cuenta"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Pre-cuenta</span>
                    </button>

                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => onNavigate({ name: "pos" })}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-xs font-black transition shadow-2xs cursor-pointer"
                      >
                        Cobrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL IMPRESIÓN PRE-CUENTA ── */}
      {selectedOrderForPrint && (
        <ThermalTicket
          order={selectedOrderForPrint}
          ticketType="boleta_cliente"
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}

    </div>
  );
}
