import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Product, ProductCategory, Settings } from '../../types';
import { POS_CATEGORIES } from './posConstants';
import { formatMoney } from '../../lib/formatters';

interface POSProductCatalogProps {
  products: Product[];
  selectedCategory: ProductCategory | "Todos";
  onSelectCategory: (cat: ProductCategory | "Todos") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddProduct: (product: Product) => void;
  settings: Settings;
}

export const POSProductCatalog: React.FC<POSProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddProduct,
  settings,
}) => {
  const filteredProducts = products.filter((p) => {
    const mc = selectedCategory === "Todos" || p.category === selectedCategory;
    const ms = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return mc && ms;
  });

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
      {/* Barra de Búsqueda y Categorías */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar plato o bebida (ej: Pollo, Chaufa, Chicha)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {POS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
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
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((prod) => (
            <button
              key={prod.id}
              onClick={() => onAddProduct(prod)}
              className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs hover:border-amber-400 hover:shadow-md active:scale-95 transition-all text-left flex flex-col justify-between gap-2 group cursor-pointer"
            >
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
                <div className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-amber-500 group-hover:text-white text-stone-600 flex items-center justify-center transition">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
