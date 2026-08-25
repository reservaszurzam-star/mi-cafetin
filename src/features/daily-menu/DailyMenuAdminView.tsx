import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import {
  Plus, Trash2, Edit3, Check, X, Eye, EyeOff, Star,
  ChevronDown, ChevronUp, Utensils, Coffee, UtensilsCrossed,
  Cake, DollarSign, ArrowLeft, Save, RotateCcw, AlertCircle, Copy, ExternalLink,
  Search, Sparkles, CheckCircle2, XCircle, Sliders, Settings as SettingsIcon, Clock, Phone
} from 'lucide-react';
import { cn, generateUUID } from "../../lib/utils";
import { DailyMenuItem, DailyMenuCourse } from "../../types";

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
  course: 'entrada',
  description: '',
  available: true,
  popular: false,
  extraPrice: undefined,
};

export default function DailyMenuAdminView({ onBack }: { onBack: () => void }) {
  const { dailyMenuItems, addDailyMenuItem, updateDailyMenuItem, deleteDailyMenuItem, resetDailyMenuItems, settings, updateSettings } = useAppStore();

  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const tenantKey = isParadero ? 'paradero' : 'laslomas';
  const clientMenuUrl = `${window.location.origin}/menu/${tenantKey}`;

  // Vista activa: 'dishes' (Platos) o 'pricing_config' (Precios y Configuración)
  const [activeViewMode, setActiveViewMode] = useState<'dishes' | 'pricing_config'>('dishes');

  // Estado del formulario de Configuración y Precios
  const [cfgBasePrice, setCfgBasePrice] = useState<number>(settings.dailyMenuPrice || (isParadero ? 18.00 : 16.00));
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

  // Estados de platos
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<DailyMenuCourse | null>(null);
  const [formData, setFormData] = useState<Omit<DailyMenuItem, 'id'>>(EMPTY_ITEM);
  const [collapsedCourses, setCollapsedCourses] = useState<Set<DailyMenuCourse>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | DailyMenuCourse>('all');
  const [copiedLink, setCopiedLink] = useState(false);

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
    setFormData({ ...EMPTY_ITEM, course });
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

  // Guardar configuración general y precio en Supabase
  const handleSaveAllSettings = () => {
    updateSettings({
      dailyMenuPrice: Number(cfgBasePrice),
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

    setSaveSuccessMsg('¡Configuración guardada y sincronizada en Supabase con éxito!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Cambio rápido de precio base desde la barra superior
  const handleQuickSetPrice = (p: number) => {
    setCfgBasePrice(p);
    updateSettings({ dailyMenuPrice: p });
    setSaveSuccessMsg(`¡Precio del menú actualizado a S/ ${p.toFixed(2)}!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const totalItems = dailyMenuItems.length;
  const availableItems = dailyMenuItems.filter(i => i.available).length;
  const filteredCourses = courses.filter(c => activeTab === 'all' || activeTab === c);

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-xs px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-stone-900 text-base leading-none">Configurar Menú del Día</h1>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isParadero ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                  {isParadero ? 'Paradero 104' : 'Las Lomas Grill'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-semibold mt-0.5">
                Precio actual: <span className="font-black text-amber-800">S/ {cfgBasePrice.toFixed(2)}</span> · {availableItems} platos disponibles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition"
              title="Copiar enlace para enviar por WhatsApp a clientes"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Link Copiado!' : 'Copiar Link WhatsApp'}</span>
            </button>

            <button
              onClick={handleOpenClientMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-xs"
              title="Abrir vista interactiva que ven los comensales"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Vista Cliente</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-1.5 rounded-xl text-xs text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Restaurar platos predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── BARRA DE SELECCIÓN DE VISTA (PLATOS VS CONFIGURACIÓN GENERAL) ── */}
      <div className="bg-white border-b border-stone-200 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveViewMode('dishes')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border",
                activeViewMode === 'dishes'
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                  : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
              )}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Platos del Menú ({totalItems})</span>
            </button>

            <button
              onClick={() => setActiveViewMode('pricing_config')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border",
                activeViewMode === 'pricing_config'
                  ? "bg-amber-500 text-stone-950 border-amber-500 shadow-xs"
                  : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
              )}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>⚙️ Precios y Configuración del Menú</span>
            </button>
          </div>

          {/* Selector de Precio Rápido */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-stone-500 uppercase">Precio Base:</span>
            <div className="flex items-center gap-1">
              {[14, 15, 16, 18, 20].map((p) => (
                <button
                  key={p}
                  onClick={() => handleQuickSetPrice(p)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-black transition-all border",
                    cfgBasePrice === p
                      ? "bg-amber-500 text-stone-950 border-amber-600 shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-amber-100"
                  )}
                >
                  S/ {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de guardado exitoso */}
      {saveSuccessMsg && (
        <div className="bg-emerald-600 text-white text-xs font-black py-2.5 px-4 text-center animate-in fade-in duration-200 flex items-center justify-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ── MÓDULO 1: CONFIGURACIÓN GENERAL Y PRECIOS DEL MENÚ ── */}
      {activeViewMode === 'pricing_config' ? (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Tarjeta de Precios Base y Adicionales */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-stone-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-5 h-5 stroke-[2.5]" />
                <div>
                  <h2 className="font-black text-base leading-none">Estructura de Precios del Menú</h2>
                  <p className="text-[11px] font-bold text-stone-900 mt-0.5">Configura el costo base y los cobros de porciones adicionales</p>
                </div>
              </div>
              <span className="text-xs font-black bg-stone-950 text-white px-3 py-1 rounded-full">
                S/ Soles Peruanos
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Precio Base */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="font-black text-stone-900 text-sm block">
                      Precio Base del Menú Ejecutivo (S/) *
                    </label>
                    <p className="text-xs text-stone-500 font-medium">
                      Precio estándar por comensal que incluye: 1 Plato de Fondo + 1 Entrada + 1 Bebida.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-800 text-lg">S/</span>
                    <input
                      type="number"
                      step={0.50}
                      min={1}
                      value={cfgBasePrice}
                      onChange={e => setCfgBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-28 bg-white border-2 border-amber-400 rounded-xl px-3 py-2 text-lg font-black text-stone-900 outline-none text-center shadow-xs"
                    />
                  </div>
                </div>

                {/* Botones Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-amber-200/60">
                  <span className="text-[11px] font-bold text-stone-600 mr-1">Precios sugeridos rápidos:</span>
                  {[12, 14, 15, 16, 17, 18, 20, 22, 25].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCfgBasePrice(p)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-black transition-all border",
                        cfgBasePrice === p
                          ? "bg-amber-500 text-stone-950 border-amber-600 shadow-xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-amber-100"
                      )}
                    >
                      S/ {p}.00
                    </button>
                  ))}
                </div>
              </div>

              {/* Precios de Extras */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-1.5">
                  <label className="text-xs font-black text-stone-800 block">
                    🥣 Entrada Adicional (S/)
                  </label>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    Cobro extra si piden más entradas que platos de fondo.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-xs font-black text-stone-500">S/</span>
                    <input
                      type="number"
                      step={0.50}
                      value={cfgExtraStarter}
                      onChange={e => setCfgExtraStarter(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm font-black text-stone-900 outline-none text-center"
                    />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-1.5">
                  <label className="text-xs font-black text-stone-800 block">
                    🥤 Bebida Adicional (S/)
                  </label>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    Cobro extra si piden más vasos de refresco que fondos.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-xs font-black text-stone-500">S/</span>
                    <input
                      type="number"
                      step={0.50}
                      value={cfgExtraDrink}
                      onChange={e => setCfgExtraDrink(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm font-black text-stone-900 outline-none text-center"
                    />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-1.5">
                  <label className="text-xs font-black text-stone-800 block">
                    🍰 Postre Estándar (S/)
                  </label>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    Precio por defecto sugerido al agregar un postre.
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-xs font-black text-stone-500">S/</span>
                    <input
                      type="number"
                      step={0.50}
                      value={cfgDefaultDessert}
                      onChange={e => setCfgDefaultDessert(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm font-black text-stone-900 outline-none text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Información y Horarios */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="bg-stone-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="font-black text-base leading-none">Presentación & Horarios</h2>
                  <p className="text-[11px] text-stone-400 mt-0.5">Personaliza los títulos y la información visual para tus comensales</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-stone-800 block mb-1">
                  Título Promocional del Menú
                </label>
                <input
                  type="text"
                  placeholder="Ej: Almuerzo Criollo & Brasas / Almuerzo Marino Ejecutivo"
                  value={cfgTitle}
                  onChange={e => setCfgTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:bg-white focus:border-stone-900 transition"
                />
              </div>

              <div>
                <label className="text-xs font-black text-stone-800 block mb-1">
                  Subtítulo / ¿Qué incluye el menú?
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sopa o Entrada + Plato de Fondo + Bebida Casera"
                  value={cfgSubtitle}
                  onChange={e => setCfgSubtitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none focus:bg-white focus:border-stone-900 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-stone-800 block mb-1">
                    Horario de Inicio del Menú
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <input
                      type="time"
                      value={cfgStartTime}
                      onChange={e => setCfgStartTime(e.target.value)}
                      className="w-full bg-transparent text-xs font-black text-stone-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-stone-800 block mb-1">
                    Horario de Fin del Menú
                  </label>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2">
                    <Clock className="w-4 h-4 text-stone-400" />
                    <input
                      type="time"
                      value={cfgEndTime}
                      onChange={e => setCfgEndTime(e.target.value)}
                      className="w-full bg-transparent text-xs font-black text-stone-900 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-stone-800">
                      WhatsApp Receptor 1 (Línea Principal)
                    </label>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Principal</span>
                  </div>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <input
                      type="tel"
                      placeholder="Ej: 51995881303"
                      value={cfgPhone}
                      onChange={e => setCfgPhone(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-stone-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-stone-800">
                      WhatsApp Receptor 2 (Línea Alternativa)
                    </label>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Opcional</span>
                  </div>
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <input
                      type="tel"
                      placeholder="Ej: 51953034562"
                      value={cfgPhone2}
                      onChange={e => setCfgPhone2(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-stone-900 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Los clientes podrán elegir entre estas 2 líneas de WhatsApp al enviar su pedido.
                  </p>
                </div>
              </div>

              {/* Toggle Activo */}
              <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                <div>
                  <p className="text-xs font-black text-stone-900">Estado del Menú del Día</p>
                  <p className="text-[11px] text-stone-500">
                    {cfgEnabled ? '🟢 Menú disponible para clientes en la web' : '🔴 Menú pausado temporalmente'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCfgEnabled(!cfgEnabled)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                    cfgEnabled
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-stone-200 text-stone-600 border-stone-300"
                  )}
                >
                  {cfgEnabled ? '✓ Menú Activo' : '⏸ Menú Pausado'}
                </button>
              </div>
            </div>
          </div>

          {/* Botón Guardar en Supabase */}
          <div className="pt-2">
            <button
              onClick={handleSaveAllSettings}
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-98 cursor-pointer"
            >
              <Save className="w-5 h-5 text-amber-400" />
              <span>Guardar y Aplicar Configuración en Supabase</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── MÓDULO 2: GESTIÓN DE PLATOS ── */
        <>
          {/* ── BARRA DE BÚSQUEDA Y ACCIONES RÁPIDAS ── */}
          <div className="bg-white border-b border-stone-200/80 px-4 py-3 shadow-2xs">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Tabs por Tiempo */}
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
                      "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
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
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition whitespace-nowrap"
                  title="Habilitar todos los platos"
                >
                  ✓ Activar Todos
                </button>
                <button
                  onClick={handleDisableAll}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 transition whitespace-nowrap"
                  title="Pausar todos los platos"
                >
                  ⏸ Pausar Todos
                </button>
              </div>
            </div>
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
                    className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-sm hover:bg-stone-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition"
                  >
                    Sí, restaurar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENIDO POR CATEGORÍAS ── */}
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

            {filteredCourses.map(course => {
              const cfg = COURSE_CONFIG[course];
              let items = dailyMenuItems.filter(i => i.course === course);
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
                          'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs',
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
                          isNew
                        />
                      )}

                      {/* ─ Lista de ítems ─ */}
                      {items.length === 0 && !isAddingHere && (
                        <div className="py-10 text-center text-stone-400">
                          <Utensils className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs font-bold">No hay platos en esta categoría</p>
                          <button
                            onClick={() => openAddForm(course)}
                            className="mt-2 text-xs font-black text-amber-600 hover:underline"
                          >
                            + Agregar el primero
                          </button>
                        </div>
                      )}

                      {items.map(item => (
                        <React.Fragment key={item.id}>
                          {editingId === item.id ? (
                            <ItemForm
                              formData={formData}
                              onChange={setFormData}
                              onSave={handleSaveEdit}
                              onCancel={cancelForm}
                              course={course}
                              isNew={false}
                            />
                          ) : (
                            <div className={cn(
                              'flex items-center justify-between px-5 py-3.5 transition-colors',
                              !item.available && 'opacity-40 bg-stone-50/50'
                            )}>
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className={cn('text-xs font-black text-stone-900', !item.available && 'line-through text-stone-400')}>
                                    {item.name}
                                  </span>
                                  {item.popular && (
                                    <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                                      ⭐ Favorito
                                    </span>
                                  )}
                                  {item.extraPrice && (
                                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      +{settings.currency} {item.extraPrice.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[11px] text-stone-400 font-medium mt-0.5 line-clamp-1">{item.description}</p>
                                )}
                              </div>

                              {/* Acciones */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleTogglePopular(item)}
                                  title={item.popular ? 'Quitar de favoritos' : 'Marcar como favorito'}
                                  className={cn(
                                    'p-1.5 rounded-lg transition',
                                    item.popular
                                      ? 'text-orange-500 bg-orange-50 hover:bg-orange-100'
                                      : 'text-stone-300 hover:text-orange-400 hover:bg-orange-50'
                                  )}
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditForm(item)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                  title="Editar plato"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Eliminar plato"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
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

// ── Sub-componente: formulario inline ──────────────────────────────────────────
interface ItemFormProps {
  formData: Omit<DailyMenuItem, 'id'>;
  onChange: (d: Omit<DailyMenuItem, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
  course: DailyMenuCourse;
  isNew: boolean;
}

function ItemForm({ formData, onChange, onSave, onCancel, course, isNew }: ItemFormProps) {
  const cfg = COURSE_CONFIG[course];
  const isPostre = course === 'postre';

  return (
    <div className={cn('px-5 py-4 space-y-3', cfg.bg, 'border-b', cfg.border)}>
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
        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-medium text-stone-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
      />

      <div className="flex flex-wrap gap-3">
        {/* Precio extra (postres o fondos premium) */}
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

        {/* Disponible */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.available}
            onChange={e => onChange({ ...formData, available: e.target.checked })}
            className="w-4 h-4 rounded accent-emerald-500"
          />
          <span className="text-[11px] font-black text-stone-600">Disponible</span>
        </label>

        {/* Favorito */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.popular ?? false}
            onChange={e => onChange({ ...formData, popular: e.target.checked })}
            className="w-4 h-4 rounded accent-orange-500"
          />
          <span className="text-[11px] font-black text-stone-600">Marcar como favorito</span>
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
