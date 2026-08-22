import React, { useState } from 'react';
import { 
  X, ChefHat, Plus, Trash2, Edit3, CheckCircle2, 
  Volume2, VolumeX, Clock, AlertTriangle, Monitor, 
  ExternalLink, Sparkles, Filter, Layers, Utensils
} from 'lucide-react';
import { KitchenScreen, ProductCategory } from '../../types';
import { useAppStore } from '../../hooks/StoreContext';

interface KDSConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScreenForFullScreen?: (screen: KitchenScreen) => void;
}

const COLOR_OPTIONS: Array<{ value: KitchenScreen['color']; label: string; bg: string; text: string; border: string }> = [
  { value: 'amber', label: 'Ámbar (Horno / Pollos)', bg: 'bg-amber-500', text: 'text-amber-950', border: 'border-amber-400' },
  { value: 'orange', label: 'Naranja (Cocina Caliente)', bg: 'bg-orange-500', text: 'text-orange-950', border: 'border-orange-400' },
  { value: 'blue', label: 'Azul (Barra & Bebidas)', bg: 'bg-blue-500', text: 'text-blue-950', border: 'border-blue-400' },
  { value: 'emerald', label: 'Esmeralda (Despacho Central)', bg: 'bg-emerald-500', text: 'text-emerald-950', border: 'border-emerald-400' },
  { value: 'purple', label: 'Púrpura (Postres & Dulces)', bg: 'bg-purple-500', text: 'text-purple-950', border: 'border-purple-400' },
  { value: 'rose', label: 'Rosa (Parrilla & Brasas)', bg: 'bg-rose-500', text: 'text-rose-950', border: 'border-rose-400' },
  { value: 'indigo', label: 'Índigo (Estación Fría / Ceviche)', bg: 'bg-indigo-500', text: 'text-indigo-950', border: 'border-indigo-400' },
  { value: 'stone', label: 'Piedra (Monitor General)', bg: 'bg-stone-800', text: 'text-white', border: 'border-stone-700' },
];

const STATION_PRESETS = [
  "Horno & Pollos",
  "Cocina & Parrilla",
  "Barra & Bebidas",
  "Estación Postres",
  "Área Fría / Cevichería",
  "Todas (Pantalla Master)"
];

export const KDSConfigModal: React.FC<KDSConfigModalProps> = ({
  isOpen,
  onClose,
  onSelectScreenForFullScreen
}) => {
  const { kitchenScreens, addKitchenScreen, updateKitchenScreen, deleteKitchenScreen, resetKitchenScreens, products } = useAppStore();

  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [station, setStation] = useState('Horno & Pollos');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [color, setColor] = useState<KitchenScreen['color']>('amber');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alertMinutes, setAlertMinutes] = useState(10);
  const [dangerMinutes, setDangerMinutes] = useState(20);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!isOpen) return null;

  // Extraer categorías únicas disponibles de los productos
  const availableCategories: string[] = Array.from(new Set(products.map(p => p.category))).filter((c): c is string => Boolean(c));

  const handleStartCreate = () => {
    setEditingScreenId(null);
    setName('Nueva Pantalla de Cocina');
    setStation('Horno & Pollos');
    setSelectedCategories([]);
    setColor('amber');
    setSoundEnabled(true);
    setAlertMinutes(10);
    setDangerMinutes(20);
    setIsCreatingNew(true);
  };

  const handleStartEdit = (screen: KitchenScreen) => {
    setEditingScreenId(screen.id);
    setName(screen.name);
    setStation(screen.station);
    setSelectedCategories(screen.categories || []);
    setColor(screen.color);
    setSoundEnabled(screen.soundEnabled ?? true);
    setAlertMinutes(screen.alertMinutes || 10);
    setDangerMinutes(screen.dangerMinutes || 20);
    setIsCreatingNew(true);
  };

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingScreenId) {
      updateKitchenScreen(editingScreenId, {
        name: name.trim(),
        station,
        categories: selectedCategories,
        color,
        soundEnabled,
        alertMinutes,
        dangerMinutes,
        autoRefreshSeconds: 5,
        isActive: true,
      });
    } else {
      addKitchenScreen({
        name: name.trim(),
        station,
        categories: selectedCategories,
        color,
        soundEnabled,
        alertMinutes,
        dangerMinutes,
        autoRefreshSeconds: 5,
        isActive: true,
      });
    }
    setIsCreatingNew(false);
    setEditingScreenId(null);
  };

  // Platos que recibiría esta pantalla según la configuración
  const previewProducts = products.filter(p => {
    if (station === 'Todas' || station === 'Todas (Pantalla Master)') return true;
    const matchesStation = (p.station || '').toLowerCase().includes(station.toLowerCase()) || station.toLowerCase().includes((p.station || '').toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
    return matchesStation || matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 leading-tight">Configurar Pantallas de Cocina (KDS)</h2>
              <p className="text-xs font-semibold text-stone-500">Crea pantallas especializadas y define a dónde se enviará cada comanda</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-stone-200 text-stone-400 hover:bg-stone-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {!isCreatingNew ? (
            <>
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-stone-100">
                <div>
                  <h3 className="font-black text-stone-900 text-base">Pantallas Activas en Cocina ({kitchenScreens.length})</h3>
                  <p className="text-xs text-stone-500">Cada pantalla puede abrirse en una tablet o monitor de TV dedicado</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={resetKitchenScreens}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
                  >
                    Restaurar Predefinidas
                  </button>
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 rounded-xl text-xs font-black text-stone-950 bg-amber-500 hover:bg-amber-400 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Agregar Nueva Pantalla
                  </button>
                </div>
              </div>

              {/* Lista de Pantallas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kitchenScreens.map((sc) => {
                  const colorConfig = COLOR_OPTIONS.find(c => c.value === sc.color) || COLOR_OPTIONS[0];
                  const screenItemCount = products.filter(p => {
                    if (sc.station === 'Todas' || sc.station === 'Todas (Pantalla Master)') return true;
                    return (sc.categories && sc.categories.includes(p.category)) || (p.station || '').toLowerCase().includes(sc.station.toLowerCase());
                  }).length;

                  return (
                    <div 
                      key={sc.id}
                      className="bg-stone-50 hover:bg-white rounded-2xl p-5 border border-stone-200 hover:border-amber-400 shadow-xs hover:shadow-md transition group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colorConfig.bg} ${colorConfig.text}`}>
                            {sc.station}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(sc)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                              title="Editar configuración"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {kitchenScreens.length > 1 && (
                              <button
                                onClick={() => deleteKitchenScreen(sc.id)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Eliminar pantalla"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="font-black text-stone-900 text-base mb-1 group-hover:text-amber-700 transition">
                          {sc.name}
                        </h4>
                        
                        <p className="text-xs text-stone-500 font-medium mb-3">
                          {sc.categories && sc.categories.length > 0 
                            ? `Categorías: ${sc.categories.join(', ')}`
                            : 'Muestra todos los platos de la estación'}
                        </p>

                        <div className="space-y-1.5 text-xs text-stone-600 font-medium mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Platos vinculados:</span>
                            <span className="font-bold text-stone-900">{screenItemCount} platos</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Alertas de tiempo:</span>
                            <span className="font-bold text-amber-700">Amarillo {sc.alertMinutes}m / Rojo {sc.dangerMinutes}m</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Sonido de comanda:</span>
                            <span className={`font-bold ${sc.soundEnabled ? 'text-emerald-600' : 'text-stone-400'}`}>
                              {sc.soundEnabled ? '🔔 Activado' : '🔕 Desactivado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botón Lanzar */}
                      {onSelectScreenForFullScreen && (
                        <button
                          onClick={() => {
                            onSelectScreenForFullScreen(sc);
                            onClose();
                          }}
                          className="w-full py-2.5 rounded-xl font-black text-xs bg-stone-900 hover:bg-amber-500 text-amber-400 hover:text-stone-950 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Monitor className="w-4 h-4" /> Abrir en Pantalla Completa
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Formulario de Creación / Edición */
            <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
              
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <h3 className="font-black text-stone-900 text-lg">
                  {editingScreenId ? 'Editar Pantalla de Cocina' : 'Crear Nueva Pantalla de Cocina'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setEditingScreenId(null); }}
                  className="text-xs font-bold text-stone-500 hover:text-stone-900 cursor-pointer"
                >
                  Volver al listado
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Columna Izquierda: Datos Principales */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1.5">
                      Nombre de la Pantalla / Monitor
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Monitor Horno & Pollos, Pantalla Parrillas..."
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1.5">
                      Estación Principal
                    </label>
                    <select
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-bold text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    >
                      {STATION_PRESETS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de Color */}
                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                      Color Identificador
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setColor(c.value)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                            color === c.value
                              ? `${c.bg} ${c.text} font-black shadow-xs border-transparent`
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${c.bg} border border-white/50`} />
                          <span className="truncate">{c.label.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sonido y Tiempos */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-stone-900">Alerta Sonora</p>
                        <p className="text-[11px] text-stone-500 font-medium">Emitir campana al entrar nueva comanda</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-12 h-7 rounded-full transition-colors cursor-pointer p-1 ${soundEnabled ? 'bg-amber-500' : 'bg-stone-300'}`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-800 mb-1">
                          Alerta Amarilla (min)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={alertMinutes}
                          onChange={(e) => setAlertMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-red-800 mb-1">
                          Alerta Roja / Crítica (min)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={dangerMinutes}
                          onChange={(e) => setDangerMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Columna Derecha: Categorías Asignadas & Preview */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1.5">
                      Categorías de la Carta que se Enviarán a esta Pantalla
                    </label>
                    <p className="text-xs text-stone-500 font-medium mb-2">
                      Selecciona una o más categorías. Si no marcas ninguna, se enviarán todos los platos de la estación <strong>{station}</strong>.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                      {availableCategories.map((cat) => {
                        const isChecked = selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleToggleCategory(cat)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? 'bg-amber-50 border-amber-400 text-amber-950 font-black'
                                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {isChecked && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vista Previa de Platos que llegarán a este monitor */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                        Platos Ruteados a esta Pantalla ({previewProducts.length})
                      </span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      {previewProducts.length === 0 ? (
                        <p className="text-xs text-stone-400 italic py-2">No hay platos asociados a esta selección.</p>
                      ) : (
                        previewProducts.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-stone-100 font-medium">
                            <span className="text-stone-800 font-bold truncate">{p.name}</span>
                            <span className="text-stone-400 text-[10px] uppercase font-bold shrink-0 ml-2">{p.category}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Botones Guardar */}
              <div className="flex gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => { setIsCreatingNew(false); setEditingScreenId(null); }}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {editingScreenId ? 'Guardar Cambios' : 'Crear Pantalla KDS'}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
