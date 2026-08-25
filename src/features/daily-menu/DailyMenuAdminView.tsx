import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import {
  Plus, Trash2, Edit3, Check, X, Eye, EyeOff, Star,
  ChevronDown, ChevronUp, Utensils, Coffee, UtensilsCrossed,
  Cake, DollarSign, ArrowLeft, Save, RotateCcw, AlertCircle, Copy, ExternalLink,
  Search, Sparkles, CheckCircle2, XCircle, Sliders, Settings as SettingsIcon, Clock, Phone,
  Printer, FileText, Share2, MessageCircle, Layers, Tag
} from 'lucide-react';
import { cn, generateUUID } from "../../lib/utils";
import { DailyMenuItem, DailyMenuCourse } from "../../types";
import { createWhatsAppUrl } from "../../lib/formatters";

const COURSE_CONFIG: Record<DailyMenuCourse, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  entrada: {
    label: 'Entradas & Sopas',
    icon: Utensils,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  fondo: {
    label: 'Platos de Fondo',
    icon: UtensilsCrossed,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  bebida: {
    label: 'Bebidas & Refrescos',
    icon: Coffee,
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  postre: {
    label: 'Postres & Adicionales',
    icon: Cake,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
};

const EMPTY_ITEM: Omit<DailyMenuItem, 'id'> = {
  name: '',
  course: 'fondo',
  description: '',
  available: true,
  popular: false,
  extraPrice: undefined,
  price: undefined,
  priceTier: undefined,
};

export default function DailyMenuAdminView({ onBack }: { onBack: () => void }) {
  const { dailyMenuItems, addDailyMenuItem, updateDailyMenuItem, deleteDailyMenuItem, resetDailyMenuItems, settings, updateSettings } = useAppStore();

  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const tenantKey = isParadero ? 'paradero' : 'laslomas';
  const clientMenuUrl = `${window.location.origin}/menu/${tenantKey}`;

  // Modos de vista: 'dishes' (Platos), 'carta_generator' (Generador de Carta por Precios), 'pricing_config' (Precios)
  const [activeViewMode, setActiveViewMode] = useState<'dishes' | 'carta_generator' | 'pricing_config'>('dishes');

  // Configuración de los 4 Precios de Menú
  const defaultTiers = isParadero ? [16, 18, 22, 26] : [14, 16, 18, 22];
  const defaultTierLabels = isParadero ? ['Clásico', 'Ejecutivo', 'Marino', 'Especial'] : ['Económico', 'Clásico', 'Ejecutivo', 'Especial'];

  const initialTiers = settings.dailyMenuPriceTiers && settings.dailyMenuPriceTiers.length === 4 
    ? settings.dailyMenuPriceTiers 
    : defaultTiers;
  const initialTierLabels = settings.dailyMenuTierLabels && settings.dailyMenuTierLabels.length === 4 
    ? settings.dailyMenuTierLabels 
    : defaultTierLabels;

  const [cfgTier1, setCfgTier1] = useState<number>(initialTiers[0] ?? 14);
  const [cfgTier2, setCfgTier2] = useState<number>(initialTiers[1] ?? 16);
  const [cfgTier3, setCfgTier3] = useState<number>(initialTiers[2] ?? 18);
  const [cfgTier4, setCfgTier4] = useState<number>(initialTiers[3] ?? 22);

  const [cfgLabel1, setCfgLabel1] = useState<string>(initialTierLabels[0] ?? 'Económico');
  const [cfgLabel2, setCfgLabel2] = useState<string>(initialTierLabels[1] ?? 'Clásico');
  const [cfgLabel3, setCfgLabel3] = useState<string>(initialTierLabels[2] ?? 'Ejecutivo');
  const [cfgLabel4, setCfgLabel4] = useState<string>(initialTierLabels[3] ?? 'Especial');

  const [cfgBasePrice, setCfgBasePrice] = useState<number>(settings.dailyMenuPrice || initialTiers[1] || 16.00);
  const [cfgExtraStarter, setCfgExtraStarter] = useState<number>(settings.dailyMenuExtraStarterPrice ?? 5.00);
  const [cfgExtraDrink, setCfgExtraDrink] = useState<number>(settings.dailyMenuExtraDrinkPrice ?? 3.00);
  const [cfgDefaultDessert, setCfgDefaultDessert] = useState<number>(settings.dailyMenuDefaultDessertPrice ?? 3.50);
  const [cfgTitle, setCfgTitle] = useState<string>(settings.dailyMenuTitle || (isParadero ? 'Almuerzo Marino Ejecutivo' : 'Almuerzo Criollo & Brasas'));
  const [cfgSubtitle, setCfgSubtitle] = useState<string>(settings.dailyMenuSubtitle || (isParadero ? 'Chilcano o Causa + Plato Marino + Refresco Natural' : 'Sopa o Entrada + Plato de Fondo + Bebida'));
  const [cfgStartTime, setCfgStartTime] = useState<string>(settings.dailyMenuStartTime || '12:00');
  const [cfgEndTime, setCfgEndTime] = useState<string>(settings.dailyMenuEndTime || '16:30');
  const [cfgEnabled, setCfgEnabled] = useState<boolean>(settings.dailyMenuEnabled !== false);
  const [cfgPhone, setCfgPhone] = useState<string>(settings.whatsappOrdersPhone || (isParadero ? '51987654321' : '51995881303'));
  const [cfgPhone2, setCfgPhone2] = useState<string>(settings.whatsappOrdersPhone2 || (isParadero ? '51995881303' : '51953034562'));
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sincronizar estados locales cuando settings se hidrata desde Supabase
  useEffect(() => {
    if (settings.dailyMenuPriceTiers && settings.dailyMenuPriceTiers.length === 4) {
      setCfgTier1(settings.dailyMenuPriceTiers[0]);
      setCfgTier2(settings.dailyMenuPriceTiers[1]);
      setCfgTier3(settings.dailyMenuPriceTiers[2]);
      setCfgTier4(settings.dailyMenuPriceTiers[3]);
    }
    if (settings.dailyMenuTierLabels && settings.dailyMenuTierLabels.length === 4) {
      setCfgLabel1(settings.dailyMenuTierLabels[0]);
      setCfgLabel2(settings.dailyMenuTierLabels[1]);
      setCfgLabel3(settings.dailyMenuTierLabels[2]);
      setCfgLabel4(settings.dailyMenuTierLabels[3]);
    }
    if (settings.dailyMenuPrice) setCfgBasePrice(settings.dailyMenuPrice);
    if (settings.dailyMenuExtraStarterPrice !== undefined) setCfgExtraStarter(settings.dailyMenuExtraStarterPrice);
    if (settings.dailyMenuExtraDrinkPrice !== undefined) setCfgExtraDrink(settings.dailyMenuExtraDrinkPrice);
    if (settings.dailyMenuDefaultDessertPrice !== undefined) setCfgDefaultDessert(settings.dailyMenuDefaultDessertPrice);
    if (settings.dailyMenuTitle) setCfgTitle(settings.dailyMenuTitle);
    if (settings.dailyMenuSubtitle) setCfgSubtitle(settings.dailyMenuSubtitle);
    if (settings.dailyMenuStartTime) setCfgStartTime(settings.dailyMenuStartTime);
    if (settings.dailyMenuEndTime) setCfgEndTime(settings.dailyMenuEndTime);
    if (settings.dailyMenuEnabled !== undefined) setCfgEnabled(settings.dailyMenuEnabled);
    if (settings.whatsappOrdersPhone) setCfgPhone(settings.whatsappOrdersPhone);
    if (settings.whatsappOrdersPhone2) setCfgPhone2(settings.whatsappOrdersPhone2);
  }, [settings]);

  // Estados de platos
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<DailyMenuCourse | null>(null);
  const [formData, setFormData] = useState<Omit<DailyMenuItem, 'id'>>(EMPTY_ITEM);
  const [collapsedCourses, setCollapsedCourses] = useState<Set<DailyMenuCourse>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | DailyMenuCourse>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<number | 'all'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhatsAppMsg, setCopiedWhatsAppMsg] = useState(false);

  const activeTiers = useMemo(() => [
    { price: Number(cfgTier1), label: cfgLabel1.trim() || 'Nivel 1', color: 'from-blue-600 to-indigo-700', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
    { price: Number(cfgTier2), label: cfgLabel2.trim() || 'Nivel 2', color: 'from-amber-600 to-amber-700', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
    { price: Number(cfgTier3), label: cfgLabel3.trim() || 'Nivel 3', color: 'from-emerald-600 to-teal-700', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { price: Number(cfgTier4), label: cfgLabel4.trim() || 'Nivel 4', color: 'from-purple-600 to-rose-700', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
  ], [cfgTier1, cfgTier2, cfgTier3, cfgTier4, cfgLabel1, cfgLabel2, cfgLabel3, cfgLabel4]);

  const courses: DailyMenuCourse[] = ['entrada', 'fondo', 'bebida', 'postre'];

  const toggleCollapse = (course: DailyMenuCourse) => {
    setCollapsedCourses(prev => {
      const next = new Set(prev);
      if (next.has(course)) next.delete(course); else next.add(course);
      return next;
    });
  };

  const openAddForm = (course: DailyMenuCourse) => {
    setEditingId(null);
    setFormData({ 
      ...EMPTY_ITEM, 
      course,
      price: course === 'fondo' ? cfgTier2 : undefined,
      priceTier: course === 'fondo' ? cfgLabel2 : undefined,
    });
    setShowAddForm(course);
  };

  const openEditForm = (item: DailyMenuItem) => {
    setShowAddForm(null);
    setEditingId(item.id);
    setFormData({
      name: item.name,
      course: item.course,
      description: item.description ?? '',
      available: item.available,
      popular: item.popular ?? false,
      extraPrice: item.extraPrice,
      price: item.price,
      priceTier: item.priceTier,
    });
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowAddForm(null);
    setFormData(EMPTY_ITEM);
  };

  const handleSaveNew = () => {
    if (!formData.name.trim()) return;
    addDailyMenuItem({
      ...formData,
      id: generateUUID(),
    });
    cancelForm();
  };

  const handleSaveEdit = () => {
    if (!editingId || !formData.name.trim()) return;
    updateDailyMenuItem(editingId, formData);
    cancelForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este plato del menú del día?')) {
      deleteDailyMenuItem(id);
    }
  };

  const handleToggleAvailable = (item: DailyMenuItem) => {
    updateDailyMenuItem(item.id, { available: !item.available });
  };

  const handleTogglePopular = (item: DailyMenuItem) => {
    updateDailyMenuItem(item.id, { popular: !item.popular });
  };

  const handleEnableAll = () => {
    dailyMenuItems.forEach(item => {
      if (!item.available) updateDailyMenuItem(item.id, { available: true });
    });
  };

  const handleDisableAll = () => {
    dailyMenuItems.forEach(item => {
      if (item.available) updateDailyMenuItem(item.id, { available: false });
    });
  };

  const handleReset = () => {
    resetDailyMenuItems();
    setShowResetConfirm(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientMenuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenClientMenu = () => {
    window.open(clientMenuUrl, '_blank');
  };

  // Guardar configuración general y 4 precios en Supabase
  const handleSaveAllSettings = () => {
    const updatedTiers = [Number(cfgTier1), Number(cfgTier2), Number(cfgTier3), Number(cfgTier4)];
    const updatedLabels = [cfgLabel1.trim(), cfgLabel2.trim(), cfgLabel3.trim(), cfgLabel4.trim()];

    updateSettings({
      dailyMenuPrice: Number(cfgBasePrice),
      dailyMenuPriceTiers: updatedTiers,
      dailyMenuTierLabels: updatedLabels,
      dailyMenuExtraStarterPrice: Number(cfgExtraStarter),
      dailyMenuExtraDrinkPrice: Number(cfgExtraDrink),
      dailyMenuDefaultDessertPrice: Number(cfgDefaultDessert),
      dailyMenuTitle: cfgTitle.trim(),
      dailyMenuSubtitle: cfgSubtitle.trim(),
      dailyMenuStartTime: cfgStartTime,
      dailyMenuEndTime: cfgEndTime,
      dailyMenuEnabled: cfgEnabled,
      whatsappOrdersPhone: cfgPhone.trim(),
      whatsappOrdersPhone2: cfgPhone2.trim(),
    });

    setSaveSuccessMsg('¡Configuración de los 4 precios guardada con éxito en Supabase!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Generador de Texto de Carta para WhatsApp formateado por los 4 Precios
  const generateWhatsAppCartaText = useMemo(() => {
    const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    const capitalizedToday = today.charAt(0).toUpperCase() + today.slice(1);

    const starters = dailyMenuItems.filter(i => i.course === 'entrada' && i.available);
    const mains = dailyMenuItems.filter(i => i.course === 'fondo' && i.available);
    const drinks = dailyMenuItems.filter(i => i.course === 'bebida' && i.available);
    const desserts = dailyMenuItems.filter(i => i.course === 'postre' && i.available);

    const lines: string[] = [];
    lines.push(`🔥 *${settings.companyName.toUpperCase()} - MENÚ DEL DÍA* 🔥`);
    lines.push(`📅 *${capitalizedToday}*`);
    lines.push(`⏰ *Horario:* ${cfgStartTime} - ${cfgEndTime}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push('');

    // Entradas
    if (starters.length > 0) {
      lines.push(`🥣 *ENTRADAS & SOPAS:* (Elige 1)`);
      starters.forEach(s => lines.push(`  • ${s.name}`));
      lines.push('');
    }

    // Fondos por 4 Niveles de Precio
    lines.push(`🍲 *PLATOS DE FONDO POR PRECIO:*`);
    
    activeTiers.forEach(tier => {
      const tierMains = mains.filter(m => {
        if (m.price) return m.price === tier.price;
        if (m.priceTier) return m.priceTier.toLowerCase() === tier.label.toLowerCase();
        return tier.price === Number(cfgTier2);
      });

      lines.push(`💵 *${tier.label.toUpperCase()} — S/ ${tier.price.toFixed(2)}:*`);
      if (tierMains.length > 0) {
        tierMains.forEach(m => lines.push(`  👉 ${m.name}`));
      } else {
        lines.push(`  _(Consulte disponibilidad)_`);
      }
      lines.push('');
    });

    // Bebidas
    if (drinks.length > 0) {
      lines.push(`🥤 *BEBIDAS INCLUIDAS:*`);
      drinks.forEach(d => lines.push(`  • ${d.name}`));
      lines.push('');
    }

    // Postres
    if (desserts.length > 0) {
      lines.push(`🍰 *POSTRES ADICIONALES:*`);
      desserts.forEach(d => lines.push(`  • ${d.name} (+S/ ${(d.extraPrice ?? cfgDefaultDessert).toFixed(2)})`));
      lines.push('');
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🛵 *DELIVERY & PEDIDOS WHATSAPP:*`);
    lines.push(`📲 ${cfgPhone || '995881303'}`);
    if (cfgPhone2) lines.push(`📲 ${cfgPhone2}`);
    lines.push(`🌐 *O Pide en línea aquí:* ${clientMenuUrl}`);

    return lines.join('\n');
  }, [dailyMenuItems, activeTiers, settings.companyName, cfgStartTime, cfgEndTime, cfgDefaultDessert, cfgPhone, cfgPhone2, clientMenuUrl, cfgTier2]);

  const handleCopyWhatsAppCarta = () => {
    navigator.clipboard.writeText(generateWhatsAppCartaText);
    setCopiedWhatsAppMsg(true);
    setTimeout(() => setCopiedWhatsAppMsg(false), 2500);
  };

  const handleSendWhatsAppCarta = () => {
    const waUrl = createWhatsAppUrl(cfgPhone || '51995881303', generateWhatsAppCartaText);
    window.open(waUrl, '_blank');
  };

  const handlePrintCarta = () => {
    window.print();
  };

  const totalItems = dailyMenuItems.length;
  const availableItems = dailyMenuItems.filter(i => i.available).length;
  const filteredCourses = courses.filter(c => activeTab === 'all' || activeTab === c);

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-xs px-4 py-3 print:hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-stone-900 text-base leading-none">Gestor de Menú del Día</h1>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isParadero ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                  {isParadero ? 'Paradero 104' : 'Las Lomas Grill'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-semibold mt-0.5 flex items-center gap-1.5">
                <span>4 Precios activos:</span>
                {activeTiers.map(t => (
                  <span key={t.price} className="font-black text-stone-800 bg-stone-100 px-1.5 py-0.2 rounded text-[10px]">
                    S/ {t.price.toFixed(0)} ({t.label})
                  </span>
                ))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition cursor-pointer"
              title="Copiar enlace para enviar a clientes"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Link Copiado!' : 'Copiar Link Web'}</span>
            </button>

            <button
              onClick={handleOpenClientMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-black transition shadow-xs cursor-pointer"
              title="Ver cómo lo ven los clientes"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver como Cliente</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 rounded-xl text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              title="Restaurar platos predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── BARRA DE SELECCIÓN DE VISTA PRINCIPAL (3 PESTAÑAS) ── */}
      <div className="bg-white border-b border-stone-200 px-4 py-2.5 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewMode('dishes')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer",
                activeViewMode === 'dishes'
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                  : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
              )}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span>Platos del Menú ({totalItems})</span>
            </button>

            <button
              onClick={() => setActiveViewMode('carta_generator')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer",
                activeViewMode === 'carta_generator'
                  ? "bg-amber-500 text-stone-950 border-amber-600 shadow-xs font-black"
                  : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              )}
            >
              <FileText className="w-3.5 h-3.5 text-amber-950" />
              <span>📋 Generar Carta por 4 Precios</span>
              <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 text-[9px] font-black rounded-full">PRO</span>
            </button>

            <button
              onClick={() => setActiveViewMode('pricing_config')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border cursor-pointer",
                activeViewMode === 'pricing_config'
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                  : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
              )}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-stone-400" />
              <span>⚙️ Configurar los 4 Precios</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold">{availableItems} platos disponibles hoy</span>
          </div>
        </div>
      </div>

      {/* Alerta de guardado exitoso */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-center text-xs font-black text-emerald-800 animate-in fade-in duration-200 flex items-center justify-center gap-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODO 1: GENERADOR DE CARTA POR 4 PRECIOS (IMPRIMIBLE / WHATSAPP) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeViewMode === 'carta_generator' ? (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          
          {/* Barra de Acciones de la Carta */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black text-stone-900 text-sm">Generador de Carta & Difusión por Precios</h2>
                <p className="text-[11px] text-stone-500 font-medium">Visualiza, imprime en PDF o exporta a WhatsApp la carta organizada en tus 4 niveles de precio.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyWhatsAppCarta}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedWhatsAppMsg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{copiedWhatsAppMsg ? '¡Texto Copiado!' : 'Copiar para WhatsApp'}</span>
              </button>

              <button
                onClick={handleSendWhatsAppCarta}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                onClick={handlePrintCarta}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Imprimir Carta / PDF</span>
              </button>
            </div>
          </div>

          {/* ── CARTA VISUAL IMPRIMIBLE / DISEÑO RESTAURANTE ── */}
          <div className="bg-white rounded-3xl border-2 border-stone-300 shadow-xl overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0">
            
            {/* Header de la Carta */}
            <div className={`bg-gradient-to-r ${isParadero ? 'from-[#0a192f] via-[#0f2d4a] to-[#1a4a6e]' : 'from-stone-950 via-stone-900 to-stone-950'} text-white p-6 sm:p-8 text-center relative border-b-4 border-amber-500`}>
              <div className="max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CARTA OFICIAL · MENÚ DEL DÍA</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">{settings.companyName}</h1>
                <p className="text-xs sm:text-sm text-stone-300 font-medium">{cfgSubtitle}</p>
                <div className="text-[11px] text-amber-400 font-black pt-1">
                  ⏰ Horario de Atención: {cfgStartTime} a {cfgEndTime}
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8 bg-[#faf8f5]">
              
              {/* 1. SECCIÓN ENTRADAS & SOPAS */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-3 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900 text-sm">🥣 ENTRADAS & SOPAS (Elige 1 con tu menú)</h3>
                    <p className="text-[11px] text-stone-500 font-medium">Incluye tu entrada o sopa caliente a elección</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dailyMenuItems.filter(i => i.course === 'entrada' && i.available).map(item => (
                    <div key={item.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-stone-900">{item.name}</div>
                        {item.description && <div className="text-[10px] text-stone-500 mt-0.5 leading-tight">{item.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. SECCIÓN PLATOS DE FONDO POR LOS 4 NIVELES DE PRECIOS */}
              <div>
                <div className="text-center space-y-1 mb-6">
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 flex items-center justify-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                    <span>PLATOS DE FONDO POR PRECIO</span>
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">Selecciona tu plato favorito según el nivel de menú deseado</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeTiers.map(tier => {
                    const tierMains = dailyMenuItems.filter(i => {
                      if (i.course !== 'fondo' || !i.available) return false;
                      if (i.price) return i.price === tier.price;
                      if (i.priceTier) return i.priceTier.toLowerCase() === tier.label.toLowerCase();
                      return tier.price === Number(cfgTier2);
                    });

                    return (
                      <div key={tier.price} className="bg-white rounded-2xl border-2 border-stone-300 shadow-sm overflow-hidden flex flex-col">
                        {/* Cabecera del Nivel de Precio */}
                        <div className={`bg-gradient-to-r ${tier.color} text-white p-4 text-center`}>
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
                            {tier.label}
                          </span>
                          <div className="text-2xl font-black mt-0.5">
                            S/ {tier.price.toFixed(2)}
                          </div>
                          <span className="text-[9px] text-stone-200 font-semibold block mt-0.5">
                            Menú Completo + Entrada + Bebida
                          </span>
                        </div>

                        {/* Lista de Platos */}
                        <div className="p-3.5 space-y-2.5 flex-1 divide-y divide-stone-100">
                          {tierMains.length > 0 ? (
                            tierMains.map(dish => (
                              <div key={dish.id} className="pt-2 first:pt-0">
                                <div className="font-black text-xs text-stone-900 flex items-start gap-1.5">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{dish.name}</span>
                                </div>
                                {dish.description && (
                                  <p className="text-[10px] text-stone-500 font-medium mt-0.5 pl-3 leading-tight">
                                    {dish.description}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="py-6 text-center text-xs text-stone-400 font-medium italic">
                              Sin platos asignados a este precio hoy.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. BEBIDAS & POSTRES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Bebidas */}
                <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                    <Coffee className="w-4 h-4 text-sky-600" />
                    <h4 className="font-black text-xs text-stone-900">🥤 BEBIDAS & REFRESCOS INCLUIDOS</h4>
                  </div>
                  <div className="space-y-1.5">
                    {dailyMenuItems.filter(i => i.course === 'bebida' && i.available).map(drink => (
                      <div key={drink.id} className="text-xs font-bold text-stone-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        <span>{drink.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Postres */}
                <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2 mb-3">
                    <Cake className="w-4 h-4 text-rose-600" />
                    <h4 className="font-black text-xs text-stone-900">🍰 POSTRES ADICIONALES</h4>
                  </div>
                  <div className="space-y-1.5">
                    {dailyMenuItems.filter(i => i.course === 'postre' && i.available).map(dessert => (
                      <div key={dessert.id} className="text-xs font-bold text-stone-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span>{dessert.name}</span>
                        </span>
                        <span className="text-[11px] font-black text-rose-700">
                          +S/ {(dessert.extraPrice ?? cfgDefaultDessert).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer de la Carta */}
              <div className="text-center pt-4 border-t border-stone-200 text-xs text-stone-600 space-y-1">
                <p className="font-black text-stone-900">
                  🛵 Pedidos Delivery & Reservas: <strong>{cfgPhone || '995881303'}</strong> {cfgPhone2 ? ` / ${cfgPhone2}` : ''}
                </p>
                <p className="text-[11px] text-stone-500">
                  {settings.address || 'Atención en salón y despacho a domicilio'} · ¡Buen provecho!
                </p>
              </div>

            </div>
          </div>
        </div>
      ) : activeViewMode === 'pricing_config' ? (
        /* ══════════════════════════════════════════════════════════════════════ */
        /* ── MODO 2: CONFIGURACIÓN DE LOS 4 NIVELES DE PRECIOS & PARÁMETROS ── */
        /* ══════════════════════════════════════════════════════════════════════ */
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card: Configuración de los 4 Precios */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5" />
                <div>
                  <h3 className="font-black text-base leading-tight">Configurar los 4 Precios de Menú</h3>
                  <p className="text-xs font-semibold opacity-90">Personaliza el valor en soles y el nombre de cada uno de tus 4 niveles de menú.</p>
                </div>
              </div>
              <button
                onClick={handleSaveAllSettings}
                className="px-4 py-2 bg-stone-950 hover:bg-stone-900 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Guardar Cambios</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nivel 1 */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 uppercase">Nivel 1 (Económico / Entrada)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-200 text-blue-900">Precio 1</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Etiqueta:</label>
                      <input
                        type="text"
                        value={cfgLabel1}
                        onChange={e => setCfgLabel1(e.target.value)}
                        placeholder="Ej: Económico"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Precio (S/):</label>
                      <input
                        type="number"
                        step={0.5}
                        value={cfgTier1}
                        onChange={e => setCfgTier1(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-stone-900 outline-none focus:border-blue-500 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Nivel 2 */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 uppercase">Nivel 2 (Clásico / Estándar)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900">Precio 2</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Etiqueta:</label>
                      <input
                        type="text"
                        value={cfgLabel2}
                        onChange={e => setCfgLabel2(e.target.value)}
                        placeholder="Ej: Clásico"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Precio (S/):</label>
                      <input
                        type="number"
                        step={0.5}
                        value={cfgTier2}
                        onChange={e => setCfgTier2(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-stone-900 outline-none focus:border-amber-500 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Nivel 3 */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900 uppercase">Nivel 3 (Ejecutivo / Marino)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-200 text-emerald-900">Precio 3</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Etiqueta:</label>
                      <input
                        type="text"
                        value={cfgLabel3}
                        onChange={e => setCfgLabel3(e.target.value)}
                        placeholder="Ej: Ejecutivo"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Precio (S/):</label>
                      <input
                        type="number"
                        step={0.5}
                        value={cfgTier3}
                        onChange={e => setCfgTier3(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-stone-900 outline-none focus:border-emerald-500 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Nivel 4 */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 uppercase">Nivel 4 (Especial / Premium)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-200 text-purple-900">Precio 4</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Etiqueta:</label>
                      <input
                        type="text"
                        value={cfgLabel4}
                        onChange={e => setCfgLabel4(e.target.value)}
                        placeholder="Ej: Especial"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block">Precio (S/):</label>
                      <input
                        type="number"
                        step={0.5}
                        value={cfgTier4}
                        onChange={e => setCfgTier4(Number(e.target.value))}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-black text-stone-900 outline-none focus:border-purple-500 text-center"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Parámetros Adicionales */}
              <div className="pt-4 border-t border-stone-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Entrada Extra (S/)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={cfgExtraStarter}
                      onChange={e => setCfgExtraStarter(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Bebida Extra (S/)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={cfgExtraDrink}
                      onChange={e => setCfgExtraDrink(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">Postre Estándar (S/)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={cfgDefaultDessert}
                      onChange={e => setCfgDefaultDessert(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">WhatsApp Receptor 1</label>
                    <input
                      type="tel"
                      value={cfgPhone}
                      onChange={e => setCfgPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 block mb-1">WhatsApp Receptor 2</label>
                    <input
                      type="tel"
                      value={cfgPhone2}
                      onChange={e => setCfgPhone2(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-2">
                <button
                  onClick={handleSaveAllSettings}
                  className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>Guardar y Aplicar los 4 Precios</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════ */
        /* ── MODO 3: GESTIÓN DE PLATOS CON ASIGNACIÓN DE PRECIO & FILTROS ──── */
        /* ══════════════════════════════════════════════════════════════════════ */
        <>
          {/* ── BARRA DE BÚSQUEDA Y ACCIONES RÁPIDAS ── */}
          <div className="bg-white border-b border-stone-200/80 px-4 py-3 shadow-2xs">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Tabs por Curso */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
                {[
                  { id: 'all', label: '🍽️ Todos' },
                  { id: 'entrada', label: '🥣 Entradas' },
                  { id: 'fondo', label: '🍲 Fondos' },
                  { id: 'bebida', label: '🥤 Bebidas' },
                  { id: 'postre', label: '🍰 Postres' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer",
                      activeTab === tab.id
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Buscador & Botones Bulk */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar plato..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>

                <button
                  onClick={handleEnableAll}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition whitespace-nowrap cursor-pointer"
                  title="Habilitar todos los platos"
                >
                  ✓ Activar Todos
                </button>
                <button
                  onClick={handleDisableAll}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 transition whitespace-nowrap cursor-pointer"
                  title="Pausar todos los platos"
                >
                  ⏸ Pausar Todos
                </button>
              </div>
            </div>

            {/* Chips de filtro por precio para Fondos */}
            {(activeTab === 'all' || activeTab === 'fondo') && (
              <div className="max-w-5xl mx-auto pt-2.5 flex items-center gap-2 overflow-x-auto border-t border-stone-100 mt-2.5">
                <span className="text-[11px] font-black text-stone-500 uppercase shrink-0">Filtrar Fondos por Precio:</span>
                <button
                  onClick={() => setSelectedPriceFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer shrink-0",
                    selectedPriceFilter === 'all'
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                  )}
                >
                  Todos los Precios
                </button>
                {activeTiers.map(t => {
                  const count = dailyMenuItems.filter(i => i.course === 'fondo' && ((i.price === t.price) || (i.priceTier === t.label))).length;
                  return (
                    <button
                      key={t.price}
                      onClick={() => setSelectedPriceFilter(t.price)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer shrink-0 flex items-center gap-1.5",
                        selectedPriceFilter === t.price
                          ? "bg-amber-500 text-stone-950 border-amber-600 font-black shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-amber-50"
                      )}
                    >
                      <span>S/ {t.price.toFixed(2)} ({t.label})</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-stone-100 text-stone-700 font-black">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RESET CONFIRM ── */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-stone-900">¿Restaurar menú?</h3>
                    <p className="text-xs text-stone-500">Se cargarán los 12 platos predeterminados según la sede activa.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-sm hover:bg-stone-200 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition cursor-pointer"
                  >
                    Sí, restaurar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENIDO POR CATEGORÍAS ── */}
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

            {filteredCourses.map(course => {
              const cfg = COURSE_CONFIG[course];
              let items = dailyMenuItems.filter(i => i.course === course);

              if (course === 'fondo' && selectedPriceFilter !== 'all') {
                const targetTier = activeTiers.find(t => t.price === selectedPriceFilter);
                items = items.filter(i => {
                  if (i.price) return i.price === selectedPriceFilter;
                  if (i.priceTier && targetTier) return i.priceTier.toLowerCase() === targetTier.label.toLowerCase();
                  return false;
                });
              }

              if (searchTerm) {
                items = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())));
              }
              const collapsed = collapsedCourses.has(course);
              const isAddingHere = showAddForm === course;

              return (
                <section key={course} className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">

                  {/* ─ Encabezado de categoría ─ */}
                  <div
                    className={cn('flex items-center justify-between px-5 py-4 border-b cursor-pointer', cfg.bg, cfg.border)}
                    onClick={() => toggleCollapse(course)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-xs border", cfg.border)}>
                        <cfg.icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div>
                        <h2 className={cn('font-black text-sm', cfg.color)}>{cfg.label}</h2>
                        <p className="text-[10px] text-stone-500 font-semibold">
                          {items.length} plato{items.length !== 1 ? 's' : ''} · {items.filter(i => i.available).length} disponibles
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); openAddForm(course); }}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer',
                          cfg.color, 'bg-white border', cfg.border, 'hover:shadow-sm'
                        )}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar
                      </button>
                      {collapsed ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
                    </div>
                  </div>

                  {!collapsed && (
                    <div className="divide-y divide-stone-100">

                      {/* ─ Formulario AGREGAR ─ */}
                      {isAddingHere && (
                        <ItemForm
                          formData={formData}
                          onChange={setFormData}
                          onSave={handleSaveNew}
                          onCancel={cancelForm}
                          course={course}
                          isNew={true}
                          activeTiers={activeTiers}
                        />
                      )}

                      {/* ─ Lista de items ─ */}
                      {items.length === 0 && !isAddingHere ? (
                        <div className="px-5 py-8 text-center text-stone-400 text-xs">
                          No hay platos registrados en esta sección con los filtros actuales.
                        </div>
                      ) : (
                        items.map(item => {
                          const isEditing = editingId === item.id;
                          if (isEditing) {
                            return (
                              <ItemForm
                                key={item.id}
                                formData={formData}
                                onChange={setFormData}
                                onSave={handleSaveEdit}
                                onCancel={cancelForm}
                                course={item.course}
                                isNew={false}
                                activeTiers={activeTiers}
                              />
                            );
                          }
                          return (
                            <ItemRow
                              key={item.id}
                              item={item}
                              onEdit={() => openEditForm(item)}
                              onDelete={() => handleDelete(item.id)}
                              onToggleAvailable={() => handleToggleAvailable(item)}
                              onTogglePopular={() => handleTogglePopular(item)}
                              activeTiers={activeTiers}
                            />
                          );
                        })
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-componente: Fila de plato ─────────────────────────────────────────────
interface ItemRowProps {
  key?: React.Key;
  item: DailyMenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailable: () => void;
  onTogglePopular: () => void;
  activeTiers: { price: number; label: string; color: string; badge: string }[];
}

function ItemRow({ item, onEdit, onDelete, onToggleAvailable, onTogglePopular, activeTiers }: ItemRowProps) {
  const isPostre = item.course === 'postre';
  const isFondo = item.course === 'fondo';

  // Buscar badge de tier
  const tierMatch = activeTiers.find(t => t.price === item.price || (item.priceTier && t.label.toLowerCase() === item.priceTier.toLowerCase()));

  return (
    <div className={cn(
      'flex items-center justify-between px-5 py-3.5 gap-4 transition-colors',
      !item.available && 'opacity-50 bg-stone-50/60'
    )}>
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Toggle Disponible */}
        <button
          onClick={onToggleAvailable}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition cursor-pointer',
            item.available
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'bg-stone-200 text-stone-400 hover:bg-stone-300'
          )}
          title={item.available ? 'Disponible (clic para pausar)' : 'No disponible (clic para activar)'}
        >
          {item.available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
        </button>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-bold text-sm text-stone-900', !item.available && 'line-through text-stone-400')}>
              {item.name}
            </span>

            {/* Badge de Precio / Nivel en Fondos */}
            {isFondo && item.price && (
              <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-black border flex items-center gap-1', tierMatch ? tierMatch.badge : 'bg-amber-100 text-amber-900 border-amber-300')}>
                <Tag className="w-3 h-3" />
                <span>S/ {item.price.toFixed(2)}</span>
                {item.priceTier && <span className="opacity-80">· {item.priceTier}</span>}
              </span>
            )}

            {/* Badge de Popular */}
            {item.popular && (
              <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Destacado</span>
              </span>
            )}

            {/* Precio adicional en Postres */}
            {isPostre && item.extraPrice && (
              <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                +S/ {item.extraPrice.toFixed(2)}
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-xs text-stone-500 mt-0.5 truncate max-w-lg">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onTogglePopular}
          className={cn(
            'p-1.5 rounded-lg text-xs transition cursor-pointer',
            item.popular
              ? 'text-amber-500 hover:bg-amber-50'
              : 'text-stone-300 hover:text-stone-500 hover:bg-stone-100'
          )}
          title={item.popular ? 'Quitar de destacados' : 'Marcar como destacado'}
        >
          <Star className={cn('w-4 h-4', item.popular && 'fill-amber-500')} />
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          title="Editar plato"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          title="Eliminar plato"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Sub-componente: Formulario inline ──────────────────────────────────────────
interface ItemFormProps {
  key?: React.Key;
  formData: Omit<DailyMenuItem, 'id'>;
  onChange: (d: Omit<DailyMenuItem, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
  course: DailyMenuCourse;
  isNew: boolean;
  activeTiers: { price: number; label: string; color: string; badge: string }[];
}

function ItemForm({ formData, onChange, onSave, onCancel, course, isNew, activeTiers }: ItemFormProps) {
  const cfg = COURSE_CONFIG[course];
  const isPostre = course === 'postre';
  const isFondo = course === 'fondo';

  return (
    <div className={cn('px-5 py-4 space-y-3.5', cfg.bg, 'border-b', cfg.border)}>
      <p className={cn('text-xs font-black uppercase tracking-wide', cfg.color)}>
        {isNew ? `Nuevo plato — ${cfg.label}` : `Editando plato`}
      </p>

      {/* Nombre */}
      <input
        autoFocus
        type="text"
        placeholder="Nombre del plato *"
        value={formData.name}
        onChange={e => onChange({ ...formData, name: e.target.value })}
        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />

      {/* Descripción */}
      <textarea
        placeholder="Descripción opcional (ingredientes, guarniciones…)"
        value={formData.description ?? ''}
        onChange={e => onChange({ ...formData, description: e.target.value })}
        rows={2}
        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
      />

      {/* ── SELECTOR RÁPIDO DE LOS 4 PRECIOS PARA FONDOS ── */}
      {isFondo && (
        <div className="p-3 bg-white/80 rounded-2xl border border-stone-200 space-y-2">
          <label className="text-[11px] font-black text-stone-700 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-600" />
            <span>Asignar Nivel de Precio para este Plato de Fondo:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeTiers.map(t => {
              const isSelected = formData.price === t.price || formData.priceTier === t.label;
              return (
                <button
                  type="button"
                  key={t.price}
                  onClick={() => onChange({ ...formData, price: t.price, priceTier: t.label })}
                  className={cn(
                    "p-2 rounded-xl border text-center transition-all cursor-pointer",
                    isSelected
                      ? "bg-amber-500 text-stone-950 border-amber-600 font-black shadow-xs ring-2 ring-amber-400/40"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  )}
                >
                  <div className="text-[10px] uppercase font-black">{t.label}</div>
                  <div className="text-xs font-black mt-0.5">S/ {t.price.toFixed(2)}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        {/* Precio extra (postres) */}
        {isPostre && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black text-stone-600">Precio adicional (S/):</label>
            <input
              type="number"
              min={0}
              step={0.50}
              placeholder="0.00"
              value={formData.extraPrice ?? ''}
              onChange={e => onChange({ ...formData, extraPrice: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              className="w-20 bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 text-center"
            />
          </div>
        )}

        {/* Disponible */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.available}
            onChange={e => onChange({ ...formData, available: e.target.checked })}
            className="w-4 h-4 rounded accent-emerald-500"
          />
          <span className="text-[11px] font-black text-stone-600">Disponible hoy</span>
        </label>

        {/* Favorito */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.popular ?? false}
            onChange={e => onChange({ ...formData, popular: e.target.checked })}
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-[11px] font-black text-stone-600">Destacar en la Carta</span>
        </label>
      </div>

      {/* Botones */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={!formData.name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-black hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Save className="w-3.5 h-3.5" />
          {isNew ? 'Agregar plato' : 'Guardar cambios'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
      </div>
    </div>
  );
}
