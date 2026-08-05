import React, { useState, useMemo, useRef } from "react";
import { useAppStore } from "../hooks/StoreContext";
import { Product, PaymentMethod, ProductCategory, RestaurantOrder, OrderItem } from "../types";
import { PisoSelector, RESTAURANT_FLOORS } from "./PisoSelector";
import { ThermalTicket } from "./ThermalTicket";
import ComandaTicket from "./ComandaTicket";
import { useReactToPrint } from "react-to-print";
import {
  Plus, Minus, Trash2, Search, CheckCircle2, Banknote,
  UtensilsCrossed, ChefHat, X, Send, MessageSquare,
  ShoppingBag, Lock,
} from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PAYMENT_METHODS: PaymentMethod[] = [
  "Efectivo","Yape","Plin","Tarjeta","Transferencia","A crédito","Otro",
];

const PAY_ICONS: Record<string, string> = {
  Efectivo:"💵", Yape:"📱", Plin:"📲", Tarjeta:"💳",
  Transferencia:"🏦", "A crédito":"📋", Otro:"💰",
};

const PAY_IMAGES: Record<string, React.ReactNode> = {
  Efectivo: <span className="text-3xl drop-shadow-md">💵</span>,
  Yape: <img src="/payment-methods/yape.png" alt="Yape" className="w-8 h-8 object-contain rounded-md shadow-sm" />,
  Plin: <img src="/payment-methods/plin.png" alt="Plin" className="w-8 h-8 object-contain rounded-md shadow-sm" />,
  Tarjeta: <img src="/payment-methods/visa.jpg" alt="Tarjeta" className="w-8 h-8 object-contain rounded-md shadow-sm bg-white p-0.5" />,
  Transferencia: <img src="/payment-methods/transferencia.png" alt="Transferencia" className="w-8 h-8 object-contain rounded-md shadow-sm" />,
  "A crédito": <span className="text-3xl drop-shadow-md">📋</span>,
  Otro: <span className="text-3xl drop-shadow-md">💰</span>,
};

export default function POSView() {
  const {
    products, settings, customers, orders,
    saveOrderDraft, sendOrderToKitchen, closeOrderAndPay,
    deleteOrder, printers, updateOrderStatus,
  } = useAppStore();

  const [activeFloor,      setActiveFloor]      = useState<number>(1);
  const [selectedTable,    setSelectedTable]    = useState<string>("101");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "Todos">("Todos");
  const [searchQuery,      setSearchQuery]      = useState("");
  const [editingNoteId,    setEditingNoteId]    = useState<string | null>(null);
  const [noteText,         setNoteText]         = useState("");

  const [showKDS,          setShowKDS]          = useState(false);
  const [isCheckoutOpen,   setIsCheckoutOpen]   = useState(false);
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod>("Efectivo");
  const [splitType,        setSplitType]        = useState<"single"|"equal">("single");
  const [splitWays,        setSplitWays]        = useState(2);
  const [splitMethods,     setSplitMethods]     = useState<PaymentMethod[]>(Array(10).fill("Efectivo"));
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showPrintModal,   setShowPrintModal]   = useState(false);
  const [ticketOrderToPrint, setTicketOrderToPrint] = useState<RestaurantOrder | null>(null);
  const [lastTickets,      setLastTickets]      = useState<{ station: string; batchNumber: number; items: OrderItem[] }[]>([]);
  
  // Delivery Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [delAddress, setDelAddress] = useState("");
  const [delPhone, setDelPhone] = useState("");
  const [delDiner, setDelDiner] = useState("");

  const activeOrder = useMemo(() => orders.find((o) => o.tableNumber === selectedTable), [orders, selectedTable]);

  const categories: (ProductCategory | "Todos")[] = [
    "Todos","Combos & Promos","Pollos a la Brasa","Parrillas & Mostros",
    "Entradas & Chaufa","Guarniciones & Salsas","Bebidas & Refrescos","Postres","Otros",
  ];

  const filteredProducts = useMemo(() =>
    products.filter((p) => {
      const mc = selectedCategory === "Todos" || p.category === selectedCategory;
      const ms = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return mc && ms;
    }), [products, selectedCategory, searchQuery]
  );

  const currentItems = activeOrder?.items ?? [];
  const unsentCount  = currentItems.filter((i) => !i.sentToKitchen).length;
  const sentCount    = currentItems.filter((i) =>  i.sentToKitchen).length;
  const currentTotal = currentItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleAddItem = (product: Product) => {
    const idx = currentItems.findIndex((i) => i.productId === product.id && !i.sentToKitchen);
    const updated: OrderItem[] = idx >= 0
      ? currentItems.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item)
      : [...currentItems, { id: crypto.randomUUID(), productId: product.id, productName: product.name, quantity: 1, price: product.price, station: product.station || "Cocina", sentToKitchen: false, batchNumber: 1 }];
    saveOrderDraft({
      id: activeOrder?.id || `ord-${selectedTable}-${Date.now().toString().slice(-4)}`,
      type: selectedTable.startsWith("D-") ? "delivery" : "salón",
      floor: (activeFloor as 1|2|3|4) || 1,
      tableNumber: selectedTable,
      status: activeOrder?.status === "sent" ? "partially_sent" : "draft",
      items: updated,
      total: updated.reduce((a, i) => a + i.price * i.quantity, 0),
      createdAt: activeOrder?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      waiterName: activeOrder?.waiterName || "Mesero",
    });
  };

  const handleQty = (itemId: string, delta: number) => {
    const updated = currentItems.map((i) => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0);
    if (updated.length === 0 && activeOrder) { deleteOrder(activeOrder.id); return; }
    saveOrderDraft({ ...activeOrder!, items: updated, total: updated.reduce((a, i) => a + i.price * i.quantity, 0), updatedAt: new Date().toISOString() });
  };

  const handleSaveNote = (itemId: string) => {
    if (!activeOrder) return;
    saveOrderDraft({ ...activeOrder, items: activeOrder.items.map((i) => i.id === itemId ? { ...i, notes: noteText } : i), updatedAt: new Date().toISOString() });
    setEditingNoteId(null); setNoteText("");
  };

  const handleSendToKitchen = () => {
    if (!activeOrder || unsentCount === 0) return;
    const { sentItems, batchNumber } = sendOrderToKitchen(activeOrder.id);
    const grouped: Record<string, { station: string; items: OrderItem[] }> = {};
    sentItems.forEach((item) => {
      const p = products.find((p) => p.id === item.productId);
      const tp = printers.find((pr) => p?.category && pr.categories.includes(p.category)) || printers[0];
      const name = tp?.name || "Cocina";
      const station = tp?.station || item.station;
      if (!grouped[name]) grouped[name] = { station, items: [] };
      grouped[name].items.push(item);
    });
    setLastTickets(Object.values(grouped).map((d) => ({ station: d.station, batchNumber, items: d.items })));
    setShowPrintModal(true);
  };

  const handlePay = () => {
    if (!activeOrder) return;
    
    let payments: { method: PaymentMethod, amount: number }[] = [];
    if (splitType === "single") {
      payments = [{ method: paymentMethod, amount: currentTotal }];
    } else if (splitType === "equal") {
      const splitAmt = parseFloat((currentTotal / splitWays).toFixed(2));
      let accumulated = 0;
      payments = Array.from({length: splitWays}).map((_, i) => {
        const isLast = i === splitWays - 1;
        const amount = isLast ? parseFloat((currentTotal - accumulated).toFixed(2)) : splitAmt;
        accumulated += amount;
        return { method: splitMethods[i], amount };
      });
    }

    closeOrderAndPay(activeOrder.id, payments, selectedCustomerId || undefined);
    setIsCheckoutOpen(false); setSelectedCustomerId(""); setSplitType("single"); setSplitWays(2);
  };

  const floorName = RESTAURANT_FLOORS.find((f) => f.id === activeFloor)?.name ?? "";
  const tableLabel = selectedTable.startsWith("D-") ? `🛵 ${selectedTable}` : `Mesa ${selectedTable}`;
  const kdsCount = orders.filter((o) => o.status === "sent" || o.status === "partially_sent").length;

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2.5 h-[calc(100vh-6rem)] -mt-2 -mb-4 animate-in fade-in duration-300">

      {/* ① SELECTOR PISOS + MESAS */}
      <PisoSelector
        activeFloor={activeFloor} selectedTable={selectedTable}
        orders={orders} currency={settings.currency}
        onSelectFloor={setActiveFloor} onSelectTable={setSelectedTable}
      />

      {/* ② CATÁLOGO  |  ③ COMANDA */}
      <div className="grid grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">

        {/* ══════════════ CATÁLOGO ══════════════ */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-2.5 min-h-0">

          {/* Filtros */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/70 dark:border-stone-800 px-3 py-2 flex items-center gap-2 flex-shrink-0">
            <div className="relative flex-shrink-0 w-36">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text" placeholder="Buscar..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg py-1.5 pl-7 pr-2 text-xs outline-none focus:border-amber-500 dark:text-stone-100 placeholder-stone-400"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-none">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-150",
                    selectedCategory === cat
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >{cat}</button>
              ))}
            </div>
          </div>

          {/* Grid de productos */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/70 dark:border-stone-800 flex-1 min-h-0 overflow-y-auto p-2.5">
            {filteredProducts.length === 0
              ? <div className="h-full flex flex-col items-center justify-center text-stone-300 dark:text-stone-700"><UtensilsCrossed className="w-10 h-10 mb-2" /><p className="text-sm">Sin resultados</p></div>
              : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredProducts.map((product) => {
                    const inCart = currentItems.find((i) => i.productId === product.id);
                    return (
                      <button key={product.id} onClick={() => handleAddItem(product)}
                        className={cn(
                          "group relative rounded-xl border text-left flex flex-col justify-between p-2.5 gap-2 transition-all duration-150 active:scale-[0.96]",
                          inCart
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600"
                            : "bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800"
                        )}
                      >
                        {/* Badge cantidad */}
                        {inCart && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-stone-900 shadow">
                            {inCart.quantity}
                          </div>
                        )}
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">{product.category}</p>
                          <p className="font-semibold text-[12px] text-stone-900 dark:text-stone-100 leading-tight line-clamp-2">{product.name}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-stone-200/70 dark:border-stone-700/70">
                          <span className="font-mono font-black text-sm text-stone-800 dark:text-stone-100">{settings.currency} {product.price.toFixed(2)}</span>
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                            inCart ? "bg-amber-500 text-white" : "bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400 group-hover:bg-stone-800 group-hover:text-white dark:group-hover:bg-stone-200 dark:group-hover:text-stone-900"
                          )}>
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
          </div>
        </div>

        {/* ══════════════ COMANDA ══════════════ */}
        <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0 rounded-xl border border-stone-200/70 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900">

          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900 flex-shrink-0">
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-black font-mono text-stone-900 dark:text-white">{tableLabel}</h2>
                <span className="text-xs text-stone-400 font-medium">{floorName}</span>
                {selectedTable.startsWith("D-") && activeOrder && (
                  <button 
                    onClick={() => {
                      setDelAddress(activeOrder.deliveryAddress || "");
                      setDelPhone(activeOrder.customerPhone || "");
                      setDelDiner(activeOrder.dinerName || "");
                      setShowDeliveryModal(true);
                    }} 
                    className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold hover:bg-amber-200"
                  >
                    📝 Datos Delivery
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {currentItems.length === 0
                  ? <span className="text-[11px] text-stone-400">Mesa libre</span>
                  : <>
                    {unsentCount > 0 && <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">● {unsentCount} por enviar</span>}
                    {unsentCount > 0 && sentCount > 0 && <span className="text-stone-300 text-[11px]">·</span>}
                    {sentCount > 0 && <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ {sentCount} en cocina</span>}
                  </>
                }
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón KDS */}
              <button onClick={() => setShowKDS(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shadow-amber-500/30"
              >
                <ChefHat className="w-3.5 h-3.5" />
                KDS
                {kdsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-stone-900">
                    {kdsCount}
                  </span>
                )}
              </button>
              {/* Anular */}
              {activeOrder && (
                <button onClick={() => deleteOrder(activeOrder.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de ítems */}
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2.5 space-y-1.5">
            {currentItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-6 h-6 text-stone-300 dark:text-stone-600" />
                </div>
                <p className="text-sm font-semibold text-stone-400 dark:text-stone-500">Comanda vacía</p>
                <p className="text-xs text-stone-300 dark:text-stone-600 mt-1">Toca un producto del catálogo para agregar</p>
              </div>
            ) : (
              currentItems.map((item) => (
                <div key={item.id}
                  className={cn(
                    "rounded-xl overflow-hidden border transition-all",
                    item.sentToKitchen
                      ? "border-stone-200 dark:border-stone-700/80 bg-stone-50/80 dark:bg-stone-800/30"
                      : "border-amber-300/60 dark:border-amber-700/40 bg-white dark:bg-stone-900"
                  )}
                >
                  {/* Franja de color superior por estado */}
                  <div className={cn("h-0.5", item.sentToKitchen ? "bg-emerald-400" : "bg-amber-400")} />

                  <div className="p-3">
                    {/* Nombre + precio */}
                    <div className="flex items-start gap-2 justify-between">
                      <p className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-snug flex-1">{item.productName}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono font-black text-base text-stone-900 dark:text-white whitespace-nowrap">
                          {settings.currency} {(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono">{settings.currency} {item.price.toFixed(2)}/u</p>
                      </div>
                    </div>

                    {/* Badge estado */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                        item.sentToKitchen
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      )}>
                        {item.sentToKitchen ? "✓ Cocina" : "⏳ Borrador"}
                      </span>
                      <span className="text-[10px] text-stone-400">{item.station}</span>
                    </div>

                    {/* Nota */}
                    {item.notes && editingNoteId !== item.id && (
                      <button onClick={() => { setEditingNoteId(item.id); setNoteText(item.notes || ""); }}
                        className="mt-2 w-full text-left px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center gap-1.5 group hover:border-amber-400 transition"
                      >
                        <MessageSquare className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 italic truncate">{item.notes}</span>
                      </button>
                    )}
                    {editingNoteId === item.id && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <input autoFocus type="text" placeholder="Ej: Sin cebolla..."
                          value={noteText} onChange={(e) => setNoteText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(item.id); if (e.key === "Escape") setEditingNoteId(null); }}
                          className="flex-1 bg-white dark:bg-stone-900 border-2 border-amber-400 rounded-lg px-2.5 py-1.5 text-xs outline-none text-stone-900 dark:text-stone-100"
                        />
                        <button onClick={() => handleSaveNote(item.id)} className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition">OK</button>
                        <button onClick={() => setEditingNoteId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}

                    {/* Controles cantidad + nota */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-700/50">
                      {!item.sentToKitchen ? (
                        <div className="flex items-center gap-0 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden">
                          <button onClick={() => handleQty(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-all"
                          ><Minus className="w-3.5 h-3.5 stroke-[2.5]" /></button>
                          <span className="w-8 text-center font-mono font-black text-sm text-stone-900 dark:text-white select-none">{item.quantity}</span>
                          <button onClick={() => handleQty(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-all"
                          ><Plus className="w-3.5 h-3.5 stroke-[2.5]" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                          <span className="font-mono font-black text-sm text-stone-700 dark:text-stone-300">{item.quantity}</span>
                          <span className="text-[10px] text-stone-400">unidades</span>
                        </div>
                      )}

                      {!item.sentToKitchen && editingNoteId !== item.id && (
                        <button
                          onClick={() => { setEditingNoteId(item.id); setNoteText(item.notes || ""); }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 dark:hover:text-amber-400 transition-all text-[11px] font-medium"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {item.notes ? "Editar obs." : "Obs."}
                        </button>
                      )}
                      {item.sentToKitchen && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer: Total + Acciones */}
          <div className="flex-shrink-0 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 px-4 pt-3 pb-4 space-y-3">
            {/* Total */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Comanda</p>
                <p className="font-mono font-black text-3xl text-stone-900 dark:text-white leading-none mt-0.5">
                  {settings.currency} {currentTotal.toFixed(2)}
                </p>
              </div>
              <div className="text-right text-[11px] text-stone-400 pb-0.5">
                <p>{currentItems.reduce((s,i) => s + i.quantity, 0)} unidades</p>
                <p>{currentItems.length} ítems</p>
              </div>
            </div>

            {/* Botón PRINCIPAL: Enviar a cocina */}
            <button
              onClick={handleSendToKitchen}
              disabled={unsentCount === 0}
              className={cn(
                "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-150",
                unsentCount > 0
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-100 active:scale-[0.98] shadow-md"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
              {unsentCount === 0
                ? "Todo enviado a cocina"
                : sentCount > 0
                  ? `Añadir a Cocina · ${unsentCount} ítem${unsentCount !== 1 ? "s" : ""}`
                  : `Enviar a Cocina · ${unsentCount} ítem${unsentCount !== 1 ? "s" : ""}`
              }
            </button>

            {/* Botones secundarios */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => activeOrder && updateOrderStatus(activeOrder.id, "served")}
                disabled={!activeOrder || (activeOrder.status !== "sent" && activeOrder.status !== "partially_sent")}
                className="h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Servido
              </button>
              <button
                onClick={() => setIsCheckoutOpen(true)}
                disabled={currentItems.length === 0}
                className="h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 active:scale-[0.97] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-amber-500/30"
              >
                <Banknote className="w-4 h-4" /> Cobrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL TICKET ═══ */}
      {(showPrintModal || ticketOrderToPrint) && (
        <ThermalTicket
          order={ticketOrderToPrint || activeOrder || {
            id:"t",type:"salón",floor:activeFloor as 1|2|3|4,tableNumber:selectedTable,
            status:"sent",items:lastTickets.flatMap((t)=>t.items),total:currentTotal,
            createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),waiterName:"Mesero",
          }}
          stationName={lastTickets[0]?.station || "COCINA"}
          batchNumber={lastTickets[0]?.batchNumber || 1}
          onClose={() => { setShowPrintModal(false); setTicketOrderToPrint(null); }}
        />
      )}

      {/* ═══ MODAL COBRO CON SPLIT BILL ═══ */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/30">
              <div>
                <h3 className="font-black text-xl text-stone-900 dark:text-white">Cobrar {tableLabel}</h3>
                <p className="text-sm font-medium text-stone-500 mt-0.5">Elige cómo deseas dividir la cuenta</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {/* Selector de Tipo de División */}
              <div className="flex bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl mb-6 border border-stone-200 dark:border-stone-700 shadow-inner">
                <button
                  onClick={() => setSplitType("single")}
                  className={cn(
                    "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                    splitType === "single" ? "bg-white dark:bg-stone-950 shadow-sm text-stone-900 dark:text-white border border-stone-200/50 dark:border-stone-700/50" : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                  )}
                >
                  Pago Único
                </button>
                <button
                  onClick={() => setSplitType("equal")}
                  className={cn(
                    "flex-1 py-3 text-sm font-bold rounded-xl transition-all",
                    splitType === "equal" ? "bg-white dark:bg-stone-950 shadow-sm text-stone-900 dark:text-white border border-stone-200/50 dark:border-stone-700/50" : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                  )}
                >
                  Dividir (Partes Iguales)
                </button>
              </div>

              {/* Total Card */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 rounded-3xl mb-6 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 text-center">
                  <p className="text-amber-100 font-bold uppercase tracking-widest text-xs mb-1">Total a cobrar</p>
                  <p className="font-mono font-black text-5xl tracking-tight">{settings.currency} {currentTotal.toFixed(2)}</p>
                </div>
              </div>

              {/* Modo: Pago Único */}
              {splitType === "single" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Método de Pago</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m} onClick={() => setPaymentMethod(m)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 py-3 px-1 rounded-2xl border-2 text-[11px] font-bold transition-all",
                          paymentMethod === m
                            ? "bg-stone-900 dark:bg-white border-stone-900 dark:border-white text-white dark:text-stone-900 shadow-md transform scale-[1.02]"
                            : "border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-900"
                        )}
                      >
                        <div className="flex items-center justify-center h-10 w-10">
                          {PAY_IMAGES[m]}
                        </div>
                        <span className="truncate w-full text-center px-1">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modo: Dividir en Partes Iguales */}
              {splitType === "equal" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
                    <p className="font-bold text-stone-700 dark:text-stone-300">¿Entre cuántos dividimos?</p>
                    <div className="flex items-center gap-3 bg-white dark:bg-stone-900 rounded-xl p-1 shadow-sm border border-stone-200 dark:border-stone-700">
                      <button onClick={() => setSplitWays(Math.max(2, splitWays - 1))} className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-black text-xl flex items-center justify-center transition-colors">-</button>
                      <span className="font-black text-xl w-6 text-center text-stone-900 dark:text-white">{splitWays}</span>
                      <button onClick={() => setSplitWays(Math.min(10, splitWays + 1))} className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-black text-xl flex items-center justify-center transition-colors">+</button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">Pagos Fraccionados</h4>
                    {Array.from({ length: splitWays }).map((_, idx) => {
                      const amt = parseFloat((currentTotal / splitWays).toFixed(2));
                      // ajuste del último centavo
                      const isLast = idx === splitWays - 1;
                      const finalAmt = isLast ? parseFloat((currentTotal - (amt * (splitWays - 1))).toFixed(2)) : amt;
                      return (
                        <div key={idx} className="flex items-center gap-4 bg-stone-50 dark:bg-stone-800/30 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
                          <div className="w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center font-black text-stone-500">#{idx + 1}</div>
                          <div className="flex-1">
                            <p className="font-bold text-stone-900 dark:text-white text-lg leading-tight">{settings.currency} {finalAmt.toFixed(2)}</p>
                          </div>
                          <select 
                            value={splitMethods[idx]}
                            onChange={(e) => {
                              const newArr = [...splitMethods];
                              newArr[idx] = e.target.value as PaymentMethod;
                              setSplitMethods(newArr);
                            }}
                            className="bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 dark:text-stone-200 outline-none focus:border-amber-500 shadow-sm min-w-[120px]"
                          >
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAY_ICONS[m]} {m}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cliente */}
              {(paymentMethod === "A crédito" || splitType === "single") && ( // Optional: Add customer to any single order
                <div className="mt-6 border-t border-stone-100 dark:border-stone-800 pt-5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">Asignar Cliente (Opcional)</p>
                  <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:text-stone-100 transition-all"
                  >
                    <option value="">Consumidor Final</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="p-6 bg-stone-50 dark:bg-stone-950/50 border-t border-stone-100 dark:border-stone-800">
              <button onClick={handlePay}
                className="w-full h-14 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 active:scale-[0.98] text-white dark:text-stone-900 font-black text-lg rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-stone-900/10"
              >
                <CheckCircle2 className="w-6 h-6" /> Procesar Pago {splitType === "equal" ? "Dividido" : "Total"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL KDS ═══ */}
      {showKDS && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-stone-200 dark:border-stone-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-stone-900 dark:text-white">Monitor KDS</h2>
                  <p className="text-xs text-stone-400">Cocina & Horno — comandas activas</p>
                </div>
              </div>
              <button onClick={() => setShowKDS(false)} className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"><X className="w-5 h-5" /></button>
            </div>

            {/* Info bar */}
            <div className="flex items-center gap-2.5 mx-5 mt-4 mb-0 px-4 py-2.5 bg-stone-900 rounded-xl border border-amber-500/20 flex-shrink-0">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-stone-300"><span className="text-amber-400 font-bold">Solo comandas confirmadas.</span> Los borradores no aparecen hasta presionar "Enviar a Cocina".</p>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {orders.filter((o) => ["sent","partially_sent","served"].includes(o.status)).length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-40 text-stone-400">
                  <UtensilsCrossed className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-semibold">Sin comandas en cocina</p>
                </div>
              ) : (
                orders.filter((o) => ["sent","partially_sent","served"].includes(o.status)).map((ord) => {
                  const isServed = ord.status === "served";
                  const mins = Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000);
                  const urgent = !isServed && mins >= 15;
                  return (
                    <div key={ord.id} className={cn(
                      "rounded-xl border-2 overflow-hidden flex flex-col transition-all",
                      isServed ? "border-stone-200 dark:border-stone-700 opacity-60" :
                      urgent ? "border-rose-400 dark:border-rose-600" :
                      "border-amber-300 dark:border-amber-700/60"
                    )}>
                      {/* Franja de color */}
                      <div className={cn("h-1.5", isServed ? "bg-emerald-400" : urgent ? "bg-rose-500" : "bg-amber-400")} />
                      {/* Card header */}
                      <div className={cn("flex items-center justify-between px-4 py-3", isServed ? "bg-stone-50 dark:bg-stone-800/40" : urgent ? "bg-rose-50 dark:bg-rose-950/20" : "bg-amber-50/50 dark:bg-amber-950/10")}>
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{ord.type === "salón" ? `Piso ${ord.floor}` : ord.type}</p>
                          <p className="font-black text-2xl text-stone-900 dark:text-white font-mono">{ord.tableNumber}</p>
                        </div>
                        <span className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-black",
                          isServed ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" :
                          urgent ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 animate-pulse" :
                          "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                        )}>
                          {isServed ? "✓ Servido" : `${mins} min`}
                        </span>
                      </div>
                      {/* Ítems */}
                      <div className="px-4 py-3 bg-white dark:bg-stone-900 flex-1 space-y-2.5">
                        {ord.items.filter((i) => i.sentToKitchen).map((item) => (
                          <div key={item.id} className="flex items-start gap-3">
                            <span className="w-7 h-7 flex-shrink-0 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-black flex items-center justify-center">{item.quantity}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight">{item.productName}</p>
                              {item.notes && <p className="text-[11px] text-amber-600 dark:text-amber-400 italic mt-0.5">{item.notes}</p>}
                              <p className="text-[10px] text-stone-400 mt-0.5">{item.station}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Footer card */}
                      {!isServed && (
                        <div className="px-4 pb-4 bg-white dark:bg-stone-900">
                          <button onClick={() => updateOrderStatus(ord.id, "served")}
                            className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Servido
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
