import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/StoreContext';
import { ViewState } from '../App';
import { PackagePlus, Trash2, Edit2, Search, X, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ProductsList({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { products, addProduct, deleteProduct, updateProductStock, settings } = useAppStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Combos & Promos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("Todos");

  const categories = [
    'Combos & Promos', 'Pollos a la Brasa', 'Parrillas & Mostros',
    'Entradas & Chaufa', 'Guarniciones & Salsas', 'Bebidas & Refrescos', 'Postres', 'Otros'
  ];

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    const parsedStock = stock.trim() === '' ? undefined : parseInt(stock, 10);
    addProduct(name.trim(), parseFloat(price), category, isNaN(parsedStock as any) ? undefined : parsedStock);
    setIsAdding(false);
    setName(''); setPrice(''); setStock('');
  };

  const handleStockChange = (productId: string, currentStock?: number) => {
    setPromptDialog({
      isOpen: true,
      title: 'Actualizar Stock',
      message: 'Ingresa el nuevo stock (deja en blanco para ilimitado):',
      value: currentStock != null ? currentStock.toString() : '',
      onConfirm: (newValue) => {
        if (newValue.trim() === '') updateProductStock(productId, undefined as any);
        else {
          const newStock = parseInt(newValue, 10);
          if (!isNaN(newStock) && newStock >= 0) updateProductStock(productId, newStock);
        }
      }
    });
  };

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const [promptDialog, setPromptDialog] = useState<{isOpen: boolean, title: string, message: string, value: string, onConfirm: (v: string) => void}>({
    isOpen: false, title: '', message: '', value: '', onConfirm: () => {}
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategoryFilter === "Todos" || p.category === activeCategoryFilter;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategoryFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">Gestión de Carta</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Administra tus productos, precios e inventario.</p>
        </div>
        <button onClick={() => setIsAdding(true)} 
          className="h-11 px-5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-amber-500/30"
        >
          <PackagePlus className="w-5 h-5" /> Añadir Producto
        </button>
      </div>

      {/* ── FILTROS Y BÚSQUEDA ── */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 p-3 mb-6 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" placeholder="Buscar producto..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-amber-500 transition-colors dark:text-white"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full scrollbar-none pb-1 sm:pb-0">
          {["Todos", ...categories].map(cat => (
            <button key={cat} onClick={() => setActiveCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activeCategoryFilter === cat 
                  ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID DE PRODUCTOS ── */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm p-4">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400">
            <UtensilsCrossed className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map(product => (
              <div key={product.id} className="group border border-stone-200 dark:border-stone-800 rounded-xl p-3 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all bg-stone-50/50 dark:bg-stone-800/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-black tracking-widest uppercase text-amber-600 dark:text-amber-400 mb-1 block">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white leading-tight line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                  </div>
                  {/* Acciones (visibles en hover o móviles) */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleStockChange(product.id, product.stock)} title="Editar Stock"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all"
                    ><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setConfirmDialog({ isOpen: true, title: 'Eliminar', message: '¿Seguro que deseas eliminar este producto?', onConfirm: () => deleteProduct(product.id) })} title="Eliminar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-700/50 mt-1">
                  <span className="font-mono font-black text-base text-stone-900 dark:text-white">
                    {settings.currency} {product.price.toFixed(2)}
                  </span>
                  <div className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-bold",
                    product.stock === undefined ? "bg-stone-100 dark:bg-stone-800 text-stone-500" :
                    product.stock <= 5 ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400" :
                    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  )}>
                    Stock: {product.stock === undefined ? "∞" : product.stock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL AÑADIR ── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddProduct} className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
              <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2"><PackagePlus className="w-5 h-5 text-amber-500" /> Nuevo Producto</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Nombre del Plato / Producto</label>
                <input autoFocus placeholder="Ej. Chaufa de Mariscos..." value={name} onChange={e => setName(e.target.value)} required
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-colors dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Categoría</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-colors dark:text-white appearance-none"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Precio ({settings.currency})</label>
                <input type="number" step="0.10" min="0" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} required
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-colors dark:text-white font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Stock Inicial (Opcional)</label>
                <input type="number" min="0" placeholder="Dejar vacío para stock ilimitado" value={stock} onChange={e => setStock(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-colors dark:text-white"
                />
              </div>
            </div>

            <div className="p-5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition shadow shadow-amber-500/20"><CheckCircle2 className="w-4 h-4" /> Guardar Producto</button>
            </div>
          </form>
        </div>
      )}

      {/* ── CONFIRM DIALOG ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-stone-900 dark:text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} className="px-4 py-2 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition">Cancelar</button>
              <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(p => ({ ...p, isOpen: false })); }} className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white transition shadow shadow-rose-500/20">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMPT DIALOG ── */}
      {promptDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <form onSubmit={e => { e.preventDefault(); promptDialog.onConfirm(promptDialog.value); setPromptDialog(p => ({ ...p, isOpen: false })); }} className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-stone-900 dark:text-white mb-2">{promptDialog.title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">{promptDialog.message}</p>
            <input autoFocus type="number" value={promptDialog.value} onChange={e => setPromptDialog(p => ({...p, value: e.target.value}))}
              className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 transition-colors mb-6 dark:text-white"
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setPromptDialog(p => ({ ...p, isOpen: false }))} className="px-4 py-2 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow shadow-amber-500/20">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
