import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import {
  Search, Plus, Minus, X, MessageCircle, ShoppingBag,
  ChevronRight, ChevronLeft, Utensils, UtensilsCrossed,
  Coffee, Flame, Fish, Waves, Salad, Package, Star,
  MapPin, Phone, User, CreditCard, Banknote, Smartphone,
  CheckCircle2, ArrowRight, ChefHat, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from "../../types";
import { cn } from "../../lib/utils";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Props {
  onBack?: () => void;
  onViewDailyMenu?: () => void;
}

type CartItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

type CheckoutStep = 'cart' | 'details' | 'confirm';
type OrderType = 'delivery' | 'salon' | 'recojo';
type PayMethod = 'Yape' | 'Plin' | 'Efectivo' | 'Tarjeta';

// ─── Iconos por Categoría ─────────────────────────────────────────────────────

function getCategoryIcon(category: string, className = 'w-4 h-4') {
  const l = category.toLowerCase();
  if (l.includes('cevich') || l.includes('piqueo')) return <Fish className={className} />;
  if (l.includes('sopa') || l.includes('parihuela') || l.includes('chupe') || l.includes('sudado') || l.includes('chilcano')) return <Waves className={className} />;
  if (l.includes('arroz') || l.includes('chaufa') || l.includes('tacu')) return <Utensils className={className} />;
  if (l.includes('chichar') || l.includes('jalea')) return <Flame className={className} />;
  if (l.includes('parrilla') || l.includes('wok') || l.includes('saltado')) return <UtensilsCrossed className={className} />;
  if (l.includes('causa') || l.includes('dietét') || l.includes('ensalada')) return <Salad className={className} />;
  if (l.includes('bebida') || l.includes('refresco') || l.includes('leche')) return <Coffee className={className} />;
  if (l.includes('complement') || l.includes('piqueo')) return <Package className={className} />;
  if (l.includes('familiar') || l.includes('trío') || l.includes('marino')) return <Star className={className} />;
  return <ChefHat className={className} />;
}

import { createWhatsAppUrl } from "../../lib/formatters";

// ─────────────────────────────────────────────────────────────────────────────
export default function RappiMobileStoreView({ onBack, onViewDailyMenu }: Props) {
  const { products, settings } = useAppStore();

  // Menú
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productNotes, setProductNotes] = useState<Record<string, string>>({});

  // Modales
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalNotes, setModalNotes] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');

  // Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('recojo');
  const [payMethod, setPayMethod] = useState<PayMethod>('Yape');

  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const logoImage = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';

  // ─── Categorías ────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).sort();
    return ['all', ...cats];
  }, [products]);

  // ─── Filtrado + Agrupación ──────────────────────────────────────────────────
  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const matchSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });

    if (activeCategory !== 'all' || searchTerm) {
      const cat = activeCategory === 'all' ? 'Resultados' : activeCategory;
      return [{ category: cat, items: filtered }];
    }

    return categories
      .filter(c => c !== 'all')
      .map(cat => ({ category: cat, items: filtered.filter(p => p.category === cat) }))
      .filter(g => g.items.length > 0);
  }, [products, categories, activeCategory, searchTerm]);

  // ─── Totales ───────────────────────────────────────────────────────────────
  const totalItems = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);
  const deliveryFee = orderType === 'delivery' ? (subtotal >= 50 ? 0 : (settings.defaultDeliveryCost ?? 5)) : 0;
  const total = subtotal + deliveryFee;

  // ─── Carrito helpers ────────────────────────────────────────────────────────
  const getQty = useCallback((id: string) =>
    cart.filter(i => i.product.id === id).reduce((s, i) => s + i.quantity, 0), [cart]);

  const addToCart = (product: Product, qty = 1, notes?: string) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [...prev, { product, quantity: qty, notes }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev =>
      prev.map(i => i.product.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setModalNotes('');
  };

  // ─── WhatsApp ──────────────────────────────────────────────────────────────
  const sendWhatsApp = () => {
    if (!cart.length || !customerName.trim()) return;

    const lines = cart.map(i =>
      `• *${i.quantity}x* ${i.product.name}${i.notes && settings.whatsappIncludeNotes !== false ? ` _(Nota: ${i.notes})_` : ''} → ${settings.currency} ${(i.product.price * i.quantity).toFixed(2)}`
    ).join('\n');

    const modalidad =
      orderType === 'delivery' ? `🛵 Delivery a: ${deliveryAddress}` :
      orderType === 'salon' ? '🍽️ En mesa (salón)' :
      '🥡 Para recoger en local';

    const greeting = settings.whatsappMessageGreeting || `*PEDIDO — ${settings.companyName.toUpperCase()}*`;
    const footer = settings.whatsappCustomFooter || 'Por favor confirmar el tiempo estimado de entrega. ¡Muchas gracias!';

    const msgParts = [
      greeting,
      ``,
      `👤 *Cliente:* ${customerName}`,
      customerPhone ? `📱 *WhatsApp:* ${customerPhone}` : '',
      `📦 *Modalidad:* ${modalidad}`,
      settings.whatsappIncludePayment !== false ? `💳 *Pago:* ${payMethod}` : '',
      ``,
      `*DETALLE DEL PEDIDO:*`,
      lines,
      ``,
      `Subtotal: ${settings.currency} ${subtotal.toFixed(2)}`,
      deliveryFee > 0 ? `Delivery: ${settings.currency} ${deliveryFee.toFixed(2)}` : `Delivery: GRATIS 🎉`,
      `*TOTAL: ${settings.currency} ${total.toFixed(2)}*`,
      footer ? `\n${footer}` : '',
    ].filter(line => line !== null && line !== undefined && line !== '');

    const targetPhone = settings.whatsappOrdersPhone || settings.phone || settings.paymentDetails?.yape || '51987654321';
    const waUrl = createWhatsAppUrl(targetPhone, msgParts.join('\n'));
    window.open(waUrl, '_blank');
    setIsCartOpen(false);
    setCart([]);
    setCheckoutStep('cart');
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#f9f6f1] text-stone-900 font-sans">

      {/* ══ HEADER ════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src={logoImage}
            alt="Paradero 104"
            className="w-11 h-11 rounded-xl object-contain border border-stone-100 bg-white p-0.5 shrink-0"
            onError={e => { e.currentTarget.src = '/LOGO OFICIAL.png'; }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-base leading-none text-stone-900 truncate">
              {settings.companyName || 'Paradero 104'}
            </h1>
            <p className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mt-0.5">
              • CARTA DIGITAL •
            </p>
          </div>

          {/* Carrito flotante en el header */}
          {totalItems > 0 && (
            <button
              onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }}
              className="relative shrink-0 w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-md"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </button>
          )}
        </div>

        {/* Buscador */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar un plato..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-10 pr-9 py-2.5 text-sm font-medium text-stone-800 placeholder:text-stone-400 outline-none focus:border-teal-400 focus:bg-white transition"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pills de Categorías */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'whitespace-nowrap px-3.5 py-2 rounded-full text-[11px] font-black transition-all shrink-0 flex items-center gap-1.5 border',
                activeCategory === cat
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-teal-400'
              )}
            >
              {getCategoryIcon(cat, 'w-3 h-3')}
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </header>

      {/* ══ CUERPO ═══════════════════════════════════════════════════════════ */}
      <main className="px-4 py-5 space-y-8 pb-36">

        {/* Loading vacío */}
        {products.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-stone-200 mx-auto flex items-center justify-center">
              <Clock className="w-7 h-7 text-stone-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <p className="font-bold text-stone-500 text-sm">Cargando carta...</p>
          </div>
        )}

        {/* Sin resultados */}
        {products.length > 0 && groupedProducts.every(g => g.items.length === 0) && (
          <div className="py-16 text-center space-y-3">
            <Search className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-black text-stone-700">No encontramos ese plato</h3>
            <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
              className="px-5 py-2 bg-teal-600 text-white text-xs font-black rounded-xl">
              Ver todos los platos
            </button>
          </div>
        )}

        {/* Grupos de Platos */}
        {groupedProducts.map(group => group.items.length > 0 && (
          <section key={group.category} className="space-y-3">

            {/* Encabezado de Sección */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                {getCategoryIcon(group.category)}
              </div>
              <div>
                <h2 className="font-black text-xs text-stone-900 uppercase tracking-wider">{group.category}</h2>
                <div className="h-0.5 w-6 bg-teal-500 rounded-full mt-0.5" />
              </div>
              <span className="ml-auto text-[10px] font-black text-stone-400">
                {group.items.length} plato{group.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tarjetas */}
            <div className="space-y-2.5">
              {group.items.map(product => {
                const qty = getQty(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm flex items-center gap-3 px-4 py-3 hover:border-teal-300 transition-colors"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0" onClick={() => openProductModal(product)}>
                      <p className="font-black text-sm text-stone-900 leading-snug">{product.name}</p>
                      <p className="font-black text-teal-700 text-sm mt-0.5">
                        S/ {product.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Control cantidad */}
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-teal-600 rounded-full px-2.5 py-1.5 shrink-0">
                        <button onClick={() => updateQty(product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-white font-black">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-white text-sm w-4 text-center">{qty}</span>
                        <button onClick={() => updateQty(product.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-white font-black">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-9 h-9 rounded-full border-2 border-teal-500 text-teal-600 flex items-center justify-center hover:bg-teal-50 transition shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Footer */}
        {products.length > 0 && (
          <div className="flex items-center justify-center gap-3 py-6 border-t border-stone-200">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
              <Fish className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-xs text-stone-800">Paradero 104</p>
              <p className="text-[10px] text-stone-400 font-medium">Los mejores mariscos de la ciudad 🦐</p>
            </div>
          </div>
        )}

      </main>

      {/* ══ BARRA FLOTANTE DE CARRITO ════════════════════════════════════════ */}
      <AnimatePresence>
        {totalItems > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-5 left-4 right-4 max-w-lg mx-auto z-40"
          >
            <button
              onClick={() => { setIsCartOpen(true); setCheckoutStep('cart'); }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-xl shadow-teal-600/30 transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                  {totalItems}
                </div>
                <div className="text-left">
                  <p className="font-black text-sm">Ver mi pedido</p>
                  <p className="text-[10px] text-teal-200">Toca para confirmar</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-black text-base">S/ {total.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4 text-teal-300" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL DETALLE DE PRODUCTO ════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 block mb-1">
                    {selectedProduct.category}
                  </span>
                  <h3 className="font-black text-lg text-stone-900 leading-snug">{selectedProduct.name}</h3>
                  <p className="font-black text-teal-700 text-xl mt-1">S/ {selectedProduct.price.toFixed(2)}</p>
                </div>
                <button onClick={() => setSelectedProduct(null)}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notas */}
              <div>
                <label className="text-xs font-bold text-stone-500 block mb-1.5">
                  Indicaciones especiales (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. sin ají, bien dorado, poco limón..."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal-400 transition"
                />
              </div>

              {/* Cantidad + Agregar */}
              <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                <div className="flex items-center bg-stone-100 rounded-xl p-1 gap-1">
                  <button onClick={() => setModalQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm font-black flex items-center justify-center">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-black text-sm">{modalQty}</span>
                  <button onClick={() => setModalQty(q => q + 1)}
                    className="w-8 h-8 rounded-lg bg-white shadow-sm font-black flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    addToCart(selectedProduct, modalQty, modalNotes || undefined);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Agregar · S/ {(selectedProduct.price * modalQty).toFixed(2)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ DRAWER DE CHECKOUT ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Encabezado del drawer ── */}
              <div className="flex items-center gap-3 p-5 border-b border-stone-100 shrink-0">
                {checkoutStep !== 'cart' && (
                  <button onClick={() => setCheckoutStep(checkoutStep === 'confirm' ? 'details' : 'cart')}
                    className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex-1">
                  <h3 className="font-black text-base text-stone-900">
                    {checkoutStep === 'cart' ? 'Tu Pedido' :
                     checkoutStep === 'details' ? 'Tus Datos' : 'Confirmar Pedido'}
                  </h3>
                  <div className="flex gap-1.5 mt-1">
                    {(['cart', 'details', 'confirm'] as CheckoutStep[]).map((s, i) => (
                      <div key={s} className={cn(
                        'h-1 rounded-full transition-all',
                        checkoutStep === s ? 'w-6 bg-teal-600' : 'w-2 bg-stone-200'
                      )} />
                    ))}
                  </div>
                </div>
                <button onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Contenido scrollable ── */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'none' }}>

                {/* PASO 1: Carrito */}
                {checkoutStep === 'cart' && (
                  <>
                    {cart.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <ShoppingBag className="w-12 h-12 text-stone-200 mx-auto" />
                        <p className="font-bold text-stone-500">Tu carrito está vacío</p>
                        <button onClick={() => setIsCartOpen(false)}
                          className="px-5 py-2 bg-teal-600 text-white text-sm font-black rounded-xl">
                          Explorar el menú
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {cart.map((item, idx) => (
                          <div key={idx} className="bg-stone-50 rounded-xl border border-stone-200 p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-sm text-stone-900 leading-snug">{item.product.name}</p>
                              {item.notes && <p className="text-[11px] text-stone-400 italic mt-0.5">{item.notes}</p>}
                              <p className="font-black text-teal-700 text-sm mt-0.5">
                                S/ {(item.product.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center bg-white border border-stone-200 rounded-full px-2 py-1 gap-2 shrink-0">
                              <button onClick={() => updateQty(item.product.id, -1)}
                                className="w-5 h-5 font-black text-stone-500 flex items-center justify-center">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(item.product.id, 1)}
                                className="w-5 h-5 font-black text-stone-500 flex items-center justify-center">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resumen */}
                    {cart.length > 0 && (
                      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-stone-600">
                          <span>Subtotal</span>
                          <span className="font-bold">S/ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Delivery</span>
                          <span className="font-bold">{deliveryFee > 0 ? `S/ ${deliveryFee.toFixed(2)}` : 'Según modalidad'}</span>
                        </div>
                        <div className="flex justify-between font-black text-base pt-2 border-t border-teal-200">
                          <span>Total</span>
                          <span className="text-teal-700">S/ {subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* PASO 2: Datos del cliente */}
                {checkoutStep === 'details' && (
                  <div className="space-y-4">

                    {/* Modalidad */}
                    <div>
                      <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-2">
                        ¿Cómo quieres recibirlo?
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: 'recojo', label: 'Recojo', icon: '🥡' },
                          { key: 'salon', label: 'En mesa', icon: '🍽️' },
                          { key: 'delivery', label: 'Delivery', icon: '🛵' },
                        ] as const).map(t => (
                          <button
                            key={t.key}
                            onClick={() => setOrderType(t.key)}
                            className={cn(
                              'flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-black transition',
                              orderType === t.key
                                ? 'border-teal-500 bg-teal-50 text-teal-800'
                                : 'border-stone-200 bg-white text-stone-600'
                            )}
                          >
                            <span className="text-xl">{t.icon}</span>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nombre */}
                    <div>
                      <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-1.5">
                        Tu nombre *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="¿Cómo te llamamos?"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-teal-400 transition"
                        />
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-1.5">
                        Tu WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="9XX XXX XXX"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-teal-400 transition"
                        />
                      </div>
                    </div>

                    {/* Dirección (solo delivery) */}
                    {orderType === 'delivery' && (
                      <div>
                        <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-1.5">
                          Dirección de entrega *
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Calle, número, referencia..."
                            value={deliveryAddress}
                            onChange={e => setDeliveryAddress(e.target.value)}
                            className="w-full border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-teal-400 transition"
                          />
                        </div>
                        {subtotal < 50 && (
                          <p className="text-[11px] text-amber-600 font-bold mt-1.5">
                            💡 Pedido mínimo S/ 50 para delivery gratis (falta S/ {(50 - subtotal).toFixed(2)})
                          </p>
                        )}
                      </div>
                    )}

                    {/* Método de pago */}
                    <div>
                      <label className="text-xs font-black text-stone-700 uppercase tracking-wider block mb-2">
                        Método de pago
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { key: 'Yape', icon: <Smartphone className="w-4 h-4" />, color: 'text-purple-600' },
                          { key: 'Plin', icon: <Smartphone className="w-4 h-4" />, color: 'text-blue-600' },
                          { key: 'Efectivo', icon: <Banknote className="w-4 h-4" />, color: 'text-green-600' },
                          { key: 'Tarjeta', icon: <CreditCard className="w-4 h-4" />, color: 'text-stone-600' },
                        ] as const).map(m => (
                          <button
                            key={m.key}
                            onClick={() => setPayMethod(m.key)}
                            className={cn(
                              'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-black transition',
                              payMethod === m.key
                                ? 'border-teal-500 bg-teal-50 text-teal-800'
                                : 'border-stone-200 bg-white text-stone-600'
                            )}
                          >
                            <span className={payMethod === m.key ? 'text-teal-600' : m.color}>{m.icon}</span>
                            {m.key}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* PASO 3: Confirmación */}
                {checkoutStep === 'confirm' && (
                  <div className="space-y-4">

                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
                      <h4 className="font-black text-teal-800 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Resumen del pedido
                      </h4>

                      <div className="space-y-1.5 text-sm">
                        {cart.map((item, i) => (
                          <div key={i} className="flex justify-between text-stone-700">
                            <span className="font-semibold">{item.quantity}x {item.product.name}</span>
                            <span className="font-bold">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-teal-200 pt-3 space-y-1 text-sm">
                        <div className="flex justify-between text-stone-600">
                          <span>Subtotal</span><span className="font-bold">S/ {subtotal.toFixed(2)}</span>
                        </div>
                        {deliveryFee > 0 && (
                          <div className="flex justify-between text-stone-600">
                            <span>Delivery</span><span className="font-bold">S/ {deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-base text-teal-800">
                          <span>TOTAL</span><span>S/ {total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-sm">
                      <div className="flex gap-2 text-stone-700">
                        <User className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                        <div><span className="font-bold">{customerName}</span>{customerPhone && <span className="text-stone-400"> · {customerPhone}</span>}</div>
                      </div>
                      <div className="flex gap-2 text-stone-700">
                        <span className="text-base shrink-0">
                          {orderType === 'delivery' ? '🛵' : orderType === 'salon' ? '🍽️' : '🥡'}
                        </span>
                        <span className="font-semibold">
                          {orderType === 'delivery' ? `Delivery: ${deliveryAddress}` :
                           orderType === 'salon' ? 'Comer en el restaurante' : 'Recoger en local'}
                        </span>
                      </div>
                      <div className="flex gap-2 text-stone-700">
                        <CreditCard className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                        <span className="font-semibold">{payMethod}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-400 text-center">
                      Al confirmar, se abrirá WhatsApp con tu pedido ya listo para enviar al restaurante.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Botón de acción ── */}
              <div className="p-5 pt-3 border-t border-stone-100 shrink-0">
                {checkoutStep === 'cart' && cart.length > 0 && (
                  <button
                    onClick={() => setCheckoutStep('details')}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition"
                  >
                    Continuar con mi pedido
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {checkoutStep === 'details' && (
                  <button
                    onClick={() => setCheckoutStep('confirm')}
                    disabled={!customerName.trim() || (orderType === 'delivery' && !deliveryAddress.trim())}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 transition"
                  >
                    Revisar mi pedido
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {checkoutStep === 'confirm' && (
                  <button
                    onClick={sendWhatsApp}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 transition active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar Pedido por WhatsApp
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
