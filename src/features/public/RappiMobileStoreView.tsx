import React, { useState, useMemo, useRef } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import {
  Search, Plus, Minus, X, Sparkles, MessageCircle,
  ChevronRight, SlidersHorizontal, Utensils, UtensilsCrossed,
  Coffee, Flame, ShoppingBag, Menu as MenuIcon, ArrowRight, ChefHat
} from 'lucide-react';
import { Product, PaymentMethod } from "../../types";
import { cn } from "../../lib/utils";

interface Props {
  onBack: () => void;
  onViewDailyMenu?: () => void;
}

type CartItem = {
  product: Product;
  quantity: number;
  selectedOption?: string;
  notes?: string;
};

/* ── Icono por categoría ── */
function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const lower = category.toLowerCase();
  if (lower.includes('parrilla') || lower.includes('mostro') || lower.includes('brasa')) return <Flame className={className} />;
  if (lower.includes('entrada') || lower.includes('chaufa') || lower.includes('sopa')) return <UtensilsCrossed className={className} />;
  if (lower.includes('bebida') || lower.includes('refresco') || lower.includes('jugo')) return <Coffee className={className} />;
  if (lower.includes('combo') || lower.includes('promo')) return <ShoppingBag className={className} />;
  return <Utensils className={className} />;
}

export default function RappiMobileStoreView({ onBack, onViewDailyMenu }: Props) {
  const { products, settings } = useAppStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalSide, setModalSide] = useState('Papas Fritas Clásicas');
  const [modalNotes, setModalNotes] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Yape');
  const [orderType, setOrderType] = useState<'delivery' | 'salon' | 'recojo'>('delivery');

  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const logoImage = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';

  /* ── Categorías ── */
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...cats];
  }, [products]);

  /* ── Filtrado ── */
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, activeCategory]);

  /* ── Agrupación ── */
  const groupedProducts = useMemo(() => {
    if (activeCategory !== 'all' || searchTerm.trim() !== '') {
      return [{ category: activeCategory === 'all' ? 'Resultados de búsqueda' : activeCategory, items: filteredProducts }];
    }
    return categories
      .filter(c => c !== 'all')
      .map(cat => ({ category: cat, items: products.filter(p => p.category === cat) }))
      .filter(g => g.items.length > 0);
  }, [categories, products, activeCategory, searchTerm, filteredProducts]);

  /* ── Carrito ── */
  const totalItems = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);
  const deliveryFee = orderType === 'delivery' ? (subtotal >= 45 ? 0 : 4.50) : 0;
  const totalAmount = subtotal + deliveryFee;

  const addToCart = (product: Product, qty = 1, option?: string, notes?: string) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id && i.selectedOption === option);
      if (idx > -1) {
        const copy = [...prev]; copy[idx].quantity += qty; return copy;
      }
      return [...prev, { product, quantity: qty, selectedOption: option, notes }];
    });
  };

  const updateQty = (productId: string, delta: number, option?: string) => {
    setCart(prev =>
      prev.map(i => {
        if (i.product.id === productId && i.selectedOption === option) {
          const nq = i.quantity + delta;
          return nq > 0 ? { ...i, quantity: nq } : null;
        }
        return i;
      }).filter(Boolean) as CartItem[]
    );
  };

  const getQty = (productId: string) => cart.filter(i => i.product.id === productId).reduce((s, i) => s + i.quantity, 0);

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setModalSide('Papas Fritas Clásicas');
    setModalNotes('');
  };

  const sendWhatsApp = () => {
    if (!cart.length) return;
    const phone = '51987654321';
    const items = cart.map(i =>
      `• *${i.quantity}x* ${i.product.name}${i.selectedOption ? ` (${i.selectedOption})` : ''} - ${settings.currency} ${(i.product.price * i.quantity).toFixed(2)}`
    ).join('%0A');
    const msg =
      `*PEDIDO - ${settings.companyName.toUpperCase()}*%0A%0A` +
      `*Cliente:* ${customerName || 'Sin nombre'}%0A` +
      `*Teléfono:* ${customerPhone || '-'}%0A` +
      `*Modalidad:* ${orderType === 'delivery' ? `Delivery: ${deliveryAddress}` : orderType === 'salon' ? 'En mesa' : 'Para llevar'}%0A` +
      `*Pago:* ${paymentMethod}%0A%0A` +
      `*PLATOS:*%0A${items}%0A%0A` +
      `*Subtotal:* ${settings.currency} ${subtotal.toFixed(2)}%0A` +
      `*Envío:* ${deliveryFee === 0 ? 'GRATIS' : `${settings.currency} ${deliveryFee.toFixed(2)}`}%0A` +
      `*TOTAL:* ${settings.currency} ${totalAmount.toFixed(2)}`;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  /* ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans">

      {/* ════════════════════════════════
          HEADER
      ════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-white border-b border-stone-100 shadow-xs">
        <div className="flex items-center gap-3 px-4 py-3">

          {/* Hamburguesa / Volver */}
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition shrink-0"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          {/* Logo + Nombre */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={logoImage}
              alt="Logo"
              className="w-11 h-11 rounded-xl object-contain border border-stone-100 bg-white p-0.5 shrink-0 shadow-xs"
              onError={(e) => { e.currentTarget.src = '/LOGO OFICIAL.png'; }}
            />
            <div className="min-w-0">
              <h1 className="font-black text-stone-900 text-base sm:text-lg leading-none truncate">{settings.companyName}</h1>
              <p className="text-[10px] font-black text-amber-700 tracking-[0.18em] uppercase mt-0.5">• CARTA DIGITAL •</p>
            </div>
          </div>

          {/* Botón Menú del Día */}
          {onViewDailyMenu && (
            <button
              onClick={onViewDailyMenu}
              className="shrink-0 flex flex-col items-center justify-center bg-amber-700 hover:bg-amber-800 text-white rounded-2xl px-3.5 py-2 shadow-md transition"
              style={{ minWidth: 100 }}
            >
              <div className="flex items-center gap-1.5 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Menú del Día</span>
              </div>
              <span className="font-mono font-black text-sm leading-none mt-0.5">S/ 16.00</span>
            </button>
          )}
        </div>

        {/* Buscador */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar plato por nombre (ej. 1/4 pollo, ceviche)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-11 pr-9 py-2.5 text-sm font-medium text-stone-800 placeholder:text-stone-400 outline-none focus:border-amber-500 transition"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pills de Categorías */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto custom-scrollbar">
          {categories.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 border',
                  active
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-amber-400 hover:text-amber-800'
                )}
              >
                {cat === 'all' && <Flame className="w-3.5 h-3.5 text-amber-500" />}
                {cat === 'all' ? 'Todos los Platos' : cat}
              </button>
            );
          })}
        </div>
      </header>

      {/* ════════════════════════════════
          CUERPO — LISTA DE PLATOS
      ════════════════════════════════ */}
      <main className="px-4 py-5 space-y-8 pb-36">

        {groupedProducts.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <Search className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-black text-stone-900">No encontramos ese plato</h3>
            <p className="text-xs text-stone-500 font-medium">Prueba con otro término o selecciona una categoría.</p>
            <button onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} className="px-5 py-2 bg-stone-900 text-white text-xs font-black rounded-xl">Ver todos</button>
          </div>
        )}

        {groupedProducts.map(group => (
          <section key={group.category} className="space-y-4">

            {/* Título de Sección */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CategoryIcon category={group.category} className="w-5 h-5 text-amber-700" />
                <div>
                  <h2 className="font-black text-sm text-stone-900 tracking-wide uppercase">{group.category}</h2>
                  <div className="h-0.5 w-8 bg-amber-600 rounded-full mt-0.5" />
                </div>
              </div>
              <span className="text-xs font-black text-amber-700">
                {group.items.length} {group.items.length === 1 ? 'opción' : 'opciones'}
              </span>
            </div>

            {/* Grid de Tarjetas — siempre 2 columnas */}
            <div className="grid grid-cols-2 gap-3">
              {group.items.map(product => {
                const qtyInCart = getQty(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col overflow-hidden hover:border-amber-300 transition-colors"
                  >
                    {/* Top row: badge + precio */}
                    <div className="flex items-start justify-between gap-1.5 px-3 pt-3 pb-2">
                      <span className="text-[8px] font-black uppercase tracking-wider leading-tight px-1.5 py-1 rounded-md border bg-amber-50 text-amber-800 border-amber-100">
                        {product.category}
                      </span>
                      <span className="font-mono font-black text-stone-900 bg-stone-100 rounded-lg px-2 py-1 shrink-0 text-xs">
                        {settings.currency} {product.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Nombre + separador + descripción */}
                    <div className="flex-1 px-3 pb-2 space-y-1.5">
                      <h3 className="font-black text-stone-900 leading-snug text-xs sm:text-sm">
                        {product.name}
                      </h3>
                      <div className="w-4 h-0.5 bg-stone-300 rounded-full" />
                      <p className="text-[10px] text-stone-500 font-medium leading-snug line-clamp-2">
                        Plato preparado al momento con ingredientes frescos de la casa.
                      </p>
                    </div>

                    {/* Footer: ver opciones + agregar */}
                    <div className="border-t border-stone-100 px-3 py-2.5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openDetail(product)}
                        className="flex items-center gap-1 text-stone-500 hover:text-amber-700 transition-colors"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span className="text-[9px] font-bold">Ver opciones</span>
                      </button>

                      {qtyInCart > 0 ? (
                        <div className="flex items-center bg-stone-900 text-white rounded-full px-2 py-0.5 gap-1.5">
                          <button onClick={() => updateQty(product.id, -1)} className="w-4 h-4 flex items-center justify-center font-black text-stone-300 hover:text-white">-</button>
                          <span className="font-mono font-black text-[10px]">{qtyInCart}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="w-4 h-4 flex items-center justify-center font-black text-stone-300 hover:text-white">+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="flex items-center gap-1 border border-stone-300 text-stone-700 hover:border-amber-500 hover:text-amber-800 rounded-full px-2.5 py-1 text-[9px] font-black transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </section>
        ))}

        {/* ── Banner Inferior de Agradecimiento ── */}
        {groupedProducts.length > 0 && (
          <div className="flex items-center justify-between bg-white border border-stone-200 rounded-2xl px-4 py-3.5 shadow-xs mt-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0">
                <ChefHat className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="font-black text-xs text-stone-900">¡Gracias por elegirnos!</p>
                <p className="text-[10px] text-stone-500 font-medium">Disfruta lo mejor de nuestra cocina.</p>
              </div>
            </div>
            {onViewDailyMenu && (
              <button
                onClick={onViewDailyMenu}
                className="flex items-center gap-1.5 border border-stone-300 rounded-2xl px-3 py-2 text-xs font-black text-stone-700 hover:border-amber-500 hover:text-amber-800 transition-colors whitespace-nowrap"
              >
                Ver Menú del Día
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

      </main>

      {/* ════════════════════════════════
          BARRA DE CANASTA FLOTANTE
      ════════════════════════════════ */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-stone-900 text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl border border-stone-800 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-stone-900 flex items-center justify-center font-mono font-black text-xs shadow-xs">
                {totalItems}
              </div>
              <div className="text-left">
                <div className="font-black text-xs">Ver Canasta de Pedido</div>
                <div className="text-[10px] text-stone-400 font-medium">Toca para confirmar</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-amber-400 text-base">{settings.currency} {totalAmount.toFixed(2)}</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </button>
        </div>
      )}

      {/* ════════════════════════════════
          MODAL — DETALLE DE PLATO
      ════════════════════════════════ */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom-6">

            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 block mb-0.5">{selectedProduct.category}</span>
                <h3 className="font-black text-base text-stone-900 leading-snug">{selectedProduct.name}</h3>
                <span className="font-mono font-black text-amber-600 text-sm block mt-0.5">{settings.currency} {selectedProduct.price.toFixed(2)}</span>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-stone-900 uppercase block">Elige tu guarnición:</label>
              <div className="grid grid-cols-2 gap-2">
                {['Papas Fritas Clásicas', 'Papas Doradas al Horno', 'Arroz Chaufa', 'Ensalada Fresca'].map(side => (
                  <button
                    key={side}
                    onClick={() => setModalSide(side)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold text-left transition',
                      modalSide === side
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    )}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 block mb-1">Indicaciones especiales (opcional):</label>
              <input
                type="text"
                placeholder="Ej. sin tártara, bien dorado..."
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
              <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} className="w-8 h-8 rounded-lg bg-white font-black text-sm flex items-center justify-center shadow-xs">-</button>
                <span className="w-8 text-center font-mono font-black text-xs">{modalQty}</span>
                <button onClick={() => setModalQty(modalQty + 1)} className="w-8 h-8 rounded-lg bg-white font-black text-sm flex items-center justify-center shadow-xs">+</button>
              </div>
              <button
                onClick={() => { addToCart(selectedProduct, modalQty, modalSide, modalNotes); setSelectedProduct(null); }}
                className="flex-1 py-3 bg-stone-900 hover:bg-black text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
              >
                <span>Agregar al Pedido ·</span>
                <span className="font-mono text-amber-400">{settings.currency} {(selectedProduct.price * modalQty).toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════
          MODAL — CHECKOUT
      ════════════════════════════════ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom-6">

            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-900 flex items-center justify-center font-black text-xs">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900">Tu Canasta de Pedido</h3>
                  <span className="text-[10px] text-stone-400 font-medium">{totalItems} platos seleccionados</span>
                </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 text-xs">
                  <div className="flex-1 pr-2">
                    <p className="font-black text-stone-900">{item.product.name}</p>
                    {item.selectedOption && <p className="text-[10px] text-stone-500">{item.selectedOption}</p>}
                    <span className="font-mono font-bold text-xs">{settings.currency} {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center bg-white border border-stone-200 rounded-lg px-2 py-0.5 gap-2">
                    <button onClick={() => updateQty(item.product.id, -1, item.selectedOption)} className="font-black text-stone-500 hover:text-stone-900">-</button>
                    <span className="font-mono font-black text-xs">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1, item.selectedOption)} className="font-black text-stone-500 hover:text-stone-900">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Modalidad</span>
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                {(['delivery', 'salon', 'recojo'] as const).map(t => (
                  <button key={t} onClick={() => setOrderType(t)} className={cn('flex-1 py-1.5 rounded-lg text-xs font-black transition', orderType === t ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600')}>
                    {t === 'delivery' ? 'Delivery' : t === 'salon' ? 'En Mesa' : 'Recojo'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Tu nombre..." value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold outline-none" />
                <input type="text" placeholder="WhatsApp..." value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold outline-none" />
              </div>
              {orderType === 'delivery' && (
                <input type="text" placeholder="Dirección de entrega..." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold outline-none" />
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500 shrink-0">Pago:</span>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="flex-1 bg-white border border-stone-200 rounded-xl p-1.5 text-xs font-bold outline-none">
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 border-t border-stone-100 pt-2.5 text-xs">
              <div className="flex justify-between text-stone-600 font-semibold">
                <span>Subtotal:</span><span className="font-mono">{settings.currency} {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600 font-semibold">
                <span>Envío:</span><span className="font-mono">{deliveryFee === 0 ? '¡GRATIS!' : `${settings.currency} ${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1.5 border-t border-stone-200">
                <span>TOTAL:</span><span className="font-mono text-amber-600 text-base">{settings.currency} {totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={sendWhatsApp}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Confirmar Pedido por WhatsApp
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
