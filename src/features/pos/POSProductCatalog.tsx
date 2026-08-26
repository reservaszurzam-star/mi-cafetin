import React, { useMemo } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { Product, ProductCategory, Settings, RestaurantOrder } from '../../types';
import { formatMoney } from '../../lib/formatters';

interface POSProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddProduct: (product: Product) => void;
  settings: Settings;
  activeOrder?: RestaurantOrder | null;
}

export const POSProductCatalog: React.FC<POSProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddProduct,
  settings,
  activeOrder,
}) => {
  // Categorías dinámicas extraídas de los productos reales cargados
  const categories = useMemo(() => {
    const dynamicCats = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).sort();
    return ["Todos", ...dynamicCats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const mc = selectedCategory === "Todos" || p.category === selectedCategory;
      const ms = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return mc && ms;
    });
  }, [products, selectedCategory, searchQuery]);

  // Mapa de cantidades ya agregadas en la comanda activa
  const itemQuantities = useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(activeOrder?.items)) {
      for (const item of activeOrder.items) {
        if (!item) continue;
        const qty = Number(item.quantity) || 1;
        if (item.productId) {
          map.set(String(item.productId), (map.get(String(item.productId)) || 0) + qty);
        }
        if (item.productName && typeof item.productName === 'string') {
          map.set(item.productName.toLowerCase(), (map.get(item.productName.toLowerCase()) || 0) + qty);
        }
      }
    }
    return map;
  }, [activeOrder]);

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0">
      {/* Barra de Búsqueda y Categorías */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-stone-200 shadow-xs space-y-2.5 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar plato o bebida (ej: Pollo, Ceviche, Chaufa)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        {/* Píldoras de Categorías con scroll horizontal */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Platos / Catálogo Táctil */}
      <div className="flex-1 overflow-y-auto pr-1 pb-20 lg:pb-2">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-stone-400 border border-stone-200 space-y-2 my-4">
            <p className="font-black text-stone-700 text-sm">No hay platos disponibles</p>
            <p className="text-xs">
              {searchQuery ? `No encontramos platos con "${searchQuery}"` : 'No hay platos registrados en esta categoría.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
            {filteredProducts.map((prod) => {
              const qtyInOrder = itemQuantities.get(prod.id) || itemQuantities.get(prod.name.toLowerCase()) || 0;
              return (
                <button
                  key={prod.id}
                  onClick={() => onAddProduct(prod)}
                  className={`bg-white p-3 sm:p-3.5 rounded-2xl border shadow-xs hover:border-amber-400 hover:shadow-md active:scale-95 transition-all text-left flex flex-col justify-between gap-2 group cursor-pointer relative ${
                    qtyInOrder > 0 ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-stone-200'
                  }`}
                >
                  {qtyInOrder > 0 && (
                    <span className="absolute -top-2 -right-1.5 bg-amber-500 text-stone-950 font-mono font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> {qtyInOrder}
                    </span>
                  )}

                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                      {prod.category}
                    </span>
                    <h4 className="font-black text-xs text-stone-900 line-clamp-2 mt-1.5 leading-snug group-hover:text-amber-600 transition">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-auto">
                    <span className="text-sm font-black font-mono text-stone-900">
                      {formatMoney(prod.price, settings.currency)}
                    </span>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition shadow-2xs ${
                      qtyInOrder > 0 
                        ? 'bg-amber-500 text-stone-950' 
                        : 'bg-stone-100 group-hover:bg-amber-500 group-hover:text-white text-stone-600'
                    }`}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
