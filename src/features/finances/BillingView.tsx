import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { ViewState } from "../../App";
import { 
  CreditCard, FileCheck, Receipt, ArrowRight, 
  Wallet, CheckCircle2, Clock, User, Printer,
  Eye, ShoppingBag, DollarSign, ArrowUpRight, Trash2,
  Search, Filter, Smartphone, Building2, Coins,
  Calendar, RefreshCw, ChevronRight, Utensils, Check,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatMoney } from '../../lib/formatters';
import { ThermalTicket, TicketType } from '../tickets/ThermalTicket';
import { POSCheckoutModal } from '../pos/POSCheckoutModal';
import { RestaurantOrder, PaymentMethod, Sale } from '../../types';
import { PAYMENT_METHODS, PAY_ICONS } from '../pos/posConstants';
import { cn } from '../../lib/utils';

interface BillingViewProps {
  onNavigate?: (view: ViewState) => void;
}

export default function BillingView({ onNavigate }: BillingViewProps) {
  const { 
    orders, 
    sales, 
    sunatInvoices, 
    settings, 
    customers, 
    currentUser,
    deleteOrder, 
    deleteSale,
    closeOrderAndPay 
  } = useAppStore();

  const isOwner = currentUser?.role === 'Owner';

  // ── Estados de Pestañas y Filtros ──
  const [activeTab, setActiveTab] = useState<'por_cobrar' | 'cobradas'>('por_cobrar');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('Todos');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('Todos');

  // ── Estados de Modales (Cobro e Impresión) ──
  const [selectedOrderForCheckout, setSelectedOrderForCheckout] = useState<RestaurantOrder | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [ticketToPrint, setTicketToPrint] = useState<{
    order: RestaurantOrder;
    type: TicketType;
    customerDocNumber?: string;
    paymentMethod?: string;
  } | null>(null);

  // ── Métricas y Totales ──
  const activeOrdersTotal = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  const todaySalesTotal = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  }, [sales]);

  const emptyOrders = useMemo(() => {
    return orders.filter((o) => !o.items || o.items.length === 0 || o.total === 0);
  }, [orders]);

  // Resumen de ventas por método de pago
  const paymentBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {
      Efectivo: 0,
      Yape: 0,
      Plin: 0,
      Tarjeta: 0,
      Transferencia: 0,
      "A crédito": 0,
      Otro: 0,
    };
    sales.forEach((s) => {
      const method = s.paymentMethod || 'Efectivo';
      breakdown[method] = (breakdown[method] || 0) + (Number(s.total) || 0);
    });
    return breakdown;
  }, [sales]);

  // ── Filtro para Órdenes Por Cobrar ──
  const filteredPendingOrders = useMemo(() => {
    return orders.filter((ord) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        ord.tableNumber?.toLowerCase().includes(q) ||
        ord.dinerName?.toLowerCase().includes(q) ||
        ord.waiterName?.toLowerCase().includes(q) ||
        ord.items?.some(i => i.productName?.toLowerCase().includes(q));

      const matchesFloor = 
        selectedFloorFilter === 'Todos' ||
        (selectedFloorFilter === 'Delivery' && (ord.type === 'delivery' || ord.tableNumber?.startsWith('D-'))) ||
        (selectedFloorFilter === 'Piso 1' && ord.floor === 1) ||
        (selectedFloorFilter === 'Piso 2' && ord.floor === 2) ||
        (selectedFloorFilter === 'Piso 3' && ord.floor === 3) ||
        (selectedFloorFilter === 'Piso 4' && ord.floor === 4);

      return matchesSearch && matchesFloor;
    });
  }, [orders, searchQuery, selectedFloorFilter]);

  // ── Filtro para Ventas Cobradas ──
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const q = searchQuery.toLowerCase().trim();
      const matchingSunat = sunatInvoices.find(
        (inv) => inv.orderId === sale.id || (inv.total === sale.total && Math.abs(new Date(inv.date).getTime() - new Date(sale.date).getTime()) < 60000)
      );

      const matchesSearch = 
        !q ||
        sale.tableNumber?.toLowerCase().includes(q) ||
        sale.cashierName?.toLowerCase().includes(q) ||
        sale.waiterName?.toLowerCase().includes(q) ||
        matchingSunat?.customerName?.toLowerCase().includes(q) ||
        matchingSunat?.customerDocNumber?.includes(q) ||
        `${matchingSunat?.series}-${matchingSunat?.number}`.toLowerCase().includes(q) ||
        sale.items?.some(i => i.productName?.toLowerCase().includes(q));

      const matchesPayment = 
        selectedPaymentFilter === 'Todos' || sale.paymentMethod === selectedPaymentFilter;

      return matchesSearch && matchesPayment;
    });
  }, [sales, sunatInvoices, searchQuery, selectedPaymentFilter]);

  // ── Handlers de Cobro e Impresión ──
  const handleOpenCheckout = (order: RestaurantOrder) => {
    setSelectedOrderForCheckout(order);
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmPayment = (details: {
    paymentMethod: PaymentMethod;
    docType: 'Boleta' | 'Factura' | 'Nota de Venta';
    docNumber?: string;
    customerName?: string;
    splitType: 'single' | 'equal';
    splitWays: number;
    splitMethods: PaymentMethod[];
    printTicket: boolean;
  }) => {
    if (!selectedOrderForCheckout) return;

    let payments: { method: PaymentMethod; amount: number }[] = [];
    if (details.splitType === 'equal' && details.splitWays > 1 && details.splitMethods?.length > 0) {
      const splitAmount = Number((selectedOrderForCheckout.total / details.splitWays).toFixed(2));
      payments = details.splitMethods.slice(0, details.splitWays).map((m) => ({ method: m, amount: splitAmount }));
    } else {
      payments = [{ method: details.paymentMethod, amount: selectedOrderForCheckout.total }];
    }

    if (details.printTicket) {
      const orderToPrint: RestaurantOrder = {
        ...selectedOrderForCheckout,
        items: (selectedOrderForCheckout.items || []).map(item => ({ ...item })),
        dinerName: details.customerName || selectedOrderForCheckout.dinerName,
      };
      setTicketToPrint({
        order: orderToPrint,
        type: "boleta_venta",
        customerDocNumber: details.docNumber,
        paymentMethod: details.paymentMethod,
      });
    }

    closeOrderAndPay(
      selectedOrderForCheckout.id,
      payments,
      selectedOrderForCheckout.customerId,
      details.docType,
      details.docNumber
    );

    setIsCheckoutModalOpen(false);
    setSelectedOrderForCheckout(null);
  };

  const handlePrintPreBill = (order: RestaurantOrder) => {
    setTicketToPrint({
      order,
      type: "boleta_cliente",
    });
  };

  const handleReprintSale = (sale: Sale) => {
    const matchingSunat = sunatInvoices.find(
      (inv) => inv.orderId === sale.id || (inv.total === sale.total && Math.abs(new Date(inv.date).getTime() - new Date(sale.date).getTime()) < 60000)
    );

    const orderMock: RestaurantOrder = {
      id: sale.id,
      type: sale.orderType || "salón",
      floor: (sale.floor as 1|2|3|4) || 1,
      tableNumber: sale.tableNumber || "Venta Cobrada",
      dinerName: matchingSunat?.customerName || (sale.customerId ? customers.find(c => c.id === sale.customerId)?.name : undefined),
      status: "paid",
      items: (sale.items || []).map((i, idx) => ({
        id: `item-${idx}`,
        productId: i.productId || `prod-${idx}`,
        productName: i.productName,
        quantity: i.quantity,
        price: i.price,
        station: "Cocina & Parrilla",
        batchNumber: 1,
        sentToKitchen: true,
      })),
      total: sale.total,
      createdAt: sale.date,
      updatedAt: sale.date,
      waiterName: sale.waiterName,
    };

    setTicketToPrint({
      order: orderMock,
      type: "boleta_venta",
      customerDocNumber: matchingSunat?.customerDocNumber,
      paymentMethod: sale.paymentMethod,
    });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER SUPERIOR ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-amber-500" />
            Cobranza & Cuentas
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1 font-semibold">
            Cobra mesas en tiempo real, emite comprobantes y revisa las cuentas cobradas del día
          </p>
        </div>

        {onNavigate && (
          <button 
            onClick={() => onNavigate({ name: "pos" })} 
            className="h-11 px-5 bg-stone-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-stone-900/10 active:scale-95 text-xs cursor-pointer"
          >
            <span>Ir al Plano de Mesas (POS)</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </button>
        )}
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* 1. Por Cobrar */}
        <div 
          onClick={() => setActiveTab('por_cobrar')}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer shadow-2xs",
            activeTab === 'por_cobrar'
              ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/30"
              : "bg-white border-stone-200 hover:border-amber-300"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Cuentas por Cobrar (Mesas)
            </span>
            <span className="bg-amber-200 text-amber-950 text-xs font-black px-2.5 py-0.5 rounded-full">
              {orders.length} pendientes
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-amber-900">
            {formatMoney(activeOrdersTotal, settings.currency)}
          </p>
        </div>

        {/* 2. Cobradas Hoy */}
        <div 
          onClick={() => setActiveTab('cobradas')}
          className={cn(
            "p-5 rounded-3xl border transition-all cursor-pointer shadow-2xs",
            activeTab === 'cobradas'
              ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/30"
              : "bg-white border-stone-200 hover:border-emerald-300"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Total Cobrado Hoy
            </span>
            <span className="bg-emerald-200 text-emerald-950 text-xs font-black px-2.5 py-0.5 rounded-full">
              {sales.length} ventas
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-emerald-900">
            {formatMoney(todaySalesTotal, settings.currency)}
          </p>
        </div>

        {/* 3. Comprobantes SUNAT */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-sky-600" />
              Comprobantes SUNAT
            </span>
            <span className="bg-sky-100 text-sky-950 text-xs font-black px-2.5 py-0.5 rounded-full">
              {sunatInvoices.length} emitidos
            </span>
          </div>
          <p className="text-3xl font-black font-mono text-sky-900">
            {sunatInvoices.length} Boletas / Fact.
          </p>
        </div>
      </div>

      {/* ── SELECTOR DE PESTAÑAS (POR COBRAR vs COBRADAS) ── */}
      <div className="bg-stone-200/70 p-1.5 rounded-3xl flex items-center gap-2 border border-stone-300/60 max-w-xl">
        
        <button
          onClick={() => {
            setActiveTab('por_cobrar');
            setSearchQuery('');
          }}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'por_cobrar'
              ? "bg-white text-stone-900 shadow-md shadow-stone-900/5 scale-100"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          )}
        >
          <Clock className={cn("w-4 h-4", activeTab === 'por_cobrar' ? "text-amber-500" : "text-stone-400")} />
          <span>POR COBRAR</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-black",
            activeTab === 'por_cobrar' ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-stone-300 text-stone-700"
          )}>
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('cobradas');
            setSearchQuery('');
          }}
          className={cn(
            "flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'cobradas'
              ? "bg-white text-stone-900 shadow-md shadow-stone-900/5 scale-100"
              : "text-stone-600 hover:text-stone-900 hover:bg-white/50"
          )}
        >
          <CheckCircle2 className={cn("w-4 h-4", activeTab === 'cobradas' ? "text-emerald-500" : "text-stone-400")} />
          <span>COBRADAS</span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-black",
            activeTab === 'cobradas' ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-stone-300 text-stone-700"
          )}>
            {sales.length}
          </span>
        </button>

      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Buscador */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'por_cobrar' 
              ? "Buscar por mesa, cliente, mozo o plato..." 
              : "Buscar por comprobante (B001/F001), cliente, DNI/RUC, mesa..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 hover:bg-stone-100/70 focus:bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Filtros específicos según pestaña */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {activeTab === 'por_cobrar' ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {['Todos', 'Piso 1', 'Piso 2', 'Piso 3', 'Piso 4', 'Delivery'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFloorFilter(f)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0",
                    selectedFloorFilter === f
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Pago:
              </span>
              <select
                value={selectedPaymentFilter}
                onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Todos">Todos los métodos</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* Acciones de Limpieza en Por Cobrar (Solo Owner) */}
          {activeTab === 'por_cobrar' && isOwner && (
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {emptyOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    emptyOrders.forEach(o => deleteOrder(o.id));
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Eliminar borradores vacíos o con S/ 0.00 (Solo Owner)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Limpiar ({emptyOrders.length}) vacías</span>
                </button>
              )}

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("¿Estás seguro de que deseas liberar TODAS las mesas y pedidos abiertos? (Acción exclusiva de Owner)")) {
                      orders.forEach(o => deleteOrder(o.id));
                    }
                  }}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Liberar todas las mesas activas (Solo Owner)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-stone-500" />
                  <span>Liberar Todas</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── CONTENIDO PRINCIPAL: PESTAÑA 1: POR COBRAR ── */}
      {activeTab === 'por_cobrar' && (
        <div className="space-y-4">
          
          {filteredPendingOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-stone-400 space-y-3 shadow-xs">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
              <p className="font-black text-base text-stone-700">No hay cuentas pendientes por cobrar</p>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Cuando los mozos o el cajero tomen un pedido en el Punto de Venta (POS), aparecerá aquí listo para ser cobrado.
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate({ name: "pos" })}
                  className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Abrir nueva comanda en POS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPendingOrders.map((ord) => {
                const isDelivery = ord.type === 'delivery' || ord.tableNumber.startsWith('D-');

                return (
                  <div 
                    key={ord.id} 
                    className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    
                    {/* Header de la Tarjeta */}
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs",
                            isDelivery ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                          )}>
                            {isDelivery ? "DEL" : ord.tableNumber.replace(/[^0-9]/g, '') || "POS"}
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-black text-sm text-stone-900 leading-tight truncate">
                              Mesa {ord.tableNumber}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {ord.dinerName ? (
                                <span className="bg-amber-100 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-300 truncate max-w-[130px]">
                                  👤 {ord.dinerName}
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-semibold">Cliente General</span>
                              )}
                              <span className="text-[9px] bg-stone-100 text-stone-600 font-bold px-1.5 py-0.5 rounded">
                                Piso {ord.floor || 1}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-black text-xl text-amber-600">
                            {formatMoney(ord.total, settings.currency)}
                          </div>
                          <span className="text-[10px] text-stone-400 font-semibold">
                            {ord.items?.length || 0} ítems
                          </span>
                        </div>
                      </div>

                      {/* Lista Desglosada de Platos */}
                      <div className="mt-3 bg-stone-50/80 rounded-2xl p-3 border border-stone-200/80 space-y-2 text-xs max-h-44 overflow-y-auto custom-scrollbar">
                        {!ord.items || ord.items.length === 0 ? (
                          <p className="text-stone-400 italic text-[11px] text-center py-2">
                            Sin platos añadidos (Borrador vacío)
                          </p>
                        ) : (
                          ord.items.map((i, idx) => (
                            <div key={idx} className="flex items-center justify-between text-stone-700 font-semibold gap-2">
                              <span className="truncate flex-1">
                                <strong className="text-stone-900 font-black">{i.quantity}x</strong> {i.productName}
                                {i.notes && (
                                  <span className="block text-[10px] text-amber-700 italic truncate font-normal">
                                    "{i.notes}"
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-[11px] text-stone-600 shrink-0">
                                {formatMoney(i.price * i.quantity, settings.currency)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Footer y Botones de Acción */}
                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold">
                        <span>Mozo: <strong className="text-stone-800">{ord.waiterName || 'Caja'}</strong></span>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Deseas cancelar/liberar la Mesa ${ord.tableNumber}? (Acción exclusiva de Owner)`)) {
                                deleteOrder(ord.id);
                              }
                            }}
                            className="text-stone-400 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
                            title="Cancelar comanda (Solo Owner)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Liberar</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePrintPreBill(ord)}
                          disabled={!ord.items || ord.items.length === 0}
                          className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
                          title="Imprimir Pre-cuenta para llevar al cliente"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-600" />
                          <span>Pre-cuenta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(ord)}
                          disabled={!ord.items || ord.items.length === 0}
                          className="py-2.5 px-3 bg-stone-900 hover:bg-black active:scale-95 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-40"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cobrar</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL: PESTAÑA 2: COBRADAS ── */}
      {activeTab === 'cobradas' && (
        <div className="space-y-5">
          
          {/* Desglose Rápido por Métodos de Pago */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {PAYMENT_METHODS.map((m) => {
              const totalAmount = paymentBreakdown[m] || 0;

              return (
                <div 
                  key={m} 
                  onClick={() => setSelectedPaymentFilter(m)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all cursor-pointer shadow-2xs",
                    selectedPaymentFilter === m 
                      ? "bg-stone-900 text-white border-stone-900" 
                      : "bg-white text-stone-800 border-stone-200 hover:border-stone-400"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {PAY_ICONS[m]}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider truncate",
                      selectedPaymentFilter === m ? "text-stone-300" : "text-stone-500"
                    )}>
                      {m}
                    </span>
                  </div>
                  <p className={cn(
                    "font-mono font-black text-sm truncate",
                    selectedPaymentFilter === m ? "text-amber-400" : "text-stone-900"
                  )}>
                    {formatMoney(totalAmount, settings.currency)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tabla / Lista de Ventas Cobradas */}
          {filteredSales.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-stone-400 space-y-3 shadow-xs">
              <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
              <p className="font-black text-base text-stone-700">No se encontraron cobros registrados</p>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                No hay ventas que coincidan con la búsqueda o filtro seleccionado.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div>
                  <h2 className="text-sm font-black text-stone-900">Historial de Cobros y Ventas Realizadas</h2>
                  <p className="text-[11px] text-stone-500 font-semibold">Mostrando {filteredSales.length} transacciones registradas</p>
                </div>
                <div className="text-right font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  Total Filtrado: {formatMoney(filteredSales.reduce((s, x) => s + (Number(x.total) || 0), 0), settings.currency)}
                </div>
              </div>

              <div className="divide-y divide-stone-100 overflow-x-auto">
                {filteredSales.map((sale) => {
                  const matchingSunat = sunatInvoices.find(
                    (inv) => inv.orderId === sale.id || (inv.total === sale.total && Math.abs(new Date(inv.date).getTime() - new Date(sale.date).getTime()) < 60000)
                  );
                  const saleDate = new Date(sale.date);
                  const formattedTime = !isNaN(saleDate.getTime()) 
                    ? format(saleDate, "dd/MM/yyyy · hh:mm a", { locale: es }) 
                    : "Hoy";

                  return (
                    <div 
                      key={sale.id}
                      className="p-4 hover:bg-stone-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Información Izquierda */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0 font-black text-xs">
                          {PAY_ICONS[sale.paymentMethod || 'Efectivo']}
                        </div>

                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-stone-900">
                              {sale.tableNumber || "Venta Directa"}
                            </span>

                            {matchingSunat ? (
                              <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                                {matchingSunat.type} {matchingSunat.series}-{matchingSunat.number}
                              </span>
                            ) : (
                              <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Nota de Venta
                              </span>
                            )}

                            <span className="text-[10px] text-stone-400 font-semibold">
                              {formattedTime}
                            </span>
                          </div>

                          <div className="text-xs text-stone-600 flex items-center gap-2 flex-wrap">
                            {matchingSunat?.customerName ? (
                              <span className="font-bold text-stone-800">
                                👤 {matchingSunat.customerName} {matchingSunat.customerDocNumber ? `(${matchingSunat.customerDocNumber})` : ''}
                              </span>
                            ) : sale.customerId ? (
                              <span className="font-bold text-stone-800">
                                👤 {customers.find(c => c.id === sale.customerId)?.name || 'Cliente'}
                              </span>
                            ) : (
                              <span className="text-stone-400 font-medium">Cliente General</span>
                            )}
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500 font-medium">
                              Cajero: <strong>{sale.cashierName || 'Caja'}</strong>
                            </span>
                          </div>

                          {/* Resumen de Platos */}
                          <div className="text-[11px] text-stone-500 line-clamp-1">
                            {sale.items && sale.items.length > 0 ? (
                              sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')
                            ) : (
                              'Consumo registrado'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Información Derecha y Acciones */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                        <div className="text-right">
                          <div className="font-mono font-black text-lg text-emerald-700">
                            {formatMoney(sale.total, settings.currency)}
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] font-bold text-stone-500 uppercase">
                              {sale.paymentMethod || 'Efectivo'}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReprintSale(sale)}
                            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Re-imprimir Comprobante / Ticket de Venta"
                          >
                            <Printer className="w-3.5 h-3.5 text-stone-600" />
                            <span>Re-imprimir</span>
                          </button>

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de que deseas anular y eliminar esta venta de ${formatMoney(sale.total, settings.currency)}? (Acción exclusiva de Owner)`)) {
                                  deleteSale(sale.id);
                                }
                              }}
                              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Anular y eliminar venta (Solo Owner)"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Anular</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── MODAL DE COBRO DIRECTO (POSCheckoutModal) ── */}
      {isCheckoutModalOpen && selectedOrderForCheckout && (
        <POSCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => {
            setIsCheckoutModalOpen(false);
            setSelectedOrderForCheckout(null);
          }}
          tableLabel={`Mesa ${selectedOrderForCheckout.tableNumber}`}
          total={selectedOrderForCheckout.total}
          settings={settings}
          customers={customers}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* ── MODAL DE IMPRESIÓN TÉRMICA (PRE-CUENTA O TICKET DE VENTA) ── */}
      {ticketToPrint && (
        <ThermalTicket
          order={ticketToPrint.order}
          ticketType={ticketToPrint.type}
          customerName={ticketToPrint.order.dinerName}
          customerDocNumber={ticketToPrint.customerDocNumber}
          paymentMethod={ticketToPrint.paymentMethod || "Efectivo"}
          onClose={() => setTicketToPrint(null)}
        />
      )}

    </div>
  );
}

