import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { ViewState } from "../../App";
import { 
  PackagePlus, Trash2, Edit2, Search, X, CheckCircle2, 
  UtensilsCrossed, Trophy, Tag, Plus, Layers, AlertCircle,
  FolderEdit, Check, ArrowRight, Sparkles, ChefHat
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { Product } from "../../types";

const DEFAULT_CATEGORIES_LASLOMAS = [
  'Combos & Promos', 'Pollos a la Brasa', 'Parrillas & Mostros',
  'Entradas & Chaufa', 'Guarniciones & Salsas', 'Bebidas & Refrescos', 'Postres', 'Otros'
];

const DEFAULT_CATEGORIES_PARADERO = [
  'Ceviches & Tiraditos', 'Chicharrones & Mariscos', 'Arroces & Chaufas Marinos',
  'Parihuelas & Chilcanos', 'Piqueos & Causas', 'Bebidas & Cocteles', 'Postres', 'Otros'
];

const STATIONS = [
  'Cocina & Parrilla',
  'Horno & Pollos',
  'Barra & Bebidas',
  'Estación Postres',
  'Caja & Facturación'
];

export default function ProductsList({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateProductStock, 
    renameCategory, 
    deleteCategory, 
    currentUser,
    settings 
  } = useAppStore();

  const isOwner = currentUser?.role === 'Owner';

  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const defaultCats = isParadero ? DEFAULT_CATEGORIES_PARADERO : DEFAULT_CATEGORIES_LASLOMAS;

  // ── Categorías dinámicas unificadas ──
  const dynamicCategories = useMemo(() => {
    const fromProducts = products.map(p => p.category?.trim()).filter(Boolean);
    const combined = Array.from(new Set([...defaultCats, ...fromProducts])).sort();
    return combined;
  }, [products, defaultCats]);

  // ── Estados de Formulario de Plato (Crear y Editar) ──
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formCategory, setFormCategory] = useState(dynamicCategories[0] || 'Combos & Promos');
  const [formStation, setFormStation] = useState('Cocina & Parrilla');
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // ── Estados de Búsqueda y Filtros ──
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("Todos");

  // ── Estados de Gestión de Categorías ──
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [renamedCategoryInput, setRenamedCategoryInput] = useState('');
  const [newCategoryModalInput, setNewCategoryModalInput] = useState('');

  // ── Diálogos Auxiliares ──
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    value: string;
    onConfirm: (v: string) => void;
  }>({
    isOpen: false, title: '', message: '', value: '', onConfirm: () => {}
  });

  // ── Abrir Formulario en Modo Creación ──
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormStock('');
    setFormCategory(dynamicCategories[0] || 'Combos & Promos');
    setFormStation('Cocina & Parrilla');
    setIsCreatingNewCat(false);
    setNewCatInput('');
    setIsFormOpen(true);
  };

  // ── Abrir Formulario en Modo Edición ──
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(prod.price.toString());
    setFormStock(prod.stock !== undefined && prod.stock !== null ? prod.stock.toString() : '');
    setFormCategory(prod.category);
    setFormStation(prod.station || 'Cocina & Parrilla');
    setIsCreatingNewCat(false);
    setNewCatInput('');
    setIsFormOpen(true);
  };

  // ── Guardar Plato (Creación o Edición) ──
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;

    // Determinar categoría final
    let finalCategory = formCategory;
    if (isCreatingNewCat && newCatInput.trim()) {
      finalCategory = newCatInput.trim();
    }

    const parsedPrice = parseFloat(formPrice);
    const parsedStock = formStock.trim() === '' ? undefined : parseInt(formStock, 10);
    const validStock = isNaN(parsedStock as any) ? undefined : parsedStock;

    if (editingProduct) {
      // Modo Edición
      updateProduct(editingProduct.id, {
        name: formName.trim(),
        price: parsedPrice,
        category: finalCategory,
        stock: validStock,
        station: formStation || undefined,
      });
    } else {
      // Modo Creación
      addProduct(
        formName.trim(),
        parsedPrice,
        finalCategory,
        validStock,
        formStation || undefined
      );
    }

    setIsFormOpen(false);
  };

  // ── Actualizar Stock Rápido ──
  const handleQuickStockChange = (productId: string, currentStock?: number) => {
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

  // ── Guardar Nueva Categoría desde Modal de Categorías ──
  const handleAddNewCategoryModal = (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryModalInput.trim();
    if (!catName) return;
    if (dynamicCategories.some(c => c.toLowerCase() === catName.toLowerCase())) {
      alert('Esta categoría ya existe.');
      return;
    }
    addProduct(
      `Nuevo Plato en ${catName}`,
      0,
      catName,
      undefined,
      'Cocina & Parrilla'
    );
    setNewCategoryModalInput('');
  };

  // ── Renombrar Categoría ──
  const handleRenameCategorySubmit = (oldCat: string) => {
    const newCat = renamedCategoryInput.trim();
    if (!newCat || newCat === oldCat) {
      setEditingCategoryName(null);
      return;
    }
    renameCategory(oldCat, newCat);
    setEditingCategoryName(null);
    setRenamedCategoryInput('');
  };

  // ── Eliminar Categoría ──
  const handleDeleteCategoryPrompt = (catToDelete: string) => {
    const count = products.filter(p => p.category === catToDelete).length;
    setConfirmDialog({
      isOpen: true,
      title: `Eliminar Categoría "${catToDelete}"`,
      message: `Esta categoría tiene ${count} plato(s). Si la eliminas, los platos se moverán a la categoría "Otros". ¿Deseas continuar?`,
      confirmText: 'Sí, eliminar categoría',
      onConfirm: () => {
        deleteCategory(catToDelete, 'Otros');
        if (activeCategoryFilter === catToDelete) {
          setActiveCategoryFilter('Todos');
        }
      }
    });
  };

  // ── Productos Filtrados ──
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategoryFilter === "Todos" || p.category === activeCategoryFilter;
      const matchSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCategoryFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">Gestión de Carta</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
              {products.length} platos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Administra los platos de tu carta, modifica sus precios, categorías y estaciones de cocina en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Botón Gestión de Categorías (Solo Owner) */}
          {isOwner && (
            <button 
              type="button"
              onClick={() => setIsCategoryModalOpen(true)} 
              className="h-11 px-4 bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-200 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs hover:border-stone-300 text-xs sm:text-sm"
              title="Administrar o renombrar categorías (Solo Owner)"
            >
              <Tag className="w-4 h-4 text-amber-600" /> 
              <span>Gestionar Categorías</span>
            </button>
          )}

          {/* Ranking */}
          <button 
            type="button"
            onClick={() => onNavigate({ name: "dish_ranking" })} 
            className="h-11 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-xs text-xs sm:text-sm cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> 
            <span>Ranking</span>
          </button>

          {/* Añadir Producto (Solo Owner) */}
          {isOwner ? (
            <button 
              type="button"
              onClick={handleOpenCreate} 
              className="h-11 px-5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 rounded-xl font-black flex items-center justify-center gap-2 transition shadow-sm shadow-amber-500/20 text-xs sm:text-sm cursor-pointer"
            >
              <PackagePlus className="w-4 h-4 stroke-[2.5]" /> 
              <span>Añadir Plato</span>
            </button>
          ) : (
            <div className="h-11 px-4 bg-stone-100 border border-stone-200 text-stone-500 rounded-xl font-bold text-xs flex items-center gap-1.5">
              <span>🔒 Carta protegida (Owner)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── FILTROS Y BÚSQUEDA ── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 mb-6 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Buscar por plato o categoría..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        {/* Píldoras de Categorías con scroll horizontal */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 custom-scrollbar">
          <button 
            onClick={() => setActiveCategoryFilter("Todos")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer shrink-0 border",
              activeCategoryFilter === "Todos" 
                ? "bg-stone-900 text-white border-stone-900 shadow-xs" 
                : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900"
            )}
          >
            Todos ({products.length})
          </button>

          {dynamicCategories.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            if (count === 0 && activeCategoryFilter !== cat) return null;
            return (
              <button 
                key={cat} 
                onClick={() => setActiveCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1.5 border",
                  activeCategoryFilter === cat 
                    ? "bg-amber-500 text-stone-950 border-amber-600 shadow-xs" 
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                )}
              >
                <span>{cat}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                  activeCategoryFilter === cat ? "bg-amber-600/30 text-stone-950" : "bg-stone-100 text-stone-600"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GRID DE PLATOS ── */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-3xl border border-stone-200 shadow-xs p-4 sm:p-5">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-stone-400 space-y-2">
            <UtensilsCrossed className="w-10 h-10 opacity-30 text-stone-500" />
            <p className="font-bold text-sm text-stone-700">No se encontraron platos</p>
            <p className="text-xs text-stone-400">
              {searchQuery ? `No hay resultados para "${searchQuery}".` : 'No hay platos registrados en esta categoría.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl hover:bg-amber-600 transition"
            >
              + Agregar Plato en {activeCategoryFilter === 'Todos' ? 'la Carta' : `"${activeCategoryFilter}"`}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="group border-2 border-stone-200 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all bg-white"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg line-clamp-1">
                      {product.category}
                    </span>

                    {/* Acciones de la Tarjeta */}
                    {/* Acciones de la Tarjeta (Solo Owner) */}
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        {/* Botón Editar Plato */}
                        <button 
                          type="button"
                          onClick={() => handleOpenEdit(product)} 
                          title="Editar plato y categoría (Solo Owner)"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-amber-500 hover:text-stone-950 text-stone-600 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Eliminar */}
                        <button 
                          type="button"
                          onClick={() => setConfirmDialog({ 
                            isOpen: true, 
                            title: 'Eliminar Plato', 
                            message: `¿Seguro que deseas eliminar "${product.name}" de la carta? (Solo Owner)`, 
                            confirmText: 'Sí, eliminar',
                            onConfirm: () => deleteProduct(product.id) 
                          })} 
                          title="Eliminar plato (Solo Owner)"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-rose-500 hover:text-white text-stone-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="font-black text-sm text-stone-900 leading-snug line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  {product.station && (
                    <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1 mt-1">
                      <ChefHat className="w-3 h-3 text-stone-400" />
                      <span>{product.station}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-3">
                  <span className="font-mono font-black text-base text-stone-900">
                    {settings.currency} {product.price.toFixed(2)}
                  </span>

                  <button 
                    type="button"
                    onClick={() => isOwner && handleQuickStockChange(product.id, product.stock)}
                    disabled={!isOwner}
                    title={isOwner ? "Clic para cambiar stock" : "Solo Owner puede modificar stock"}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black transition border",
                      isOwner ? "cursor-pointer" : "cursor-default opacity-80",
                      product.stock === undefined ? "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200" :
                      product.stock <= 5 ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" :
                      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    )}
                  >
                    Stock: {product.stock === undefined ? "∞ Ilimitado" : product.stock}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL FORMULARIO: CREAR O EDITAR PLATO ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveProduct} 
            className="bg-white rounded-3xl w-full max-w-xl border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  {editingProduct ? <Edit2 className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    {editingProduct ? 'Editar Plato en la Carta' : 'Añadir Nuevo Plato a la Carta'}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {editingProduct ? 'Modifica el nombre, precio, categoría o estación del plato.' : 'Completa la información del nuevo plato o bebida.'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Nombre del Plato */}
              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1.5">
                  Nombre del Plato / Producto <span className="text-amber-600">*</span>
                </label>
                <input 
                  autoFocus 
                  placeholder="Ej. Pollo a la Brasa 1/4, Ceviche Mixto Especial..." 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  required
                  className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Sección de Categoría con opción de Crear Nueva */}
              <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
                    Categoría del Plato <span className="text-amber-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewCat(!isCreatingNewCat);
                      setNewCatInput('');
                    }}
                    className="text-[11px] font-black text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isCreatingNewCat ? '← Elegir de categorías existentes' : '+ Escribir / Crear nueva categoría'}
                  </button>
                </div>

                {isCreatingNewCat ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Escribe el nombre de la nueva categoría (ej. Makis, Pastas, Tragos)..."
                      value={newCatInput}
                      onChange={e => setNewCatInput(e.target.value)}
                      required={isCreatingNewCat}
                      className="w-full bg-white border-2 border-amber-400 rounded-xl px-3.5 py-2.5 text-sm font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-400/30 transition placeholder:font-normal placeholder:text-stone-400"
                    />
                    <p className="text-[10px] text-stone-500 font-medium">
                      💡 Esta nueva categoría se creará y quedará disponible para todos los demás platos.
                    </p>
                  </div>
                ) : (
                  <select 
                    value={formCategory} 
                    onChange={e => {
                      if (e.target.value === '__NEW__') {
                        setIsCreatingNewCat(true);
                      } else {
                        setFormCategory(e.target.value);
                      }
                    }}
                    className="w-full bg-white border-2 border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {dynamicCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__NEW__" className="text-amber-700 font-black">
                      + [Crear una nueva categoría...]
                    </option>
                  </select>
                )}
              </div>

              {/* Grid: Precio, Stock, Estación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Precio */}
                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1.5">
                    Precio ({settings.currency}) <span className="text-amber-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-stone-400">
                      {settings.currency}
                    </span>
                    <input 
                      type="number" 
                      step="0.10" 
                      min="0" 
                      placeholder="0.00" 
                      value={formPrice} 
                      onChange={e => setFormPrice(e.target.value)} 
                      required
                      className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-black text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition font-mono"
                    />
                  </div>
                </div>

                {/* Stock Inicial */}
                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1.5">
                    Stock Disponible
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    placeholder="∞ Ilimitado" 
                    value={formStock} 
                    onChange={e => setFormStock(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition font-mono placeholder:text-stone-400 placeholder:font-normal"
                  />
                </div>

                {/* Estación de Comanda / Cocina */}
                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1.5">
                    Estación Comanda
                  </label>
                  <select
                    value={formStation}
                    onChange={e => setFormStation(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-2.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition cursor-pointer"
                  >
                    {STATIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center gap-2 transition shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> 
                <span>{editingProduct ? 'Guardar Cambios' : 'Añadir Plato a la Carta'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL GESTIONAR CATEGORÍAS ── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">Administrador de Categorías</h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Crea, renombra o elimina categorías de tu carta.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCategoryModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Formulario Rápido de Añadir Categoría */}
              <form onSubmit={handleAddNewCategoryModal} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la nueva categoría..."
                  value={newCategoryModalInput}
                  onChange={e => setNewCategoryModalInput(e.target.value)}
                  className="flex-1 bg-stone-50 border-2 border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!newCategoryModalInput.trim()}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear</span>
                </button>
              </form>

              {/* Lista de Categorías Existentes */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                <p className="text-[11px] font-black uppercase text-stone-400 tracking-wider">
                  Categorías en Uso ({dynamicCategories.length})
                </p>

                {dynamicCategories.map(cat => {
                  const dishCount = products.filter(p => p.category === cat).length;
                  const isEditingThis = editingCategoryName === cat;

                  return (
                    <div 
                      key={cat}
                      className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl gap-2 hover:bg-amber-50/30 transition"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            autoFocus
                            type="text"
                            value={renamedCategoryInput}
                            onChange={e => setRenamedCategoryInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameCategorySubmit(cat);
                              if (e.key === 'Escape') setEditingCategoryName(null);
                            }}
                            className="flex-1 bg-white border-2 border-amber-500 rounded-lg px-2.5 py-1 text-xs font-black text-stone-900 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameCategorySubmit(cat)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                            title="Confirmar cambio"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryName(null)}
                            className="p-1.5 bg-stone-200 text-stone-600 rounded-lg hover:bg-stone-300 transition"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-bold text-xs text-stone-900 truncate">{cat}</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 shrink-0">
                              {dishCount} platos
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryName(cat);
                                setRenamedCategoryInput(cat);
                              }}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                              title="Renombrar categoría"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteCategoryPrompt(cat)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DIALOG ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-stone-900 mb-1">{confirmDialog.title}</h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2.5 justify-end">
              <button 
                type="button"
                onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))} 
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(p => ({ ...p, isOpen: false })); }} 
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
              >
                {confirmDialog.confirmText || 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMPT DIALOG (STOCK) ── */}
      {promptDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <form 
            onSubmit={e => { 
              e.preventDefault(); 
              promptDialog.onConfirm(promptDialog.value); 
              setPromptDialog(p => ({ ...p, isOpen: false })); 
            }} 
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200"
          >
            <h3 className="text-base font-black text-stone-900 mb-1">{promptDialog.title}</h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">{promptDialog.message}</p>
            <input 
              autoFocus 
              type="number" 
              placeholder="Vacío para ilimitado"
              value={promptDialog.value} 
              onChange={e => setPromptDialog(p => ({...p, value: e.target.value}))}
              className="w-full bg-stone-50 border-2 border-stone-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition mb-6"
            />
            <div className="flex gap-2.5 justify-end">
              <button 
                type="button" 
                onClick={() => setPromptDialog(p => ({ ...p, isOpen: false }))} 
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-stone-950 transition shadow-sm cursor-pointer"
              >
                Guardar Stock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
