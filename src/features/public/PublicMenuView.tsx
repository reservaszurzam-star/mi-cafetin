import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { ArrowLeft, Search, Coffee, Sparkles, Utensils, ChevronRight, Smartphone, List } from 'lucide-react';
import { cn } from "../../lib/utils";
import DailyMenuView from './DailyMenuView';
import RappiMobileStoreView from './RappiMobileStoreView';

type PublicMenuViewProps = {
  onBack?: () => void;
  initialMode?: 'mobile_app' | 'daily' | 'full';
};

export default function PublicMenuView({ onBack, initialMode = 'mobile_app' }: PublicMenuViewProps) {
  const { products, settings } = useAppStore();
  const [viewMode, setViewMode] = useState<'mobile_app' | 'daily' | 'full'>(initialMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const logoImage = isParadero ? '/Logo/logo-paradero-104.png' : (settings.logoUrl && settings.logoUrl !== '/icono.png' ? settings.logoUrl : '/Logo/logo-lomas-grill.png');

  // Modo 1: Interfaz Limpia por Cuadros (Nombre + Precio + Agregar)
  if (viewMode === 'mobile_app') {
    return (
      <RappiMobileStoreView
        onBack={onBack}
        onViewDailyMenu={() => setViewMode('daily')}
      />
    );
  }

  // Modo 2: Menú Ejecutivo del Día
  if (viewMode === 'daily') {
    return (
      <DailyMenuView 
        onBack={onBack} 
        onViewFullMenu={() => setViewMode('mobile_app')} 
      />
    );
  }

  // Modo 3: Carta Clásica
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col animate-in fade-in duration-300">
      
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-800/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {onBack ? (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors p-2 -ml-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold text-sm hidden sm:inline">Volver</span>
            </button>
          ) : (
            <div className="w-10"></div>
          )}

          <div className="flex items-center space-x-3 text-stone-900 dark:text-white font-display font-bold text-lg md:text-xl">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="w-8 h-8 rounded-full object-contain shadow-sm border border-stone-100 dark:border-stone-700 bg-white"
              onError={(e) => { e.currentTarget.src = '/LOGO OFICIAL.png'; }}
            />
            <span className="tracking-tight">{settings.companyName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('mobile_app')}
              className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-black transition shadow-sm flex items-center gap-1 hover:bg-stone-800"
            >
              <span>Ver Tienda Delivery</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        
        {/* Search and Welcome */}
        <div className="mb-8 text-center animate-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-white tracking-tight mb-4">
            Carta de Platos
          </h1>
          
          <div className="max-w-md mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar un plato o bebida..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200/70 focus:border-amber-500 dark:border-stone-800 dark:focus:border-amber-500 rounded-2xl pl-12 pr-4 py-3 font-bold text-stone-900 dark:text-white outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Categories (Horizontal Scroll) */}
        <div className="flex overflow-x-auto pb-4 mb-6 gap-2 custom-scrollbar snap-x animate-in slide-in-from-bottom-6 duration-500 delay-100 fill-mode-both">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "snap-start whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all border",
                activeCategory === cat 
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200/70 dark:border-stone-800 hover:border-amber-500/50"
              )}
            >
              {cat === 'all' ? 'Todos los Productos' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid en 2 Columnas */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4 pb-20 animate-in slide-in-from-bottom-8 duration-500 delay-200 fill-mode-both">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                className="bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/50 transition-colors shadow-sm group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-black text-stone-900 dark:text-white leading-tight text-sm">
                      {product.name}
                    </h3>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 mb-3">
                    {product.category}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-baseline gap-1 text-stone-900 dark:text-white">
                    <span className="text-xs font-bold text-stone-400">{settings.currency}</span>
                    <span className="text-lg font-black">{product.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 text-stone-400">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">No se encontraron productos</h3>
            <p className="text-stone-500 dark:text-stone-400">
              Intenta buscar con otros términos o cambia de categoría.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
