import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import {
  MessageCircle, Check, ChevronLeft,
  Utensils, Coffee, Cake, Soup,
  User, Phone, MapPin, ArrowRight, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from "../../lib/utils";
import { DailyMenuItem } from "../../types";
import { formatMoney, createWhatsAppUrl } from "../../lib/formatters";

interface DailyMenuViewProps {
  onBack?: () => void;
  onViewFullMenu?: () => void;
}

const BASE_PRICE = 16.00;
const WHATSAPP_NUMBER = '51987654321'; // â† Cambiar al nÃºmero real del restaurante

type DeliveryType = 'recojo' | 'salon' | 'delivery';
type PayMethod = 'Yape' | 'Plin' | 'Efectivo' | 'Tarjeta';

// â”€â”€ Tarjeta de opciÃ³n seleccionable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OptionCard({
  item, isSelected, onSelect, accentColor, currency,
}: {
  item: DailyMenuItem; isSelected: boolean; onSelect: () => void;
  accentColor: string; currency: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex-shrink-0 w-48 sm:w-56 rounded-2xl border-2 p-4 text-left transition-all duration-200 flex flex-col justify-between gap-3',
        isSelected ? 'bg-white shadow-lg scale-[1.02]' : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
      )}
      style={isSelected ? { borderColor: accentColor } : {}}
    >
      {item.popular && (
        <span className="absolute top-3 right-3 text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
          â­ Favorito
        </span>
      )}
      <div>
        <p className="font-black text-sm text-stone-900 leading-snug pr-10">{item.name}</p>
        {item.description && (
          <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold" style={{ color: isSelected ? accentColor : '#a8a29e' }}>
          {item.extraPrice ? `+${currency} ${item.extraPrice.toFixed(2)}` : 'Incluido'}
        </span>
        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center transition-all',
          isSelected ? 'text-white' : 'border-2 border-stone-300')}
          style={isSelected ? { backgroundColor: accentColor } : {}}>
          {isSelected && <Check className="w-3 h-3" />}
        </div>
      </div>
    </button>
  );
}

// â”€â”€ SecciÃ³n con scroll horizontal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SelectionSection({
  step, title, subtitle, items, selected, onSelect,
  accentColor, currency, optional = false,
}: {
  step: number; title: string; subtitle: string;
  items: DailyMenuItem[]; selected: DailyMenuItem | null;
  onSelect: (item: DailyMenuItem | null) => void;
  accentColor: string; currency: string; optional?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
          style={{ backgroundColor: accentColor }}>{step}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm text-stone-900">{title}</h3>
            {optional && <span className="text-[9px] font-black bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">opcional</span>}
          </div>
          <p className="text-[11px] text-stone-500 font-medium">{subtitle}</p>
        </div>
        {selected && (
          <span className="text-[11px] font-black text-right max-w-[100px] truncate" style={{ color: accentColor }}>
            {selected.name.split(' ').slice(0, 2).join(' ')}â€¦
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        {optional && (
          <button onClick={() => onSelect(null)}
            className={cn(
              'flex-shrink-0 w-28 rounded-2xl border-2 p-4 text-center flex flex-col items-center justify-center gap-2',
              !selected ? 'border-stone-400 bg-stone-50' : 'border-stone-200 bg-white hover:border-stone-300'
            )}>
            <span className="text-2xl">ðŸš«</span>
            <span className="text-[11px] font-black text-stone-600">Sin postre</span>
          </button>
        )}
        {items.map(item => (
          <OptionCard key={item.id} item={item} isSelected={selected?.id === item.id}
            onSelect={() => onSelect(item)} accentColor={accentColor} currency={currency} />
        ))}
      </div>
    </section>
  );
}

// â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DailyMenuView({ onBack, onViewFullMenu }: DailyMenuViewProps) {
  const { settings, dailyMenuItems } = useAppStore();

  const starters = dailyMenuItems.filter(i => i.course === 'entrada' && i.available);
  const mains    = dailyMenuItems.filter(i => i.course === 'fondo'   && i.available);
  const drinks   = dailyMenuItems.filter(i => i.course === 'bebida'  && i.available);
  const desserts = dailyMenuItems.filter(i => i.course === 'postre'  && i.available);

  const [selectedStarter, setSelectedStarter] = useState<DailyMenuItem | null>(starters[0] ?? null);
  const [selectedMain,    setSelectedMain]    = useState<DailyMenuItem | null>(mains[0]    ?? null);
  const [selectedDrink,   setSelectedDrink]   = useState<DailyMenuItem | null>(drinks[0]   ?? null);
  const [selectedDessert, setSelectedDessert] = useState<DailyMenuItem | null>(null);

  const [customerName,    setCustomerName]    = useState('');
  const [customerPhone,   setCustomerPhone]   = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryType,    setDeliveryType]    = useState<DeliveryType>('recojo');
  const [payMethod,       setPayMethod]       = useState<PayMethod>('Yape');
  const [showCheckout,    setShowCheckout]    = useState(false);
  const [sent,            setSent]            = useState(false);

  const todayFormatted = useMemo(() => {
    const d = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    return `${d[now.getDay()]} ${now.getDate()} ${m[now.getMonth()]}`;
  }, []);

  const totalPrice = useMemo(() => {
    let t = BASE_PRICE;
    if (selectedDessert?.extraPrice) t += selectedDessert.extraPrice;
    if (selectedMain?.extraPrice)    t += selectedMain.extraPrice;
    return t;
  }, [selectedDessert, selectedMain]);

  const isReady = !!(selectedStarter && selectedMain && selectedDrink);

  const handleSend = () => {
    if (!isReady || !customerName.trim()) return;
    const modalidad =
      deliveryType === 'delivery' ? `🛵 Delivery a: ${deliveryAddress}` :
      deliveryType === 'salon'    ? '🍽️ En el restaurante (salón)' : '🥡 Recoger en local';

    const greeting = settings.whatsappMessageGreeting || `🍽️ *MENÚ EJECUTIVO — ${settings.companyName.toUpperCase()}*`;
    const footer = settings.whatsappCustomFooter || 'Por favor confirmar el pedido. ¡Muchas gracias!';

    const msg = [
      greeting,
      `📅 ${todayFormatted}`,
      ``,
      `👤 *Cliente:* ${customerName}`,
      customerPhone ? `📱 *WhatsApp:* ${customerPhone}` : '',
      `📦 *Modalidad:* ${modalidad}`,
      settings.whatsappIncludePayment !== false ? `💳 *Pago:* ${payMethod}` : '',
      ``,
      `*COMBINACIÓN:*`,
      `1. Entrada: ${selectedStarter?.name}`,
      `2. Fondo:   ${selectedMain?.name}`,
      `3. Bebida:  ${selectedDrink?.name}`,
      selectedDessert ? `4. Postre:  ${selectedDessert.name} (+${settings.currency} ${selectedDessert.extraPrice?.toFixed(2)})` : '',
      ``,
      `*TOTAL: ${settings.currency} ${totalPrice.toFixed(2)}*`,
      footer ? `\n${footer}` : '',
    ].filter(l => l !== '').join('\n');

    const targetPhone = settings.whatsappOrdersPhone || settings.phone || settings.paymentDetails?.yape || '51987654321';
    const waUrl = createWhatsAppUrl(targetPhone, msg);
    window.open(waUrl, '_blank');
    setSent(true);
    setShowCheckout(false);
  };

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen bg-[#f9f6f1] font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <h1 className="font-black text-base text-stone-900 leading-none">MenÃº Ejecutivo</h1>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mt-0.5">{todayFormatted}</p>
          </div>
          {onViewFullMenu && (
            <button onClick={onViewFullMenu}
              className="text-[11px] font-black text-teal-600 border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition">
              Ver Carta
            </button>
          )}
        </div>
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-br from-amber-600 to-orange-600 text-white px-5 py-8">
        <div className="max-w-lg mx-auto text-center space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-amber-200">Almuerzo del dÃ­a</p>
          <h2 className="text-3xl font-black">Arma tu MenÃº Completo</h2>
          <p className="text-sm text-amber-100 font-medium">Entrada + Fondo + Bebida â€” todo por</p>
          <div className="inline-flex items-baseline gap-1 bg-white/15 px-6 py-3 rounded-2xl backdrop-blur-sm">
            <span className="text-lg font-black text-amber-200">S/</span>
            <span className="text-5xl font-black">{BASE_PRICE.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="bg-white border-b border-stone-100 px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {[
            { label: 'Entrada', done: !!selectedStarter, color: '#f59e0b' },
            { label: 'Fondo',   done: !!selectedMain,    color: '#ea580c' },
            { label: 'Bebida',  done: !!selectedDrink,   color: '#0d9488' },
            { label: 'Postre',  done: !!selectedDessert, color: '#8b5cf6', optional: true },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all',
                    s.done ? 'text-white' : 'bg-stone-100 text-stone-400')}
                  style={s.done ? { backgroundColor: s.color } : {}}>
                  {s.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn('text-[9px] font-black uppercase tracking-wider',
                  s.done ? 'text-stone-700' : 'text-stone-400')}>
                  {s.label}{s.optional ? '*' : ''}
                </span>
              </div>
              {i < 3 && <div className={cn('flex-1 h-0.5 rounded-full', s.done ? 'bg-stone-300' : 'bg-stone-100')} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* SELECCIÃ“N */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-36">

        {dailyMenuItems.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center">
              <Info className="w-7 h-7 text-amber-600" />
            </div>
            <p className="font-bold text-stone-700">El menÃº de hoy no estÃ¡ disponible aÃºn.</p>
            <p className="text-sm text-stone-400">Vuelve mÃ¡s tarde o consulta la carta completa.</p>
            {onViewFullMenu && (
              <button onClick={onViewFullMenu} className="px-5 py-2.5 bg-teal-600 text-white text-sm font-black rounded-xl">
                Ver Carta Completa
              </button>
            )}
          </div>
        )}

        <SelectionSection step={1} title="Elige tu Entrada" subtitle="Sopa o entrada para comenzar"
          items={starters} selected={selectedStarter} onSelect={setSelectedStarter}
          accentColor="#f59e0b" currency={settings.currency} />

        <SelectionSection step={2} title="Plato de Fondo" subtitle="El corazÃ³n de tu almuerzo"
          items={mains} selected={selectedMain} onSelect={setSelectedMain}
          accentColor="#ea580c" currency={settings.currency} />

        <SelectionSection step={3} title="Bebida del DÃ­a" subtitle="Refrescos naturales o gaseosa"
          items={drinks} selected={selectedDrink} onSelect={setSelectedDrink}
          accentColor="#0d9488" currency={settings.currency} />

        {desserts.length > 0 && (
          <SelectionSection step={4} title="Â¿Quieres un Postre?" subtitle="Endulza tu almuerzo (adicional)"
            items={desserts} selected={selectedDessert} onSelect={setSelectedDessert}
            accentColor="#8b5cf6" currency={settings.currency} optional />
        )}

        {/* Resumen cuando estÃ¡ listo */}
        {isReady && (
          <div className="bg-white rounded-2xl border-2 border-amber-400 p-5 space-y-3">
            <h3 className="font-black text-stone-900 text-sm">âœ… Tu combinaciÃ³n estÃ¡ lista</h3>
            <div className="space-y-1.5 text-sm">
              {[
                { l: 'Entrada', v: selectedStarter?.name },
                { l: 'Fondo',   v: selectedMain?.name },
                { l: 'Bebida',  v: selectedDrink?.name },
                selectedDessert ? { l: 'Postre', v: `${selectedDessert.name} (+S/ ${selectedDessert.extraPrice?.toFixed(2)})` } : null,
              ].filter(Boolean).map(r => (
                <div key={r!.l} className="flex justify-between">
                  <span className="text-stone-500">{r!.l}</span>
                  <span className="font-bold text-stone-800 text-right max-w-[60%]">{r!.v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-stone-100 font-black text-base">
                <span>Total</span>
                <span className="text-amber-600">S/ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BARRA FLOTANTE */}
      <AnimatePresence>
        {isReady && !showCheckout && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-5 left-4 right-4 max-w-lg mx-auto z-40">
            <button onClick={() => setShowCheckout(true)}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl shadow-amber-500/30 transition active:scale-95">
              <div>
                <p className="font-black text-sm">Pedir mi MenÃº</p>
                <p className="text-[11px] text-amber-100">Entrada + Fondo + Bebida</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl">S/ {totalPrice.toFixed(2)}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CHECKOUT */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setShowCheckout(false)}>
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center gap-3 p-5 border-b border-stone-100">
                <button onClick={() => setShowCheckout(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <h3 className="font-black text-base text-stone-900">Completar Pedido</h3>
                  <p className="text-[11px] text-stone-400">Total: <strong className="text-amber-600">S/ {totalPrice.toFixed(2)}</strong></p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Modalidad */}
                <div>
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-2">Â¿CÃ³mo lo recibirÃ¡s?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'recojo', label: 'Recojo', emoji: 'ðŸ¥¡' },
                      { key: 'salon', label: 'En mesa', emoji: 'ðŸ½ï¸' },
                      { key: 'delivery', label: 'Delivery', emoji: 'ðŸ›µ' },
                    ] as const).map(t => (
                      <button key={t.key} onClick={() => setDeliveryType(t.key)}
                        className={cn('flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-black transition',
                          deliveryType === t.key ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-600')}>
                        <span className="text-xl">{t.emoji}</span>{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Tu nombre *" value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-amber-400 transition" />
                </div>

                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="tel" placeholder="Tu WhatsApp" value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-amber-400 transition" />
                </div>

                {deliveryType === 'delivery' && (
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="DirecciÃ³n de entrega *" value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-amber-400 transition" />
                  </div>
                )}

                {/* Pago */}
                <div>
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-2">MÃ©todo de pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Yape', 'Plin', 'Efectivo', 'Tarjeta'] as PayMethod[]).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className={cn('flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-black transition',
                          payMethod === m ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-600')}>
                        <span>{m === 'Yape' ? 'ðŸ’œ' : m === 'Plin' ? 'ðŸ’™' : m === 'Efectivo' ? 'ðŸ’µ' : 'ðŸ’³'}</span> {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-sm">
                  {[
                    { l: 'Entrada', v: selectedStarter?.name },
                    { l: 'Fondo',   v: selectedMain?.name },
                    { l: 'Bebida',  v: selectedDrink?.name },
                    selectedDessert ? { l: 'Postre', v: `${selectedDessert.name} (+S/ ${selectedDessert.extraPrice?.toFixed(2)})` } : null,
                  ].filter(Boolean).map(r => (
                    <div key={r!.l} className="flex justify-between">
                      <span className="text-stone-500">{r!.l}</span>
                      <span className="font-bold text-stone-800 text-right max-w-[60%]">{r!.v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-amber-200 font-black text-base">
                    <span>TOTAL</span><span className="text-amber-700">S/ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button onClick={handleSend}
                  disabled={!customerName.trim() || (deliveryType === 'delivery' && !deliveryAddress.trim())}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/25 transition active:scale-95">
                  <MessageCircle className="w-5 h-5" />
                  Enviar Pedido por WhatsApp
                </button>

                {!customerName.trim() && (
                  <p className="text-center text-xs text-red-500 font-bold">* Tu nombre es requerido</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANTALLA Ã‰XITO */}
      <AnimatePresence>
        {sent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-8 text-center">
            <div className="text-7xl mb-4">ðŸŽ‰</div>
            <h2 className="font-black text-2xl text-stone-900 mb-2">Â¡Pedido enviado!</h2>
            <p className="text-stone-500 font-medium mb-8">Tu pedido fue enviado por WhatsApp. El restaurante te confirmarÃ¡ pronto.</p>
            <button onClick={() => setSent(false)} className="px-8 py-3 bg-amber-500 text-white font-black rounded-2xl text-sm">
              Volver al MenÃº
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
