import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Check, Utensils, BookOpen, Sparkles, Soup, 
  Coffee, Cake, Flame, ChefHat, Clock, ArrowLeft, ArrowRight,
  Layers, ShoppingBag, X, CheckCircle2, ChevronRight
} from 'lucide-react';
import { 
  Product, ProductCategory, Settings, RestaurantOrder, 
  DailyMenuItem, DailyMenuCourse 
} from '../../types';
import { formatMoney } from '../../lib/formatters';

interface POSProductCatalogProps {
  products: Product[];
  dailyMenuItems?: DailyMenuItem[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddProduct: (product: Product) => void;
  onAddDailyMenuItem?: (item: DailyMenuItem) => void;
  onAddDailyMenuCombo?: (combo: {
    starter?: DailyMenuItem | null;
    main: DailyMenuItem;
    drink?: DailyMenuItem | null;
    dessert?: DailyMenuItem | null;
    notes?: string;
  }) => void;
  settings: Settings;
  activeOrder?: RestaurantOrder | null;
  tenantId?: string;
}

export const POSProductCatalog: React.FC<POSProductCatalogProps> = ({
  products,
  dailyMenuItems = [],
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onAddProduct,
  onAddDailyMenuItem,
  onAddDailyMenuCombo,
  settings,
  activeOrder,
  tenantId,
}) => {
  const isParadero = tenantId === 'paradero' || settings.companyName.toLowerCase().includes('paradero');

  // Modo del catálogo: 'select' (Selector inicial de 2 opciones), 'menu_del_dia' o 'carta_completa'
  const [catalogMode, setCatalogMode] = useState<'select' | 'menu_del_dia' | 'carta_completa'>('select');

  // Filtro de tiempo en Menú del Día ('todos' | 'entrada' | 'fondo' | 'bebida' | 'postre')
  const [selectedCourse, setSelectedCourse] = useState<string>('todos');

  // Modal para Armar Menú del Día Completo
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [selectedStarter, setSelectedStarter] = useState<DailyMenuItem | null>(null);
  const [selectedMain, setSelectedMain] = useState<DailyMenuItem | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<DailyMenuItem | null>(null);
  const [selectedDessert, setSelectedDessert] = useState<DailyMenuItem | null>(null);
  const [comboNotes, setComboNotes] = useState('');

  // Precios y configuración del menú del día según el negocio
  const defaultTiers = isParadero ? [16, 18, 22, 26] : [14, 16, 18, 22];
  const defaultTierLabels = isParadero ? ['Clásico', 'Ejecutivo', 'Marino', 'Especial'] : ['Económico', 'Clásico', 'Ejecutivo', 'Especial'];
  const menuTiers = settings.dailyMenuPriceTiers && settings.dailyMenuPriceTiers.length === 4 ? settings.dailyMenuPriceTiers : defaultTiers;
  const menuTierLabels = settings.dailyMenuTierLabels && settings.dailyMenuTierLabels.length === 4 ? settings.dailyMenuTierLabels : defaultTierLabels;
  const baseMenuPrice = settings.dailyMenuPrice || menuTiers[1] || (isParadero ? 18.00 : 16.00);

  const menuTitle = settings.dailyMenuTitle || (isParadero ? 'Almuerzo Marino Ejecutivo' : 'Almuerzo Criollo & Brasas');
  const menuSubtitle = settings.dailyMenuSubtitle || (isParadero ? 'Chilcano o Causa + Plato Marino + Refresco Natural' : 'Sopa o Entrada + Plato de Fondo + Bebida');

  // Categorías de la Carta Completa
  const categories = useMemo(() => {
    const dynamicCats = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ).sort();
    return ["Todos", ...dynamicCats];
  }, [products]);

  // Ítems de Menú del Día por tiempo
  const starters = useMemo(() => dailyMenuItems.filter(i => i.course === 'entrada' && i.available), [dailyMenuItems]);
  const mains = useMemo(() => dailyMenuItems.filter(i => i.course === 'fondo' && i.available), [dailyMenuItems]);
  const drinks = useMemo(() => dailyMenuItems.filter(i => i.course === 'bebida' && i.available), [dailyMenuItems]);
  const desserts = useMemo(() => dailyMenuItems.filter(i => i.course === 'postre' && i.available), [dailyMenuItems]);

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

  // Productos de Carta Completa filtrados por búsqueda
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const mc = selectedCategory === "Todos" || p.category === selectedCategory;
      const ms = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return mc && ms;
    });
  }, [products, selectedCategory, searchQuery]);

  // Productos agrupados por Categoría para mostrar Secciones marcadas
  const productsByCategory = useMemo(() => {
    const groups: { category: string; items: Product[] }[] = [];
    
    // Si seleccionó una categoría específica (no "Todos")
    if (selectedCategory !== "Todos") {
      const items = filteredProducts.filter(p => p.category === selectedCategory);
      if (items.length > 0) {
        groups.push({ category: selectedCategory, items });
      }
      return groups;
    }

    // Si seleccionó "Todos" o está buscando libremente
    const catsInFiltered = Array.from(new Set(filteredProducts.map(p => p.category).filter(Boolean))) as string[];
    catsInFiltered.sort();
    for (const cat of catsInFiltered) {
      const items = filteredProducts.filter(p => p.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    }
    return groups;
  }, [filteredProducts, selectedCategory]);

  // Ítems de Menú del Día filtrados por búsqueda y por curso
  const filteredDailyItems = useMemo(() => {
    return dailyMenuItems.filter((item) => {
      if (!item.available) return false;
      const matchCourse = selectedCourse === 'todos' || item.course === selectedCourse;
      const matchSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCourse && matchSearch;
    });
  }, [dailyMenuItems, selectedCourse, searchQuery]);

  // Ítems de Menú agrupados por Cursos / Secciones
  const dailySections = useMemo(() => {
    const sections = [];
    const ent = filteredDailyItems.filter(i => i.course === 'entrada');
    const fon = filteredDailyItems.filter(i => i.course === 'fondo');
    const beb = filteredDailyItems.filter(i => i.course === 'bebida');
    const pos = filteredDailyItems.filter(i => i.course === 'postre');

    if (selectedCourse === 'todos' || selectedCourse === 'entrada') {
      if (ent.length > 0) sections.push({ key: 'entrada', title: '🥣 Entradas & Sopas del Día', subtitle: 'Selecciona una entrada incluida o porción extra', items: ent });
    }
    if (selectedCourse === 'todos' || selectedCourse === 'fondo') {
      if (fon.length > 0) sections.push({ key: 'fondo', title: '🍛 Platos de Fondo / Segundos', subtitle: 'Plato principal con guarnición incluida', items: fon });
    }
    if (selectedCourse === 'todos' || selectedCourse === 'bebida') {
      if (beb.length > 0) sections.push({ key: 'bebida', title: '🥤 Bebidas & Refrescos del Día', subtitle: 'Vaso de refresco natural o bebida', items: beb });
    }
    if (selectedCourse === 'todos' || selectedCourse === 'postre') {
      if (pos.length > 0) sections.push({ key: 'postre', title: '🍰 Postres del Día (Opcionales)', subtitle: 'Porción dulce para complementar el almuerzo', items: pos });
    }
    return sections;
  }, [filteredDailyItems, selectedCourse]);

  // Helper para icono de categoría
  const getCategoryIcon = (categoryName: string) => {
    const cat = categoryName.toLowerCase();
    if (cat.includes('pollo') || cat.includes('brasa')) return <Flame className="w-4 h-4 text-orange-500" />;
    if (cat.includes('parrilla') || cat.includes('carne') || cat.includes('mostro')) return <ChefHat className="w-4 h-4 text-red-500" />;
    if (cat.includes('sopa') || cat.includes('caldo') || cat.includes('chilcano')) return <Soup className="w-4 h-4 text-amber-500" />;
    if (cat.includes('bebida') || cat.includes('refresco') || cat.includes('gaseosa') || cat.includes('cerveza')) return <Coffee className="w-4 h-4 text-sky-500" />;
    if (cat.includes('postre') || cat.includes('dulce')) return <Cake className="w-4 h-4 text-pink-500" />;
    if (cat.includes('combo') || cat.includes('promo') || cat.includes('familiar')) return <Sparkles className="w-4 h-4 text-purple-500" />;
    if (cat.includes('guarnicion') || cat.includes('salsa') || cat.includes('extra')) return <Layers className="w-4 h-4 text-emerald-500" />;
    return <Utensils className="w-4 h-4 text-stone-500" />;
  };

  // Handler para agregar ítem de Menú del Día directamente
  const handleAddDailyDirect = (item: DailyMenuItem) => {
    if (onAddDailyMenuItem) {
      onAddDailyMenuItem(item);
    } else {
      let price = 0;
      let station = "Cocina & Parrilla";
      let prefix = "";
      if (item.course === 'fondo') {
        price = item.price || baseMenuPrice;
        station = "Cocina & Parrilla";
      } else if (item.course === 'postre') {
        price = item.extraPrice || settings.dailyMenuDefaultDessertPrice || 3.50;
        station = "Estación Postres";
        prefix = "Postre: ";
      } else if (item.course === 'bebida') {
        price = item.extraPrice || settings.dailyMenuExtraDrinkPrice || 3.00;
        station = "Barra & Bebidas";
        prefix = "Bebida: ";
      } else if (item.course === 'entrada') {
        price = item.extraPrice || settings.dailyMenuExtraStarterPrice || 5.00;
        station = "Cocina & Parrilla";
        prefix = "Entrada: ";
      }

      onAddProduct({
        id: item.id,
        name: `${prefix}${item.name}`,
        price,
        category: `Menú: ${item.course === 'fondo' ? 'Platos de Fondo' : item.course === 'entrada' ? 'Entradas' : item.course === 'bebida' ? 'Bebidas' : 'Postres'}`,
        station,
      });
    }
  };

  // Handler para abrir modal de combo completo
  const handleOpenComboModal = (preselectedMain?: DailyMenuItem) => {
    if (preselectedMain) {
      setSelectedMain(preselectedMain);
    } else if (mains.length > 0 && !selectedMain) {
      setSelectedMain(mains[0]);
    }
    if (starters.length > 0 && !selectedStarter) {
      setSelectedStarter(starters[0]);
    }
    if (drinks.length > 0 && !selectedDrink) {
      setSelectedDrink(drinks[0]);
    }
    setIsComboModalOpen(true);
  };

  // Confirmar y agregar Combo Completo a la Comanda
  const handleConfirmCombo = () => {
    if (!selectedMain) return;

    if (onAddDailyMenuCombo) {
      onAddDailyMenuCombo({
        starter: selectedStarter,
        main: selectedMain,
        drink: selectedDrink,
        dessert: selectedDessert,
        notes: comboNotes.trim() || undefined,
      });
    } else {
      const mainPrice = selectedMain.price || baseMenuPrice;
      const dessertPrice = selectedDessert ? (selectedDessert.extraPrice || settings.dailyMenuDefaultDessertPrice || 3.50) : 0;
      const totalPrice = mainPrice + dessertPrice;

      const desc = [
        selectedStarter ? `Entrada: ${selectedStarter.name}` : null,
        selectedDrink ? `Bebida: ${selectedDrink.name}` : null,
        selectedDessert ? `Postre: ${selectedDessert.name}` : null,
        comboNotes.trim() ? `Nota: ${comboNotes.trim()}` : null,
      ].filter(Boolean).join(' | ');

      onAddProduct({
        id: `combo-${Date.now()}`,
        name: `Menú: ${selectedMain.name}${desc ? ` (${desc})` : ''}`,
        price: totalPrice,
        category: "Menú Ejecutivo Completo",
        station: "Cocina & Parrilla",
      });
    }

    setIsComboModalOpen(false);
    setComboNotes('');
    setSelectedDessert(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── VISTA 1: SELECTOR DE 2 OPCIONES (ANTES DE VER LOS PLATOS) ────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (catalogMode === 'select') {
    return (
      <div className="flex-1 flex flex-col justify-start items-center p-2.5 sm:p-6 overflow-y-auto bg-stone-50/50 rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs min-h-0">
        <div className="w-full max-w-3xl space-y-3 sm:space-y-5 my-auto py-1 sm:py-4 pb-20 sm:pb-4 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Encabezado Principal */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{settings.companyName || (isParadero ? 'Paradero 104' : 'Las Lomas Grill')}</span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-stone-900 tracking-tight">
              ¿Qué deseas ordenar en el POS?
            </h2>
            <p className="text-[11px] sm:text-sm text-stone-600 max-w-lg mx-auto font-medium">
              Selecciona una opción para ver los platos en 2 columnas:
            </p>
          </div>

          {/* ── 2 GRANDES TARJETAS DE SELECCIÓN ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 pt-1">
            
            {/* OPCIÓN 1: MENÚ DEL DÍA */}
            <div
              onClick={() => setCatalogMode('menu_del_dia')}
              className="group relative bg-white hover:bg-amber-50/40 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-stone-200 hover:border-amber-500 shadow-2xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-left active:scale-[0.98]"
            >
              <div className="space-y-2 sm:space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Soup className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-amber-700 bg-amber-100/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-amber-300">
                    Desde {formatMoney(baseMenuPrice, settings.currency)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-lg font-black text-stone-900 group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                    <span>🍽️ Menú del Día</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs font-bold text-amber-800 mt-0.5">
                    {menuTitle}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {menuSubtitle}
                  </p>
                </div>

                {/* Resumen de Opciones */}
                <div className="grid grid-cols-2 gap-1 sm:gap-1.5 pt-1.5 sm:pt-2 border-t border-stone-100 text-[10px] sm:text-[11px] font-bold text-stone-600">
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-stone-50 px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-stone-200/60">
                    <span className="text-amber-500">🥣</span>
                    <span>{starters.length} Entradas</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-stone-50 px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-stone-200/60">
                    <span className="text-amber-500">🍛</span>
                    <span>{mains.length} Fondos</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-stone-50 px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-stone-200/60">
                    <span className="text-amber-500">🥤</span>
                    <span>{drinks.length} Bebidas</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-stone-50 px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-stone-200/60">
                    <span className="text-amber-500">🍰</span>
                    <span>{desserts.length} Postres</span>
                  </div>
                </div>
              </div>

              {/* Botón de Entrada */}
              <div className="mt-3 sm:mt-5 pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-black text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Ingresar a Menú del Día
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-100 group-hover:bg-amber-500 text-amber-900 group-hover:text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            </div>

            {/* OPCIÓN 2: CARTA COMPLETA */}
            <div
              onClick={() => setCatalogMode('carta_completa')}
              className="group relative bg-white hover:bg-stone-50 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-stone-200 hover:border-stone-800 shadow-2xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between text-left active:scale-[0.98]"
            >
              <div className="space-y-2 sm:space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black text-stone-700 bg-stone-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-stone-200">
                    {products.length} Platos
                  </span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-lg font-black text-stone-900 group-hover:text-stone-700 transition-colors flex items-center gap-1.5">
                    <span>📜 Carta Completa</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs font-bold text-stone-700 mt-0.5">
                    {isParadero ? 'Ceviches, Chicharrones, Sopas & Parrillas' : 'Pollos a la Brasa, Parrillas, Combos & Guarniciones'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                    Toda la carta en 2 columnas organizadas por secciones.
                  </p>
                </div>

                {/* Resumen de Categorías */}
                <div className="space-y-1 sm:space-y-1.5 pt-1.5 sm:pt-2 border-t border-stone-100 text-[10px] sm:text-[11px] font-bold text-stone-600">
                  <div className="flex flex-wrap gap-1">
                    {categories.filter(c => c !== "Todos").slice(0, 4).map(cat => (
                      <span key={cat} className="bg-stone-100 text-stone-700 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md sm:rounded-lg border border-stone-200/80 text-[9px] sm:text-[10px]">
                        {cat}
                      </span>
                    ))}
                    {categories.length > 5 && (
                      <span className="bg-amber-50 text-amber-800 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md sm:rounded-lg border border-amber-200 text-[9px] sm:text-[10px]">
                        +{categories.length - 5} más
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-stone-600 font-medium">
                    {categories.length - 1} secciones con precios oficiales.
                  </p>
                </div>
              </div>

              {/* Botón de Entrada */}
              <div className="mt-3 sm:mt-5 pt-2 sm:pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-black text-stone-900 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Ingresar a Carta Completa
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-stone-100 group-hover:bg-stone-900 text-stone-700 group-hover:text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── VISTAS ACTIVAS (MENÚ DEL DÍA O CARTA COMPLETA) ────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col gap-2.5 overflow-hidden min-h-0">
      
      {/* ── BARRA SUPERIOR: SELECTOR RÁPIDO ENTRE MODALIDADES + BÚSQUEDA ── */}
      <div className="bg-white p-3 rounded-3xl border border-stone-200 shadow-xs space-y-2.5 shrink-0">
        
        {/* Toggle Pestañas: Menú del Día vs Carta Completa + Botón Cambiar */}
        <div className="flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
            <button
              type="button"
              onClick={() => {
                setCatalogMode('menu_del_dia');
                onSearchChange('');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer ${
                catalogMode === 'menu_del_dia'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Soup className="w-3.5 h-3.5" />
              <span>Menú del Día</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/10 rounded-full font-mono">
                {dailyMenuItems.filter(i => i.available).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCatalogMode('carta_completa');
                onSearchChange('');
              }}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition cursor-pointer ${
                catalogMode === 'carta_completa'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Carta Completa</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
                {products.length}
              </span>
            </button>
          </div>

          {/* Botón Volver a las 2 Opciones */}
          <button
            type="button"
            onClick={() => setCatalogMode('select')}
            className="px-2.5 py-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition flex items-center gap-1 cursor-pointer"
            title="Volver a la selección inicial"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden sm:inline">Cambiar Modo</span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              catalogMode === 'menu_del_dia'
                ? "Buscar en menú del día (ej: Sopa, Pollo al Horno, Chicha)..."
                : "Buscar plato o bebida en la carta (ej: Pollo, Parrilla, Ceviche, Chaufa)..."
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-8 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Píldoras de Filtro según la modalidad */}
        {catalogMode === 'carta_completa' ? (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat !== "Todos" && getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
              {[
                { id: 'todos', label: 'Todos', count: dailyMenuItems.filter(i => i.available).length },
                { id: 'entrada', label: '🥣 Entradas', count: starters.length },
                { id: 'fondo', label: '🍛 Fondos', count: mains.length },
                { id: 'bebida', label: '🥤 Bebidas', count: drinks.length },
                { id: 'postre', label: '🍰 Postres', count: desserts.length },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourse(c.id)}
                  className={`px-3 py-1.2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1 ${
                    selectedCourse === c.id
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({c.count})</span>
                </button>
              ))}
            </div>

            {/* Botón Destacado: Armar Menú Completo */}
            <button
              type="button"
              onClick={() => handleOpenComboModal()}
              className="px-3 py-1.2 bg-stone-900 hover:bg-black text-amber-400 hover:text-amber-300 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Armar Menú Completo</span>
            </button>
          </div>
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── CUERPO: PLATOS REPARTIDOS EN 2 COLUMNAS Y SECCIONES MARCADAS ─── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pr-1 pb-28 sm:pb-6 space-y-4 sm:space-y-5">
        
        {catalogMode === 'carta_completa' ? (
          // ── CARTA COMPLETA: SECCIONES POR CATEGORÍA EN 2 COLUMNAS ──
          productsByCategory.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-stone-400 border border-stone-200 space-y-2 my-4">
              <p className="font-black text-stone-700 text-sm">No se encontraron platos</p>
              <p className="text-xs">
                {searchQuery ? `No hay resultados para "${searchQuery}"` : 'No hay platos registrados en esta categoría.'}
              </p>
            </div>
          ) : (
            productsByCategory.map(({ category, items }) => (
              <div key={category} className="space-y-2.5">
                
                {/* Encabezado de Sección de Categoría */}
                <div className="flex items-center justify-between pb-1.5 border-b-2 border-stone-200/80 sticky top-0 bg-stone-100/90 backdrop-blur-xs py-1 z-10 px-1 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-2xs">
                      {getCategoryIcon(category)}
                    </div>
                    <h3 className="font-black text-xs sm:text-sm text-stone-900 uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                    {items.length} {items.length === 1 ? 'plato' : 'platos'}
                  </span>
                </div>

                {/* GRID ESTRICTO DE 2 COLUMNAS */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {items.map((prod) => {
                    const qtyInOrder = itemQuantities.get(prod.id) || itemQuantities.get(prod.name.toLowerCase()) || 0;
                    return (
                      <button
                        key={prod.id}
                        onClick={() => onAddProduct(prod)}
                        className={`bg-white p-3 sm:p-3.5 rounded-2xl border shadow-2xs hover:border-amber-400 hover:shadow-md active:scale-95 transition-all text-left flex flex-col justify-between gap-2 group cursor-pointer relative min-h-[96px] ${
                          qtyInOrder > 0 ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-stone-200'
                        }`}
                      >
                        {qtyInOrder > 0 && (
                          <span className="absolute -top-2 -right-1.5 bg-amber-500 text-stone-950 font-mono font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 z-10">
                            <Check className="w-2.5 h-2.5" /> {qtyInOrder}
                          </span>
                        )}

                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            {prod.category}
                          </span>
                          <h4 className="font-black text-xs text-stone-900 line-clamp-2 mt-1 leading-snug group-hover:text-amber-600 transition">
                            {prod.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 mt-auto">
                          <span className="text-xs sm:text-sm font-black font-mono text-stone-900">
                            {formatMoney(prod.price, settings.currency)}
                          </span>
                          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center transition shadow-2xs ${
                            qtyInOrder > 0 
                              ? 'bg-amber-500 text-stone-950' 
                              : 'bg-stone-100 group-hover:bg-amber-500 group-hover:text-white text-stone-600'
                          }`}>
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            ))
          )
        ) : (
          // ── MENÚ DEL DÍA: SECCIONES POR CURSO EN 2 COLUMNAS ──
          dailySections.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-stone-400 border border-stone-200 space-y-2 my-4">
              <p className="font-black text-stone-700 text-sm">No hay platos de menú disponibles</p>
              <p className="text-xs">
                {searchQuery ? `No encontramos opciones con "${searchQuery}"` : 'No hay opciones registradas en este curso del menú.'}
              </p>
            </div>
          ) : (
            dailySections.map((section) => (
              <div key={section.key} className="space-y-2.5">
                
                {/* Encabezado de Sección de Curso */}
                <div className="flex items-center justify-between pb-1.5 border-b-2 border-amber-200/80 sticky top-0 bg-stone-100/90 backdrop-blur-xs py-1 z-10 px-1 rounded-xl">
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-stone-900 uppercase tracking-wide">
                      {section.title}
                    </h3>
                    <p className="text-[10px] text-stone-500 font-medium">
                      {section.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                    {section.items.length} {section.items.length === 1 ? 'opción' : 'opciones'}
                  </span>
                </div>

                {/* GRID ESTRICTO DE 2 COLUMNAS PARA MENÚ */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {section.items.map((item) => {
                    const price = item.course === 'fondo'
                      ? (item.price || baseMenuPrice)
                      : item.course === 'postre'
                      ? (item.extraPrice || settings.dailyMenuDefaultDessertPrice || 3.50)
                      : item.course === 'entrada'
                      ? (item.extraPrice || settings.dailyMenuExtraStarterPrice || 5.00)
                      : (item.extraPrice || settings.dailyMenuExtraDrinkPrice || 3.00);

                    const qtyInOrder = itemQuantities.get(item.id) || itemQuantities.get(item.name.toLowerCase()) || 0;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white p-3 sm:p-3.5 rounded-2xl border shadow-2xs hover:border-amber-400 hover:shadow-md transition-all text-left flex flex-col justify-between gap-2 relative min-h-[105px] ${
                          qtyInOrder > 0 ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-stone-200'
                        }`}
                      >
                        {qtyInOrder > 0 && (
                          <span className="absolute -top-2 -right-1.5 bg-amber-500 text-stone-950 font-mono font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 z-10">
                            <Check className="w-2.5 h-2.5" /> {qtyInOrder}
                          </span>
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              {item.course === 'fondo' ? (item.priceTier || 'Menú') : item.course}
                            </span>
                            {item.popular && (
                              <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                                ⭐ Popular
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-xs text-stone-900 line-clamp-2 mt-1 leading-snug">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-[10px] text-stone-600 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 mt-auto">
                          <span className="text-xs sm:text-sm font-black font-mono text-stone-900">
                            {item.course === 'fondo' ? (
                              formatMoney(price, settings.currency)
                            ) : (
                              <span className="text-[11px] text-stone-500 font-bold">
                                {item.course === 'postre' ? `+${formatMoney(price, settings.currency)}` : 'Incluido'}
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-1">
                            {item.course === 'fondo' && (
                              <button
                                type="button"
                                onClick={() => handleOpenComboModal(item)}
                                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-[10px] rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1"
                                title="Armar Menú Completo con este plato"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span className="hidden sm:inline">Armar</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAddDailyDirect(item)}
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center transition shadow-2xs cursor-pointer ${
                                qtyInOrder > 0 
                                  ? 'bg-amber-500 text-stone-950' 
                                  : 'bg-stone-100 hover:bg-amber-500 hover:text-white text-stone-600'
                              }`}
                              title="Agregar a la comanda"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))
          )
        )}

      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL RÁPIDO: ARMAR MENÚ EJECUTIVO COMPLETO (3 TOQUES) ───────── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {isComboModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900">
                    Armar Menú Ejecutivo Completo
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {menuTitle} • {settings.companyName || 'Restaurante'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComboModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido Selector por Pasos */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-left">
              
              {/* PASO 1: PLATO DE FONDO (PRINCIPAL) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-900 flex items-center justify-between">
                  <span>1. Elige Plato de Fondo (Principal) *</span>
                  <span className="text-[10px] text-amber-600 font-bold">Obligatorio</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mains.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMain(m)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                        selectedMain?.id === m.id
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-black text-xs text-stone-900 truncate">{m.name}</p>
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                          {m.priceTier || 'Menú'}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono text-stone-900 shrink-0">
                        {formatMoney(m.price || baseMenuPrice, settings.currency)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PASO 2: ENTRADA O SOPA */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-900 flex items-center justify-between">
                  <span>2. Elige Entrada o Sopa</span>
                  <span className="text-[10px] text-stone-500 font-bold">Incluida en el menú</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {starters.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStarter(s)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                        selectedStarter?.id === s.id
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <span className="font-black text-xs text-stone-900 truncate">{s.name}</span>
                      {selectedStarter?.id === s.id && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASO 3: BEBIDA O REFRESCO */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-900 flex items-center justify-between">
                  <span>3. Elige Bebida o Refresco</span>
                  <span className="text-[10px] text-stone-500 font-bold">Incluida en el menú</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {drinks.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDrink(d)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                        selectedDrink?.id === d.id
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <span className="font-black text-xs text-stone-900 truncate">{d.name}</span>
                      {selectedDrink?.id === d.id && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASO 4: POSTRE OPCIONAL */}
              {desserts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-stone-900 flex items-center justify-between">
                    <span>4. Postre del Día (Opcional)</span>
                    <span className="text-[10px] text-stone-500 font-bold">Adicional</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {desserts.map((pos) => {
                      const posPrice = pos.extraPrice || settings.dailyMenuDefaultDessertPrice || 3.50;
                      const isSel = selectedDessert?.id === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setSelectedDessert(isSel ? null : pos)}
                          className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                            isSel
                              ? 'border-pink-500 bg-pink-50/60 ring-2 ring-pink-400/30'
                              : 'border-stone-200 bg-white hover:border-stone-300'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-black text-xs text-stone-900 truncate block">{pos.name}</span>
                          </div>
                          <span className="text-xs font-black font-mono text-pink-700 shrink-0">
                            +{formatMoney(posPrice, settings.currency)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NOTA ESPECIAL / PREPARACIÓN */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-900">
                  Nota especial para cocina (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sin cebolla, papas bien doradas, ají aparte..."
                  value={comboNotes}
                  onChange={(e) => setComboNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

            </div>

            {/* Footer Modal: Resumen Total y Botón Agregar */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
              <div>
                <p className="text-[10px] text-stone-500 font-bold">TOTAL MENÚ:</p>
                <p className="text-lg font-black font-mono text-stone-900">
                  {formatMoney(
                    (selectedMain?.price || baseMenuPrice) + (selectedDessert ? (selectedDessert.extraPrice || settings.dailyMenuDefaultDessertPrice || 3.50) : 0),
                    settings.currency
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsComboModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCombo}
                  disabled={!selectedMain}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-stone-900 hover:bg-black text-amber-400 shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Agregar a Comanda</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

