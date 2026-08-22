import React, { useState } from 'react';
import { Ticket, Clock, Tag, Plus, MoreVertical, Percent, Calendar, Power, Search, Pause, Play } from 'lucide-react';
import { cn } from "../../lib/utils";

type Promo = {
  id: string;
  title: string;
  type: 'Happy Hour' | 'Porcentaje' | '2x1' | 'Cupón';
  description: string;
  status: 'Activo' | 'Pausado' | 'Programado';
  usageCount: number;
};

const MOCK_PROMOS: Promo[] = [
  { id: '1', title: 'Happy Hour Cócteles', type: '2x1', description: 'Todos los jueves y viernes de 6pm a 8pm. Aplica en Pisco Sour y Chilcanos.', status: 'Activo', usageCount: 145 },
  { id: '2', title: 'Descuento Corporativo', type: 'Porcentaje', description: '20% de descuento para empresas afiliadas.', status: 'Activo', usageCount: 89 },
  { id: '3', title: 'Cupón FIRST10', type: 'Cupón', description: '10% de descuento en la primera compra por Delivery.', status: 'Activo', usageCount: 32 },
  { id: '4', title: 'Día del Pollo', type: 'Porcentaje', description: '1/4 de pollo a precio especial todo el día.', status: 'Programado', usageCount: 0 },
  { id: '5', title: 'Almuerzo Ejecutivo', type: 'Porcentaje', description: 'Menú a precio rebajado de Lunes a Miércoles.', status: 'Pausado', usageCount: 412 },
];

export default function PromotionsView() {
  const [promos, setPromos] = useState<Promo[]>(MOCK_PROMOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<Promo>>({ type: 'Porcentaje', status: 'Programado' });

  const handleCreatePromo = () => {
    if (!newPromo.title || !newPromo.description) return;
    const created: Promo = {
      id: Date.now().toString(),
      title: newPromo.title,
      type: newPromo.type || 'Porcentaje',
      description: newPromo.description,
      status: newPromo.status || 'Programado',
      usageCount: 0
    };
    setPromos([created, ...promos]);
    setIsCreateModalOpen(false);
    setNewPromo({ type: 'Porcentaje', status: 'Programado' });
  };

  const filteredPromos = promos.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getTypeIcon = (type: Promo['type']) => {
    switch (type) {
      case 'Happy Hour': return <Clock className="w-4 h-4" />;
      case 'Porcentaje': return <Percent className="w-4 h-4" />;
      case '2x1': return <Tag className="w-4 h-4" />;
      case 'Cupón': return <Ticket className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Promo['status']) => {
    switch (status) {
      case 'Activo': return "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case 'Pausado': return "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      case 'Programado': return "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-amber-500" />
            Promociones & Ofertas
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">Atrae más clientes configurando descuentos automáticos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20 font-bold"
          >
            <Plus className="w-5 h-5" />
            Crear Promoción
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/60 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="text-stone-500 dark:text-stone-400 text-sm font-semibold mb-1">Promociones Activas</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">3</div>
          <div className="text-xs text-stone-400 dark:text-stone-500">Funcionando ahora mismo</div>
        </div>
        <div className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/60 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="text-stone-500 dark:text-stone-400 text-sm font-semibold mb-1">Canjes Totales</div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mb-1">678</div>
          <div className="text-xs text-stone-400 dark:text-stone-500">Veces que se aplicó un descuento</div>
        </div>
        <div className="bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800/60 rounded-2xl p-5 shadow-sm dark:shadow-lg">
          <div className="text-stone-500 dark:text-stone-400 text-sm font-semibold mb-1">Ahorro Generado</div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">S/ 1,240</div>
          <div className="text-xs text-stone-400 dark:text-stone-500">Dinero ahorrado por tus clientes</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
          <input 
            type="text" 
            placeholder="Buscar promoción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {/* Opciones de filtro pueden ir aquí */}
        </div>
      </div>

      {/* Promo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromos.map((promo) => (
          <div key={promo.id} className="bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800/60 rounded-2xl overflow-hidden flex flex-col shadow-sm dark:shadow-xl hover:shadow-md transition-shadow group">
            {/* Header */}
            <div className="p-5 pb-4 border-b border-stone-100 dark:border-stone-800/50 flex justify-between items-start">
              <div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mb-3",
                  getStatusColor(promo.status)
                )}>
                  {promo.status === 'Activo' && <Power className="w-3 h-3" />}
                  {promo.status === 'Pausado' && <Power className="w-3 h-3" />}
                  {promo.status === 'Programado' && <Calendar className="w-3 h-3" />}
                  {promo.status}
                </span>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {promo.title}
                </h3>
              </div>
              <button className="p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-300 mb-2">
                <div className="p-1.5 bg-stone-100 dark:bg-stone-800 rounded-md text-stone-500 dark:text-stone-400">
                  {getTypeIcon(promo.type)}
                </div>
                {promo.type}
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400 flex-1">
                {promo.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800/50 flex justify-between items-center">
                <div className="text-xs font-semibold text-stone-400 dark:text-stone-500">
                  <span className="text-stone-700 dark:text-stone-300 font-bold">{promo.usageCount}</span> canjes
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const updated = promos.map(p => p.id === promo.id ? { ...p, status: p.status === 'Activo' ? 'Pausado' : 'Activo' } : p) as Promo[];
                      setPromos(updated);
                    }}
                    className="p-2 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors border border-stone-200 dark:border-transparent">
                    {promo.status === 'Activo' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPromos.length === 0 && (
          <div className="col-span-full py-12 text-center text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900/20 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
            No se encontraron promociones que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-lg border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone-200 dark:border-stone-800/60">
              <h2 className="text-2xl font-black text-stone-900 dark:text-white">Nueva Promoción</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Configura los detalles de la oferta</p>
            </div>
            
            <div className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Nombre de la Promoción</label>
                <input 
                  type="text" 
                  value={newPromo.title || ''}
                  onChange={e => setNewPromo({...newPromo, title: e.target.value})}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                  placeholder="Ej. Happy Hour Verano" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Tipo</label>
                  <select 
                    value={newPromo.type || 'Porcentaje'}
                    onChange={e => setNewPromo({...newPromo, type: e.target.value as Promo['type']})}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Porcentaje">Descuento (%)</option>
                    <option value="Happy Hour">Happy Hour</option>
                    <option value="2x1">2x1</option>
                    <option value="Cupón">Código Cupón</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Estado Inicial</label>
                  <select 
                    value={newPromo.status || 'Programado'}
                    onChange={e => setNewPromo({...newPromo, status: e.target.value as Promo['status']})}
                    className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Activo">Activo Inmediatamente</option>
                    <option value="Programado">Programado</option>
                    <option value="Pausado">Pausado (Borrador)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Descripción y Reglas</label>
                <textarea 
                  value={newPromo.description || ''}
                  onChange={e => setNewPromo({...newPromo, description: e.target.value})}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 h-24 resize-none" 
                  placeholder="Explica las reglas. Ej. Válido solo los martes..."
                />
              </div>
            </div>

            <div className="p-6 bg-stone-50 dark:bg-stone-900/50 border-t border-stone-200 dark:border-stone-800/60 flex gap-3 justify-end">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreatePromo}
                disabled={!newPromo.title || !newPromo.description}
                className="px-5 py-2.5 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar Promoción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
