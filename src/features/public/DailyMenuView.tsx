import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import {
  MessageCircle, Check, ChevronLeft,
  Utensils, Coffee, Cake, Soup, Sparkles,
  User, Phone, MapPin, ArrowRight, Info,
  ChefHat, Flame, Waves, Star, Clock, ShoppingBag,
  ExternalLink, Share2, Copy, Plus, Minus, X, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from "../../lib/utils";
import { DailyMenuItem, DailyMenuCourse } from "../../types";
import { formatMoney, createWhatsAppUrl } from "../../lib/formatters";

interface DailyMenuViewProps {
  onBack?: () => void;
  onViewFullMenu?: () => void;
}

const BASE_PRICE = 16.00;

type DeliveryType = 'recojo' | 'salon' | 'delivery';
type PayMethod = 'Yape' | 'Plin' | 'Efectivo' | 'Tarjeta';

export default function DailyMenuView({ onBack, onViewFullMenu }: DailyMenuViewProps) {
  const { settings, dailyMenuItems, orders, saveOrderDraft } = useAppStore();

  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const tenantKey = isParadero ? 'paradero' : 'laslomas';

  // Configuración de Colores y Estilos según Sede
  const theme = useMemo(() => {
    if (isParadero) {
      return {
        name: 'Paradero 104',
        subtitle: 'Barra Cevichera & Mariscos',
        heroBadge: '🌊 MENÚ MARINO DEL DÍA',
        heroTitle: 'Almuerzo Marino Ejecutivo',
        heroDesc: 'Chilcano o Causa + Plato Marino + Refresco Natural',
        heroBg: 'from-[#0a192f] via-[#0f2d4a] to-[#1a4a6e]',
        accent: '#0284c7', // sky-600
        accentLight: 'bg-sky-50 text-sky-800 border-sky-200',
        accentBtn: 'bg-sky-600 hover:bg-sky-700 text-white',
        borderSelected: 'border-sky-500 ring-2 ring-sky-400/30 bg-sky-50/40',
        badgeSelected: 'bg-sky-600 text-white',
        stepperBtn: 'bg-sky-600 text-white hover:bg-sky-700',
        logo: '/Logo/logo-paradero-104.png',
        phone: settings.whatsappOrdersPhone || settings.phone || '51987654321',
      };
    }
    return {
      name: 'Las Lomas Grill',
      subtitle: 'Brasas, Parrillas & Sabor Criollo',
      heroBadge: '🔥 MENÚ EJECUTIVO DEL DÍA',
      heroTitle: 'Almuerzo Criollo & Brasas',
      heroDesc: 'Sopa o Entrada + Plato de Fondo + Bebida',
      heroBg: 'from-[#1c130c] via-[#2d1b10] to-[#451e08]',
      accent: '#f59e0b', // amber-500
      accentLight: 'bg-amber-50 text-amber-900 border-amber-200',
      accentBtn: 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black',
      borderSelected: 'border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/40',
      badgeSelected: 'bg-amber-500 text-stone-950 font-black',
      stepperBtn: 'bg-amber-500 text-stone-950 font-black hover:bg-amber-600',
      logo: '/Logo/logo-lomas-grill.png',
      phone: settings.whatsappOrdersPhone || settings.phone || '51995881303',
    };
  }, [isParadero, settings]);

  const starters = useMemo(() => dailyMenuItems.filter(i => i.course === 'entrada' && i.available), [dailyMenuItems]);
  const mains    = useMemo(() => dailyMenuItems.filter(i => i.course === 'fondo'   && i.available), [dailyMenuItems]);
  const drinks   = useMemo(() => dailyMenuItems.filter(i => i.course === 'bebida'  && i.available), [dailyMenuItems]);
  const desserts = useMemo(() => dailyMenuItems.filter(i => i.course === 'postre'  && i.available), [dailyMenuItems]);

  // Estado flexible de cantidades: Record<itemId, number>
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (mains.length > 0 && mains[0]) initial[mains[0].id] = 1;
    if (starters.length > 0 && starters[0]) initial[starters[0].id] = 1;
    if (drinks.length > 0 && drinks[0]) initial[drinks[0].id] = 1;
    return initial;
  });

  const getQty = (id: string) => quantities[id] || 0;

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    });
  };

  const clearCourse = (course: DailyMenuCourse) => {
    setQuantities(prev => {
      const updated = { ...prev };
      dailyMenuItems.filter(i => i.course === course).forEach(i => {
        delete updated[i.id];
      });
      return updated;
    });
  };

  const [customerName,    setCustomerName]    = useState('');
  const [customerPhone,   setCustomerPhone]   = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType,    setDeliveryType]    = useState<DeliveryType>('delivery');
  const [payMethod,       setPayMethod]       = useState<PayMethod>('Yape');
  const [orderNotes,      setOrderNotes]      = useState('');
  const [showCheckout,    setShowCheckout]    = useState(false);
  const [copiedLink,      setCopiedLink]      = useState(false);

  const todayFormatted = useMemo(() => {
    const d = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    return `${d[now.getDay()]}, ${now.getDate()} de ${m[now.getMonth()]}`;
  }, []);

  // Conteos por categoría
  const totalMains    = useMemo(() => mains.reduce((acc, i) => acc + getQty(i.id), 0), [mains, quantities]);
  const totalStarters = useMemo(() => starters.reduce((acc, i) => acc + getQty(i.id), 0), [starters, quantities]);
  const totalDrinks   = useMemo(() => drinks.reduce((acc, i) => acc + getQty(i.id), 0), [drinks, quantities]);
  const totalDesserts = useMemo(() => desserts.reduce((acc, i) => acc + getQty(i.id), 0), [desserts, quantities]);
  const totalItems    = totalMains + totalStarters + totalDrinks + totalDesserts;

  // Cálculo inteligente del total
  const totalPrice = useMemo(() => {
    if (totalMains > 0) {
      let total = totalMains * BASE_PRICE;
      // Adicionales por platos de fondo premium
      mains.forEach(m => {
        const q = getQty(m.id);
        if (q > 0 && m.extraPrice) total += q * m.extraPrice;
      });
      // Si el cliente pide más entradas que platos de fondo, las extras se cobran a S/ 5.00
      if (totalStarters > totalMains) {
        total += (totalStarters - totalMains) * 5.00;
      }
      // Si pide más bebidas que fondos, las extras se cobran a S/ 3.00
      if (totalDrinks > totalMains) {
        total += (totalDrinks - totalMains) * 3.00;
      }
      // Postres
      desserts.forEach(d => {
        const q = getQty(d.id);
        if (q > 0) total += q * (d.extraPrice ?? 3.50);
      });
      return total;
    } else {
      // Pedido individual a la carta si no escogió fondo
      let total = 0;
      starters.forEach(s => { total += getQty(s.id) * (s.extraPrice ?? 6.00); });
      drinks.forEach(d => { total += getQty(d.id) * (d.extraPrice ?? 3.00); });
      desserts.forEach(d => { total += getQty(d.id) * (d.extraPrice ?? 3.50); });
      return total;
    }
  }, [quantities, totalMains, totalStarters, totalDrinks, totalDesserts, mains, starters, drinks, desserts]);

  // Lista detallada de ítems seleccionados para resumen
  const selectedItemsList = useMemo(() => {
    const list: { course: DailyMenuCourse; item: DailyMenuItem; qty: number; courseLabel: string }[] = [];
    
    mains.forEach(item => {
      const q = getQty(item.id);
      if (q > 0) list.push({ course: 'fondo', item, qty: q, courseLabel: '🍲 Fondo' });
    });

    starters.forEach(item => {
      const q = getQty(item.id);
      if (q > 0) list.push({ course: 'entrada', item, qty: q, courseLabel: '🥣 Entrada' });
    });

    drinks.forEach(item => {
      const q = getQty(item.id);
      if (q > 0) list.push({ course: 'bebida', item, qty: q, courseLabel: '🥤 Bebida' });
    });

    desserts.forEach(item => {
      const q = getQty(item.id);
      if (q > 0) list.push({ course: 'postre', item, qty: q, courseLabel: '🍰 Postre' });
    });

    return list;
  }, [quantities, mains, starters, drinks, desserts]);

  const isReady = totalItems > 0;

  const handleCopyMenuLink = () => {
    const url = `${window.location.origin}/menu/${tenantKey}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSend = () => {
    if (!isReady || !customerName.trim()) return;

    // Crear ítems del pedido para la comanda interna
    const orderItems: any[] = [];
    selectedItemsList.forEach(({ item, qty, course }) => {
      let unitPrice = 0;
      if (course === 'fondo') unitPrice = BASE_PRICE + (item.extraPrice || 0);
      else if (course === 'postre') unitPrice = item.extraPrice || 3.50;

      orderItems.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${item.id}`,
        productId: item.id,
        productName: `[Menú] ${item.name}`,
        quantity: qty,
        price: unitPrice,
        station: course === 'bebida' ? 'Barra' : 'Cocina',
        sentToKitchen: false,
        batchNumber: 1,
      });
    });

    const dOrders = orders.filter(o => o.tableNumber.startsWith("D-") || o.type === "delivery");
    const nums = dOrders.map(o => parseInt(o.tableNumber.split("-")[1] || "0")).filter(n => !isNaN(n));
    const nextNum = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
    const tableNumber = `D-${nextNum.toString().padStart(2, "0")}`;

    saveOrderDraft({
      id: crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`,
      type: deliveryType === 'salon' ? 'salón' : 'delivery',
      floor: 0,
      tableNumber,
      dinerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined,
      status: 'draft',
      items: orderItems,
      total: totalPrice,
      notes: `Pedido Menú del Día • Pago: ${payMethod} ${orderNotes ? `• Obs: ${orderNotes}` : ''}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      waiterName: 'Pedido Menú Web',
    });

    const modalidad =
      deliveryType === 'delivery' ? `🛵 Delivery a: ${deliveryAddress}` :
      deliveryType === 'salon'    ? '🍽️ Consumo en Salón' : '🥡 Para Llevar (Recojo en local)';

    // Construcción limpia del mensaje de WhatsApp
    const lines = [
      `🍽️ *PEDIDO MENÚ DEL DÍA — ${theme.name.toUpperCase()}*`,
      `📅 *Fecha:* ${todayFormatted}`,
      ``,
      `👤 *Cliente:* ${customerName}`,
      customerPhone ? `📱 *Teléfono:* ${customerPhone}` : '',
      `📦 *Modalidad:* ${modalidad}`,
      `💳 *Método de Pago:* ${payMethod}`,
      orderNotes ? `📝 *Observaciones:* ${orderNotes}` : '',
      ``,
      `🍽️ *DETALLE DE PLATOS ESCOGIDOS:*`,
    ];

    if (totalMains > 0) {
      lines.push(`🍲 *Platos de Fondo (${totalMains}):*`);
      mains.forEach(m => {
        const q = getQty(m.id);
        if (q > 0) lines.push(`  • ${q}x ${m.name}${m.extraPrice ? ` (+S/ ${m.extraPrice.toFixed(2)})` : ''}`);
      });
    } else {
      lines.push(`🍲 *Platos de Fondo:* (Sin plato de fondo)`);
    }

    if (totalStarters > 0) {
      lines.push(`🥣 *Entradas / Sopas (${totalStarters}):*`);
      starters.forEach(s => {
        const q = getQty(s.id);
        if (q > 0) lines.push(`  • ${q}x ${s.name}`);
      });
    } else {
      lines.push(`🥣 *Entradas:* (Sin entrada)`);
    }

    if (totalDrinks > 0) {
      lines.push(`🥤 *Bebidas (${totalDrinks}):*`);
      drinks.forEach(d => {
        const q = getQty(d.id);
        if (q > 0) lines.push(`  • ${q}x ${d.name}`);
      });
    } else {
      lines.push(`🥤 *Bebidas:* (Sin bebida)`);
    }

    if (totalDesserts > 0) {
      lines.push(`🍰 *Postres (${totalDesserts}):*`);
      desserts.forEach(d => {
        const q = getQty(d.id);
        if (q > 0) lines.push(`  • ${q}x ${d.name} (+S/ ${(d.extraPrice ?? 3.50).toFixed(2)})`);
      });
    }

    lines.push(``);
    lines.push(`💰 *TOTAL A PAGAR: ${settings.currency} ${totalPrice.toFixed(2)}*`);
    lines.push(``);
    lines.push(`_Por favor confirmar la recepción de mi pedido. ¡Muchas gracias!_`);

    const msg = lines.filter(l => l !== '').join('\n');
    const waUrl = createWhatsAppUrl(theme.phone, msg);
    window.open(waUrl, '_blank');
    setShowCheckout(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-stone-900 font-sans flex flex-col selection:bg-amber-500 selection:text-white">

      {/* ── BARRA SUPERIOR ADMIN (Si viene desde el panel) ── */}
      {onBack && (
        <div className="bg-stone-950 text-stone-300 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Vista Pública de Clientes · <strong>{theme.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMenuLink}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
            </button>
            <button
              onClick={onBack}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER PÚBLICO ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={theme.logo}
              alt={theme.name}
              className="w-10 h-10 rounded-2xl object-contain bg-white border border-stone-200 p-1 shadow-xs shrink-0"
              onError={(e) => { e.currentTarget.src = '/LOGO OFICIAL.png'; }}
            />
            <div className="min-w-0">
              <h1 className="font-black text-sm sm:text-base text-stone-900 leading-none truncate">
                {theme.name}
              </h1>
              <p className="text-[11px] font-bold text-stone-500 truncate mt-0.5">
                {theme.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyMenuLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
              title="Compartir Menú"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Link Copiado!' : 'Compartir'}</span>
            </button>

            {onViewFullMenu && (
              <button
                onClick={onViewFullMenu}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-stone-900 hover:bg-stone-800 text-white transition flex items-center gap-1 shadow-xs"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Ver Carta Completa</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${theme.heroBg} text-white px-4 py-8 sm:py-10 shadow-inner`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-white/10 backdrop-blur-md border border-white/15 text-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Almuerzo de Hoy · {todayFormatted}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {theme.heroTitle}
          </h2>

          <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-md mx-auto">
            {theme.heroDesc}
          </p>

          <div className="pt-2">
            <div className="inline-flex items-baseline gap-1.5 bg-white/15 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 shadow-lg">
              <span className="text-xs font-black uppercase text-amber-300 tracking-wider">Menú Ejecutivo Completo</span>
              <span className="text-2xl sm:text-3xl font-black text-white ml-1">S/ {BASE_PRICE.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-stone-300 font-medium mt-1.5">
              💡 Puedes armar varios menús, pedir varios platos o prescindir de algún tiempo según tu preferencia.
            </p>
          </div>
        </div>
      </section>

      {/* ── BARRA RESUMEN PASOS ── */}
      <nav className="sticky top-[57px] z-20 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-2.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { step: '1', label: 'Fondos', count: totalMains, color: 'bg-amber-500 text-stone-950' },
            { step: '2', label: 'Entradas', count: totalStarters, color: 'bg-emerald-600 text-white' },
            { step: '3', label: 'Bebidas', count: totalDrinks, color: 'bg-sky-600 text-white' },
            { step: '4', label: 'Postres', count: totalDesserts, color: 'bg-rose-500 text-white' },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
                s.count > 0 ? "bg-white border-stone-300 shadow-2xs text-stone-900" : "bg-stone-50 border-stone-200 text-stone-400"
              )}
            >
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black",
                s.count > 0 ? s.color : "bg-stone-200 text-stone-600"
              )}>
                {s.count > 0 ? s.count : s.step}
              </span>
              <span>{s.label}</span>
              {s.count > 0 && <span className="text-[10px] text-stone-500 font-semibold">({s.count})</span>}
            </div>
          ))}
        </div>
      </nav>

      {/* ── CONTENIDO PRINCIPAL: SECCIONES EN 2 COLUMNAS ── */}
      <main className="max-w-4xl mx-auto w-full px-4 py-6 space-y-8 flex-1 pb-44">

        {dailyMenuItems.length === 0 && (
          <div className="py-16 text-center space-y-3 bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center">
              <Info className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-black text-stone-900 text-lg">El menú de hoy se está preparando</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Nuestro chef está terminando de alistar los platos frescos del día. Puedes consultar la carta completa mientras tanto.
            </p>
            {onViewFullMenu && (
              <button
                onClick={onViewFullMenu}
                className="mt-3 px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-black rounded-xl transition"
              >
                Ver Carta Completa
              </button>
            )}
          </div>
        )}

        {/* ── 1. PLATOS DE FONDO (EL PLATO PRINCIPAL) ── */}
        {mains.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-stone-900">Platos de Fondo</h3>
                  <p className="text-[11px] text-stone-500 font-medium">Elige la cantidad de platos de fondo que deseas</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalMains > 0 ? (
                  <button
                    onClick={() => clearCourse('fondo')}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition"
                    title="No deseo plato de fondo"
                  >
                    Omitir Fondo
                  </button>
                ) : (
                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Omitido
                  </span>
                )}
              </div>
            </div>

            {/* Grilla 2 Columnas */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {mains.map((item) => {
                const qty = getQty(item.id);
                const isSelected = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative rounded-2xl p-3 sm:p-4 text-left transition-all duration-200 flex flex-col justify-between gap-2.5 border-2 shadow-2xs",
                      isSelected
                        ? `${theme.borderSelected} shadow-md`
                        : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs"
                    )}
                  >
                    {/* Badge de favorito o contador */}
                    <div className="flex items-start justify-between gap-1">
                      {item.popular ? (
                        <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200">
                          🔥 Especial
                        </span>
                      ) : <div />}

                      {qty > 0 && (
                        <span className="text-[11px] font-black bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full shadow-2xs">
                          {qty}x
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="cursor-pointer" onClick={() => updateQty(item.id, 1)}>
                      <p className="font-black text-xs sm:text-sm text-stone-900 leading-snug line-clamp-2 min-h-[2.2rem]">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Barra inferior: Precio + Stepper de Cantidad */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 w-full mt-auto">
                      <div>
                        <span className="text-[10px] font-black text-stone-700 block leading-none">
                          {item.extraPrice ? `+S/ ${item.extraPrice.toFixed(2)}` : 'Incluido'}
                        </span>
                      </div>

                      {/* Stepper de Cantidad */}
                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-stone-900 text-white rounded-xl p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-stone-800 hover:bg-stone-700 text-white transition active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs min-w-[14px] text-center text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-stone-800 hover:bg-stone-700 text-white transition active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition shadow-2xs font-black"
                          title="Agregar plato"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 2. ENTRADAS & SOPAS ── */}
        {starters.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-stone-900">Entradas o Sopas</h3>
                  <p className="text-[11px] text-stone-500 font-medium">Incluido con cada menú (puedes elegir varias o ninguna)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalStarters > 0 ? (
                  <button
                    onClick={() => clearCourse('entrada')}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition"
                    title="No deseo entrada"
                  >
                    Omitir Entrada
                  </button>
                ) : (
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Omitido
                  </span>
                )}
              </div>
            </div>

            {/* Grilla 2 Columnas */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {starters.map((item) => {
                const qty = getQty(item.id);
                const isSelected = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative rounded-2xl p-3 sm:p-4 text-left transition-all duration-200 flex flex-col justify-between gap-2.5 border-2 shadow-2xs",
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-400/30 bg-emerald-50/40 shadow-md"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      {item.popular ? (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          ⭐ Favorito
                        </span>
                      ) : <div />}

                      {qty > 0 && (
                        <span className="text-[11px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                          {qty}x
                        </span>
                      )}
                    </div>

                    <div className="cursor-pointer" onClick={() => updateQty(item.id, 1)}>
                      <p className="font-black text-xs sm:text-sm text-stone-900 leading-snug line-clamp-2 min-h-[2.2rem]">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-[10px] text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 w-full mt-auto">
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                        Incluido
                      </span>

                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-emerald-700 text-white rounded-xl p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-emerald-800 hover:bg-emerald-600 text-white transition active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs min-w-[14px] text-center text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-emerald-800 hover:bg-emerald-600 text-white transition active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition shadow-2xs font-black"
                          title="Agregar entrada"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 3. BEBIDAS & REFRESCOS ── */}
        {drinks.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-black text-xs">
                  3
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-stone-900">Bebidas y Refrescos</h3>
                  <p className="text-[11px] text-stone-500 font-medium">Bebidas caseras frescas del día</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {totalDrinks > 0 ? (
                  <button
                    onClick={() => clearCourse('bebida')}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition"
                    title="No deseo bebida"
                  >
                    Omitir Bebida
                  </button>
                ) : (
                  <span className="text-[10px] font-black uppercase text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    Omitido
                  </span>
                )}
              </div>
            </div>

            {/* Grilla 2 Columnas */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {drinks.map((item) => {
                const qty = getQty(item.id);
                const isSelected = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative rounded-2xl p-3 sm:p-4 text-left transition-all duration-200 flex flex-col justify-between gap-2.5 border-2 shadow-2xs",
                      isSelected
                        ? "border-sky-500 ring-2 ring-sky-400/30 bg-sky-50/40 shadow-md"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div />
                      {qty > 0 && (
                        <span className="text-[11px] font-black bg-sky-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                          {qty}x
                        </span>
                      )}
                    </div>

                    <div className="cursor-pointer" onClick={() => updateQty(item.id, 1)}>
                      <p className="font-black text-xs sm:text-sm text-stone-900 leading-snug line-clamp-2 min-h-[2.2rem]">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-[10px] text-stone-400 mt-1 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 w-full mt-auto">
                      <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider">
                        Incluido
                      </span>

                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-sky-600 text-white rounded-xl p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs min-w-[14px] text-center text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-sky-700 hover:bg-sky-800 text-white transition active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-300 text-sky-800 hover:bg-sky-600 hover:text-white flex items-center justify-center transition shadow-2xs font-black"
                          title="Agregar bebida"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 4. POSTRES & ADICIONALES ── */}
        {desserts.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                  4
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-stone-900">Postres Caseros</h3>
                    <span className="text-[10px] font-black bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full uppercase">
                      Opcional
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium">Endulza tu almuerzo con un postre del día</p>
                </div>
              </div>

              {totalDesserts > 0 && (
                <button
                  onClick={() => clearCourse('postre')}
                  className="text-[11px] font-bold text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition"
                >
                  Limpiar Postres
                </button>
              )}
            </div>

            {/* Grilla 2 Columnas */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              {desserts.map((item) => {
                const qty = getQty(item.id);
                const isSelected = qty > 0;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative rounded-2xl p-3 sm:p-4 text-left transition-all duration-200 flex flex-col justify-between gap-2.5 border-2 shadow-2xs",
                      isSelected
                        ? "border-rose-500 ring-2 ring-rose-400/30 bg-rose-50/40 shadow-md"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div />
                      {qty > 0 && (
                        <span className="text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                          {qty}x
                        </span>
                      )}
                    </div>

                    <div className="cursor-pointer" onClick={() => updateQty(item.id, 1)}>
                      <p className="font-black text-xs sm:text-sm text-stone-900 leading-snug line-clamp-2 min-h-[2.2rem]">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-[10px] text-stone-400 mt-1 line-clamp-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 w-full mt-auto">
                      <span className="text-[10px] font-black text-rose-700">
                        +{settings.currency} {(item.extraPrice ?? 3.50).toFixed(2)}
                      </span>

                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-rose-600 text-white rounded-xl p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-rose-700 hover:bg-rose-800 text-white transition active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs min-w-[14px] text-center text-white">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                            className="w-5 h-5 flex items-center justify-center rounded-lg bg-rose-700 hover:bg-rose-800 text-white transition active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-600 hover:text-white flex items-center justify-center transition shadow-2xs font-black"
                          title="Agregar postre"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* ── BARRA FLOTANTE INFERIOR DE PEDIDO ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Tu Selección:</span>
              <span className="text-[10px] font-black bg-stone-900 text-white px-2 py-0.5 rounded-md">
                {totalMains} Fondos · {totalStarters} Entradas · {totalDrinks} Bebidas
              </span>
            </div>
            <p className="font-black text-lg sm:text-2xl text-stone-900 leading-none mt-1">
              S/ {totalPrice.toFixed(2)}
            </p>
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            disabled={!isReady}
            className={cn(
              "px-5 sm:px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg",
              isReady
                ? `${theme.accentBtn} shadow-amber-500/25 active:scale-95 cursor-pointer`
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Pedir por WhatsApp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── MODAL DE CONFIRMACIÓN Y DATOS DE ENTREGA ── */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-4 animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h3 className="font-black text-base text-stone-900 leading-tight">Confirmar Menú del Día</h3>
                  <p className="text-xs text-stone-500 font-semibold">{theme.name} · {todayFormatted}</p>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 pt-0">

                {/* Resumen detallado */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5">
                  <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
                    Resumen de Platos Seleccionados
                  </span>

                  <div className="space-y-1.5 text-xs divide-y divide-stone-100">
                    {selectedItemsList.map(({ item, qty, courseLabel }) => (
                      <div key={item.id} className="flex items-center justify-between pt-1.5 first:pt-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-black text-stone-900 bg-stone-200 px-1.5 py-0.2 rounded text-[11px]">
                            {qty}x
                          </span>
                          <span className="font-bold text-stone-800 truncate">{item.name}</span>
                          <span className="text-[10px] text-stone-400">({courseLabel})</span>
                        </div>
                        {item.extraPrice ? (
                          <span className="text-amber-800 font-black shrink-0">+S/ {(item.extraPrice * qty).toFixed(2)}</span>
                        ) : (
                          <span className="text-stone-400 font-bold shrink-0">Incluido</span>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-between pt-2.5 border-t border-stone-200 font-black text-sm">
                      <span>Total a Pagar:</span>
                      <span className="text-amber-800 text-lg">S/ {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Modalidad de Entrega */}
                <div>
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-1.5">
                    ¿Cómo deseas recibir tu almuerzo?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'delivery', label: '🛵 Delivery', desc: 'A tu domicilio' },
                      { id: 'recojo',   label: '🥡 Para Llevar', desc: 'Recojo en local' },
                      { id: 'salon',    label: '🍽️ En Salón', desc: 'Comer en mesa' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDeliveryType(m.id as DeliveryType)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all",
                          deliveryType === m.id
                            ? "border-stone-900 bg-stone-900 text-white font-black shadow-xs"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                        )}
                      >
                        <p className="text-xs">{m.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Datos del Cliente */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Tu Nombre o Empresa *</label>
                    <input
                      type="text"
                      placeholder="Ej: Juan Pérez / Estudio Contable"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">WhatsApp de Contacto</label>
                    <input
                      type="tel"
                      placeholder="Ej: 999 888 777"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition"
                    />
                  </div>

                  {deliveryType === 'delivery' && (
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">Dirección de Entrega y Referencia *</label>
                      <input
                        type="text"
                        placeholder="Ej: Av. Los Sauces 450, Of. 302 (Frente al parque)"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Observaciones para la cocina (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Pechuga por favor, ají aparte, sin hielo"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none focus:border-stone-900 focus:bg-white transition"
                    />
                  </div>

                  {/* Método de Pago */}
                  <div>
                    <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-1.5">
                      Método de Pago
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Yape', 'Plin', 'Efectivo', 'Tarjeta'] as PayMethod[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPayMethod(p)}
                          className={cn(
                            "py-2 rounded-xl border text-xs font-bold text-center transition-all",
                            payMethod === p
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                              : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botón de Enviar */}
                <div className="pt-2">
                  <button
                    onClick={handleSend}
                    disabled={!customerName.trim() || (deliveryType === 'delivery' && !deliveryAddress.trim())}
                    className={cn(
                      "w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all",
                      customerName.trim() && (deliveryType !== 'delivery' || deliveryAddress.trim())
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-98 cursor-pointer"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    )}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Enviar Pedido a WhatsApp (S/ {totalPrice.toFixed(2)})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
