import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import {
  Plus, Trash2, Edit3, Check, X, Eye, EyeOff, Star,
  ChevronDown, ChevronUp, Utensils, Coffee, UtensilsCrossed,
  Cake, DollarSign, ArrowLeft, Save, RotateCcw, AlertCircle, Copy, ExternalLink
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
  const { dailyMenuItems, addDailyMenuItem, updateDailyMenuItem, deleteDailyMenuItem, resetDailyMenuItems, settings } = useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<DailyMenuCourse | null>(null);
  const [formData, setFormData] = useState<Omit<DailyMenuItem, 'id'>>(EMPTY_ITEM);
  const [collapsedCourses, setCollapsedCourses] = useState<Set<DailyMenuCourse>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  const handleReset = () => {
    resetDailyMenuItems();
    setShowResetConfirm(false);
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const tenantKey = isParadero ? 'paradero' : 'laslomas';
  const clientMenuUrl = `${window.location.origin}/menu/${tenantKey}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientMenuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenClientMenu = () => {
    window.open(clientMenuUrl, '_blank');
  };

  const totalItems = dailyMenuItems.length;
  const availableItems = dailyMenuItems.filter(i => i.available).length;

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
              <h1 className="font-black text-stone-900 text-base leading-none">Administrar Menú del Día</h1>
              <p className="text-[11px] text-stone-500 font-semibold mt-0.5">
                {availableItems} disponibles · {totalItems} en total · <span className="font-bold text-stone-700">{settings.companyName}</span>
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
                <p className="text-xs text-stone-500">Se perderán todos los cambios y se cargarán los platos predeterminados.</p>
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

      {/* ── CONTENIDO ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {courses.map(course => {
          const cfg = COURSE_CONFIG[course];
          const items = dailyMenuItems.filter(i => i.course === course);
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
                      'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition',
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
                          'flex items-start gap-3 px-5 py-4 transition',
                          !item.available && 'opacity-50 bg-stone-50'
                        )}>
                          {/* Indicador disponibilidad */}
                          <button
                            onClick={() => handleToggleAvailable(item)}
                            className={cn(
                              'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition',
                              item.available
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-stone-300 text-stone-300'
                            )}
                            title={item.available ? 'Disponible – clic para deshabilitar' : 'No disponible – clic para habilitar'}
                          >
                            {item.available && <Check className="w-3 h-3" />}
                          </button>

                          {/* Datos del plato */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-sm text-stone-900 leading-snug">{item.name}</span>
                              {item.popular && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-100 text-orange-700">
                                  <Star className="w-2.5 h-2.5" /> Favorito
                                </span>
                              )}
                              {!item.available && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-stone-200 text-stone-500">No disponible</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-stone-500 font-medium mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                            )}
                            {item.extraPrice != null && (
                              <span className="inline-block mt-1 text-[11px] font-bold text-amber-700">
                                +S/ {item.extraPrice.toFixed(2)} adicional
                              </span>
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
