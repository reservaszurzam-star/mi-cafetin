import React, { useState, useMemo } from "react";
import { useAppStore } from "../../hooks/StoreContext";
import { Product, PaymentMethod, ProductCategory, RestaurantOrder, OrderItem } from "../../types";
import { PisoSelector } from "./PisoSelector";
import { ThermalTicket, TicketType } from "../tickets/ThermalTicket";
import { POSProductCatalog } from "./POSProductCatalog";
import { POSCartSidebar } from "./POSCartSidebar";
import { POSCheckoutModal } from "./POSCheckoutModal";
import { POSDeliveryModal } from "./POSDeliveryModal";
import { POSSendKitchenModal } from "./POSSendKitchenModal";
import { Utensils, ClipboardList } from "lucide-react";
import { formatMoney } from "../../lib/formatters";

export default function POSView() {
  const {
    products, settings, customers, orders,
    saveOrderDraft, sendOrderToKitchen, closeOrderAndPay,
    updateOrder, printers, updateOrderStatus,
    currentUser
  } = useAppStore();

  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [selectedTable, setSelectedTable] = useState<string>("101");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [isSendKitchenModalOpen, setIsSendKitchenModalOpen] = useState(false);

  // Modal Impresión Térmica
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [ticketTypeToPrint, setTicketTypeToPrint] = useState<TicketType>("comanda_cocina");
  const [ticketOrderToPrint, setTicketOrderToPrint] = useState<RestaurantOrder | null>(null);
  const [lastBatchNumber, setLastBatchNumber] = useState(1);

  const activeOrder = useMemo(() => orders.find((o) => o.tableNumber === selectedTable), [orders, selectedTable]);
  const currentItems = activeOrder?.items ?? [];
  const currentTotal = currentItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItemCount = currentItems.reduce((s, i) => s + i.quantity, 0);

  // ── Handlers de Carrito ──
  const handleAddProduct = (product: Product) => {
    let orderToUpdate = activeOrder;
    if (!orderToUpdate) {
      orderToUpdate = {
        id: `ord-${selectedTable.replace(/\s+/g, '_')}-${Date.now().toString().slice(-4)}`,
        type: selectedTable.startsWith("D-") ? "delivery" : selectedTable.startsWith("Venta") ? "venta_libre" : "salón",
        floor: (activeFloor as 1|2|3|4) || 1,
        tableNumber: selectedTable,
        status: "draft",
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        waiterName: currentUser.name || "Mesero",
      };
      saveOrderDraft(orderToUpdate);
    }

    const existingIndex = orderToUpdate.items.findIndex(
      (item) => item.productId === product.id && !item.sentToKitchen
    );

    let newItems = [...orderToUpdate.items];
    if (existingIndex >= 0) {
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + 1,
      };
    } else {
      newItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        station: product.station,
        sentToKitchen: false,
      });
    }

    const newTotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
    updateOrder(orderToUpdate.id, {
      items: newItems,
      total: newTotal,
      status: orderToUpdate.status === "served" || orderToUpdate.status === "sent" ? "partially_sent" : "draft",
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    if (!activeOrder) return;
    const existingIndex = activeOrder.items.findIndex(
      (i) => i.productId === productId && !i.sentToKitchen
    );
    if (existingIndex < 0) return;

    let newItems = [...activeOrder.items];
    const newQty = newItems[existingIndex].quantity + delta;

    if (newQty <= 0) {
      newItems = newItems.filter((_, idx) => idx !== existingIndex);
    } else {
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQty };
    }

    const newTotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
    updateOrder(activeOrder.id, { items: newItems, total: newTotal });
  };

  const handleRemoveItem = (productId: string) => {
    if (!activeOrder) return;
    const newItems = activeOrder.items.filter((i) => i.productId !== productId || i.sentToKitchen);
    const newTotal = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
    updateOrder(activeOrder.id, { items: newItems, total: newTotal });
  };

  const handleSaveNote = (productId: string, note: string) => {
    if (!activeOrder) return;
    const newItems = activeOrder.items.map((i) =>
      i.productId === productId && !i.sentToKitchen ? { ...i, notes: note.trim() || undefined } : i
    );
    updateOrder(activeOrder.id, { items: newItems });
  };

  const handleSaveCustomerName = (newName: string) => {
    const trimmed = newName.trim();
    if (activeOrder) {
      updateOrder(activeOrder.id, { dinerName: trimmed || undefined });
    } else if (trimmed) {
      saveOrderDraft({
        id: `ord-${selectedTable.replace(/\s+/g, '_')}-${Date.now().toString().slice(-4)}`,
        type: selectedTable.startsWith("D-") ? "delivery" : "salón",
        floor: (activeFloor as 1|2|3|4) || 1,
        tableNumber: selectedTable,
        dinerName: trimmed,
        status: "draft",
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        waiterName: currentUser.name || "Mesero",
      });
    }
  };

  const handleOpenSendKitchenModal = () => {
    if (!activeOrder || activeOrder.items.length === 0) return;
    setIsSendKitchenModalOpen(true);
  };

  const handleConfirmSendToKitchen = (options: { targetStation: string; printTicket: boolean }) => {
    if (!activeOrder || activeOrder.items.length === 0) return;

    const newBatch = (activeOrder.items.reduce((max, i) => Math.max(max, i.batchNumber || 0), 0)) + 1;
    setLastBatchNumber(newBatch);

    sendOrderToKitchen(activeOrder.id, options.targetStation);

    if (options.printTicket) {
      setTicketOrderToPrint(activeOrder);
      setTicketTypeToPrint("comanda_cocina");
      setShowPrintModal(true);
    }
  };

  const handlePrintPreBill = () => {
    if (!activeOrder) return;
    setTicketOrderToPrint(activeOrder);
    setTicketTypeToPrint("boleta_cliente");
    setShowPrintModal(true);
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
    if (!activeOrder) return;

    let payments: { method: PaymentMethod; amount: number }[] = [];
    if (details.splitType === 'equal' && details.splitWays > 1 && details.splitMethods?.length > 0) {
      const splitAmount = Number((activeOrder.total / details.splitWays).toFixed(2));
      payments = details.splitMethods.slice(0, details.splitWays).map((m) => ({ method: m, amount: splitAmount }));
    } else {
      payments = [{ method: details.paymentMethod, amount: activeOrder.total }];
    }

    closeOrderAndPay(
      activeOrder.id,
      payments,
      activeOrder.customerId,
      details.docType,
      details.docNumber
    );

    if (details.printTicket) {
      setTicketOrderToPrint({
        ...activeOrder,
        customerName: details.customerName || activeOrder.dinerName,
        customerDocNumber: details.docNumber,
      });
      setTicketTypeToPrint("boleta_venta");
      setShowPrintModal(true);
    }

    setIsCheckoutOpen(false);
  };

  const handleAddCustomTable = (clientName: string, targetTable?: string) => {
    const finalTable = targetTable || `Cliente: ${clientName}`;
    saveOrderDraft({
      id: `ord-${finalTable.replace(/\s+/g, '_')}-${Date.now().toString().slice(-4)}`,
      type: "salón",
      floor: (activeFloor as 1|2|3|4) || 1,
      tableNumber: finalTable,
      customTableName: clientName,
      dinerName: clientName,
      status: "draft",
      items: [],
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      waiterName: currentUser.name || "Mesero",
    });
    setSelectedTable(finalTable);
  };

  const handleQuickDirectSale = () => {
    const saleNum = Math.floor(100 + Math.random() * 900);
    const tbl = `Venta #${saleNum}`;
    saveOrderDraft({
      id: `ord-direct-${Date.now()}`,
      type: "venta_libre",
      floor: (activeFloor as 1|2|3|4) || 1,
      tableNumber: tbl,
      customTableName: tbl,
      dinerName: "Venta Rápida / Mostrador",
      status: "draft",
      items: [],
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      waiterName: currentUser.name || "Caja",
    });
    setSelectedTable(tbl);
  };

  return (
    <div className="space-y-4">
      
      {/* ── SELECTOR DE PISOS Y MAPA DE MESAS ── */}
      <PisoSelector
        activeFloor={activeFloor}
        onSelectFloor={setActiveFloor}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        orders={orders}
        currency={settings.currency}
        onAddCustomTable={handleAddCustomTable}
        onQuickSale={handleQuickDirectSale}
      />

      {/* ── SELECTOR MÓVIL: CATÁLOGO vs COMANDA ── */}
      <div className="flex lg:hidden bg-stone-200/80 p-1 rounded-2xl gap-1 border border-stone-200/50 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'catalog'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-amber-500" />
          <span>1. Elegir Platos</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition relative ${
            mobileTab === 'cart'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
          <span>2. Comanda ({totalItemCount})</span>
          {totalItemCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ── CUERPO PRINCIPAL DEL POS: CATÁLOGO + COMANDA ── */}
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)] min-h-[580px]">
        
        {/* Catálogo Táctil */}
        <div className={`flex-1 flex flex-col min-h-0 ${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
          <POSProductCatalog
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddProduct={handleAddProduct}
            settings={settings}
            activeOrder={activeOrder || null}
          />
        </div>

        {/* Barra Lateral de Comanda / Carrito */}
        <div className={`w-full lg:w-96 flex flex-col min-h-0 ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          <POSCartSidebar
            activeOrder={activeOrder || null}
            selectedTable={selectedTable}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onSaveNote={handleSaveNote}
            onSendToKitchen={handleOpenSendKitchenModal}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onPrintPreBill={handlePrintPreBill}
            onSaveCustomerName={handleSaveCustomerName}
            onBackToCatalog={() => setMobileTab('catalog')}
            settings={settings}
          />
        </div>

      </div>

      {/* ── BOTÓN FLOTANTE EN MÓVIL PARA REVISAR COMANDA RÁPIDO ── */}
      {mobileTab === 'catalog' && totalItemCount > 0 && (
        <div className="fixed bottom-16 left-3 right-3 z-40 lg:hidden animate-in slide-in-from-bottom-2">
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="w-full bg-stone-900 hover:bg-black text-white rounded-2xl p-3.5 flex items-center justify-between shadow-2xl border border-stone-800 active:scale-95 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-xs">
                {totalItemCount}
              </div>
              <div className="text-left">
                <p className="font-black text-xs text-white">Mesa {selectedTable}</p>
                <p className="text-[10px] text-amber-300 font-bold">{currentItems.length} tipos de platos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-400 text-sm">
                {formatMoney(currentTotal, settings.currency)}
              </span>
              <span className="text-xs font-black bg-amber-500 text-stone-950 px-3 py-1.5 rounded-xl shadow-xs">
                Ver Comanda →
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── MODAL SELECCIÓN DE PANTALLA Y ENVÍO A COCINA ── */}
      <POSSendKitchenModal
        isOpen={isSendKitchenModalOpen}
        onClose={() => setIsSendKitchenModalOpen(false)}
        order={activeOrder || null}
        onConfirmSend={handleConfirmSendToKitchen}
      />

      {/* ── MODAL COBRO AVANZADO ── */}
      <POSCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        tableLabel={selectedTable}
        total={currentTotal}
        settings={settings}
        customers={customers}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* ── MODAL NUEVO DELIVERY RÁPIDO ── */}
      <POSDeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onConfirm={(delData) => {
          const tableNum = `D-${Math.floor(10 + Math.random() * 90)}`;
          saveOrderDraft({
            id: `ord-${tableNum}-${Date.now().toString().slice(-4)}`,
            type: "delivery",
            floor: 1,
            tableNumber: tableNum,
            dinerName: delData.customerName,
            customerPhone: delData.phone,
            deliveryAddress: delData.address,
            status: "draft",
            items: [],
            total: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            waiterName: currentUser.name || "Caja",
          });
          setSelectedTable(tableNum);
          setShowDeliveryModal(false);
        }}
      />

      {/* ── MODAL IMPRESIÓN TÉRMICA ── */}
      {(showPrintModal || ticketOrderToPrint) && (
        <ThermalTicket
          order={ticketOrderToPrint || activeOrder || {
            id: "t",
            type: "salón",
            floor: activeFloor as 1|2|3|4,
            tableNumber: selectedTable,
            status: "sent",
            items: currentItems,
            total: currentTotal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            waiterName: currentUser.name || "Mesero",
          }}
          ticketType={ticketTypeToPrint}
          batchNumber={lastBatchNumber}
          showQR={settings.showPaymentQR ?? true}
          onClose={() => {
            setShowPrintModal(false);
            setTicketOrderToPrint(null);
          }}
        />
      )}

    </div>
  );
}
