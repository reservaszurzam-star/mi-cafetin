import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  ArrowLeft, Utensils, CheckCircle2, MessageCircle, 
  ShoppingBag, Sparkles, Clock, Flame, Info, Check, 
  Share2, Coffee, ChevronRight, Phone, MapPin, DollarSign,
  Heart, Star, AlertCircle
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { DailyMenuItem, DailyMenuSelection, PaymentMethod } from "../../types";

import { formatMoney, createWhatsAppUrl } from "../../lib/formatters";

interface DailyMenuViewProps {
  onBack: () => void;
  onViewFullMenu?: () => void;
}

const BASE_MENU_PRICE = 16.00;

export default function DailyMenuView({ onBack, onViewFullMenu }: DailyMenuViewProps) {
  const { settings, addSale, dailyMenuItems } = useAppStore();

  // Usar los items del store (o [] si no hay ninguno)
  const starters = dailyMenuItems.filter(i => i.course === 'entrada' && i.available);
  const mains = dailyMenuItems.filter(i => i.course === 'fondo' && i.available);
  const drinks = dailyMenuItems.filter(i => i.course === 'bebida' && i.available);
  const desserts = dailyMenuItems.filter(i => i.course === 'postre' && i.available);

  // Selección activa del cliente
  const [selectedStarter, setSelectedStarter] = useState<DailyMenuItem | null>(starters[0] ?? null);
  const [selectedMain, setSelectedMain] = useState<DailyMenuItem | null>(mains[0] ?? null);
  const [selectedDrink, setSelectedDrink] = useState<DailyMenuItem | null>(drinks[0] ?? null);
  const [selectedDessert, setSelectedDessert] = useState<DailyMenuItem | null>(null);

  // Datos de entrega del cliente
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'salon' | 'para_llevar'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Yape');

  const [isOrdered, setIsOrdered] = useState(false);

  // Fecha de hoy formateada
  const todayFormatted = useMemo(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]}`;
  }, []);

  // Calcular precio total
  const totalPrice = useMemo(() => {
    let total = BASE_MENU_PRICE;
    if (selectedDessert?.extraPrice) total += selectedDessert.extraPrice;
    if (selectedMain?.extraPrice) total += selectedMain.extraPrice;
    return total;
  }, [selectedDessert, selectedMain]);

  // Enviar pedido por WhatsApp
  const handleSendWhatsApp = () => {
    if (!selectedStarter || !selectedMain || !selectedDrink) {
      alert('Por favor selecciona tu Entrada, Plato de Fondo y Bebida para completar el menú.');
      return;
    }

    const phone = settings.paymentDetails?.yape || "987654321";

    const msg = 
      `*PEDIDO DE MENÚ DEL DÍA - ${settings.companyName.toUpperCase()}*\n\n` +
      `*Fecha:* ${todayFormatted}\n` +
      `*Cliente:* ${customerName.trim() || 'Cliente'}\n` +
      `*Teléfono:* ${customerPhone.trim() || 'No registrado'}\n` +
      `*Tipo:* ${deliveryType === 'delivery' ? `Delivery a: ${deliveryAddress || 'Domicilio'}` : deliveryType === 'salon' ? 'Consumo en Salón' : 'Para Llevar / Recojo'}\n\n` +
      `*COMBINACIÓN DE MENÚ:*\n` +
      `1. Entrada: ${selectedStarter.name}\n` +
      `2. Plato de Fondo: ${selectedMain.name}\n` +
      `3. Bebida: ${selectedDrink.name}\n` +
      (selectedDessert ? `4. Postre Extra: ${selectedDessert.name} (+${formatMoney(selectedDessert.extraPrice || 0, settings.currency)})\n` : '') +
      (orderNotes.trim() ? `Notas: ${orderNotes}\n` : '') +
      `\nMétodo de Pago: ${paymentMethod}\n` +
      `TOTAL A PAGAR: ${formatMoney(totalPrice, settings.currency)}\n\n` +
      `Muchas gracias. Quedo atento a la confirmación de la orden.`;

    const whatsappUrl = createWhatsAppUrl(phone, msg);
    window.open(whatsappUrl, '_blank');
    setIsOrdered(true);
  };


  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 font-sans flex flex-col">
      
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-stone-200 shadow-xs px-4 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-xs p-2 rounded-xl hover:bg-stone-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <div className="flex items-center space-x-3">
            <img
              src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/Logo/logo-lomas-grill.png"}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-contain bg-white border border-stone-200 p-0.5 shadow-xs"
              onError={(e) => { e.currentTarget.src = '/Logo/logo-lomas-grill.png'; }}
            />
            <div>
              <h1 className="font-black text-stone-900 text-sm leading-none">{settings.companyName}</h1>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Menú Ejecutivo Diario</span>
            </div>
          </div>

          {onViewFullMenu && (
            <button
              onClick={onViewFullMenu}
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition border border-stone-200"
            >
              Ver Carta Completa
            </button>
          )}
        </div>
      </header>

      {/* ── HERO BANNER DEL MENÚ DEL DÍA ── */}
      <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-8 px-4 relative overflow-hidden shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>{todayFormatted}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Menú Ejecutivo del Día
            </h2>
            <p className="text-sm text-amber-100 font-medium max-w-xl">
              Arma tu almuerzo completo: <strong>Entrada + Plato de Fondo + Refresco Casero</strong> con ingredientes frescos del día.
            </p>
          </div>

          {/* Tarjeta de Precio Fijo */}
          <div className="bg-white text-stone-900 rounded-3xl p-5 shadow-2xl border-4 border-white/30 text-center min-w-[200px] shrink-0 transform hover:scale-105 transition-transform">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
              Precio Completo
            </span>
            <div className="flex items-baseline justify-center gap-1 my-0.5">
              <span className="text-base font-black text-amber-600">{settings.currency}</span>
              <span className="text-4xl font-black font-mono text-stone-900">{BASE_MENU_PRICE.toFixed(2)}</span>
            </div>
            <span className="text-[10px] font-bold text-stone-500 block">Entrada + Fondo + Bebida</span>
          </div>
        </div>
      </section>

      {/* ── PASOS INTERACTIVOS PARA ARMAR EL MENÚ ── */}
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-1 space-y-10">
        
        {/* ═══ PASO 1: ENTRADAS ═══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                1
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">Elige tu Entrada o Sopa</h3>
                <p className="text-xs text-stone-500 font-semibold">Selecciona 1 opción para comenzar tu almuerzo</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {selectedStarter?.name ? selectedStarter.name.split(' ')[0] : 'Pendiente'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {starters.map((item) => {
              const isSelected = selectedStarter?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedStarter(item)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 shadow-xs",
                    isSelected
                      ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                      : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {item.popular && (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 mb-1.5">
                          Favorito
                        </span>
                      )}
                      <h4 className="font-black text-sm text-stone-900 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-amber-500 text-white shadow-sm" : "border-2 border-stone-300 bg-white"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-500">
                    <span>Incluido en el menú</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ PASO 2: PLATOS DE FONDO (SEGUNDOS) ═══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                2
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">Elige tu Plato de Fondo</h3>
                <p className="text-xs text-stone-500 font-semibold">Nuestra selección especial de carnes, pastas y criollos</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {selectedMain?.name ? selectedMain.name.split(' ')[0] : 'Pendiente'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {mains.map((item) => {
              const isSelected = selectedMain?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedMain(item)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 shadow-xs",
                    isSelected
                      ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                      : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {item.popular && (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 mb-1.5">
                          Más Pedido
                        </span>
                      )}
                      <h4 className="font-black text-sm text-stone-900 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-amber-500 text-white shadow-sm" : "border-2 border-stone-300 bg-white"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-500">
                    <span>Plato Principal</span>
                    {item.extraPrice ? (
                      <span className="text-amber-800 font-mono font-bold">+{settings.currency} {item.extraPrice.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">Incluido</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ PASO 3: BEBIDAS DEL DÍA ═══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                3
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">Elige tu Bebida o Refresco</h3>
                <p className="text-xs text-stone-500 font-semibold">Refrescos naturales de fruta fresca o gaseosa</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {selectedDrink?.name ? selectedDrink.name.split(' ')[0] : 'Pendiente'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {drinks.map((item) => {
              const isSelected = selectedDrink?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedDrink(item)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 shadow-xs",
                    isSelected
                      ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                      : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-stone-900 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-amber-500 text-white shadow-sm" : "border-2 border-stone-300 bg-white"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 text-[11px] font-bold text-emerald-600">
                    Incluido
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ PASO 4: POSTRE O ADICIONAL (OPCIONAL) ═══ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-stone-300 text-stone-700 flex items-center justify-center font-black text-sm">
                4
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">¿Deseas agregar un Postre? (Opcional)</h3>
                <p className="text-xs text-stone-500 font-semibold">Endulza tu almuerzo con nuestros postres criollos</p>
              </div>
            </div>
            {selectedDessert && (
              <button
                onClick={() => setSelectedDessert(null)}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Quitar postre
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {desserts.map((item) => {
              const isSelected = selectedDessert?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedDessert(isSelected ? null : item)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 shadow-xs",
                    isSelected
                      ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                      : "bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-stone-900 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-stone-500 font-medium mt-1">{item.description}</p>
                    </div>

                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "bg-amber-500 text-white shadow-sm" : "border-2 border-stone-300 bg-white"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-stone-500">Adicional</span>
                    <span className="font-mono text-amber-800">+{settings.currency} {item.extraPrice?.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ RESUMEN Y ENVÍO DEL PEDIDO ═══ */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-lg space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              Resumen de tu Menú
            </h3>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">Verifica tu combinación antes de enviar el pedido</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Lista de Elecciones */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex justify-between items-start text-xs border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">Entrada:</span>
                <span className="font-black text-stone-900 text-right">{selectedStarter?.name || 'No seleccionada'}</span>
              </div>
              <div className="flex justify-between items-start text-xs border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">Segundo:</span>
                <span className="font-black text-stone-900 text-right">{selectedMain?.name || 'No seleccionado'}</span>
              </div>
              <div className="flex justify-between items-start text-xs border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-bold">Bebida:</span>
                <span className="font-black text-stone-900 text-right">{selectedDrink?.name || 'No seleccionada'}</span>
              </div>
              {selectedDessert && (
                <div className="flex justify-between items-start text-xs border-b border-stone-200 pb-2">
                  <span className="text-stone-500 font-bold">Postre Extra:</span>
                  <span className="font-black text-stone-900 text-right">
                    {selectedDessert.name} (+{settings.currency} {selectedDessert.extraPrice?.toFixed(2)})
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center text-stone-900">
                <span className="font-black text-sm uppercase">Total a Pagar:</span>
                <span className="font-mono font-black text-2xl text-amber-600">
                  {settings.currency} {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Datos de Entrega */}
            <div className="space-y-3.5">
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  onClick={() => setDeliveryType('delivery')}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition", deliveryType === 'delivery' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600")}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setDeliveryType('salon')}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition", deliveryType === 'salon' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600")}
                >
                  En Salón
                </button>
                <button
                  onClick={() => setDeliveryType('para_llevar')}
                  className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition", deliveryType === 'para_llevar' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600")}
                >
                  Para Llevar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tu Nombre..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Teléfono / WhatsApp..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                />
              </div>

              {deliveryType === 'delivery' && (
                <input
                  type="text"
                  placeholder="Dirección exacta de entrega (ej: Av. Gran Chimú 1420)..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                />
              )}

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-stone-600 shrink-0">Pago con:</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="flex-1 bg-stone-50 border border-stone-300 rounded-xl p-2 text-xs font-bold text-stone-900 outline-none"
                >
                  <option value="Yape">Yape (987-654-321)</option>
                  <option value="Plin">Plin (987-654-321)</option>
                  <option value="Efectivo">Efectivo contra entrega</option>
                  <option value="Tarjeta">Tarjeta (POS)</option>
                </select>
              </div>

              <button
                onClick={handleSendWhatsApp}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Pedir Menú por WhatsApp</span>
              </button>
            </div>

          </div>
        </section>

      </main>

    </div>
  );
}
