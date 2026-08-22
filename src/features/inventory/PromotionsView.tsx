import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { Ticket, Clock, Tag, Plus, Trash2, Percent, Calendar, Power, Search, Pause, Play } from 'lucide-react';
import { cn } from "../../lib/utils";
import { Promotion, PromotionType, PromotionStatus } from '../../types';

export default function PromotionsView() {
  const { promotions, addPromotion, updatePromotion, deletePromotion } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<Promotion>>({ type: 'Porcentaje', status: 'Activo' });

  const handleCreatePromo = () => {
    if (!newPromo.title || !newPromo.description) return;
    addPromotion({
      title: newPromo.title,
      type: (newPromo.type || 'Porcentaje') as PromotionType,
      discountValue: newPromo.discountValue || 0,
      description: newPromo.description,
      status: (newPromo.status || 'Activo') as PromotionStatus,
    });
    setIsCreateModalOpen(false);
    setNewPromo({ type: 'Porcentaje', status: 'Activo' });
  };

  const filteredPromos = promotions.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = promotions.filter(p => p.status === 'Activo').length;
  const totalUsages = promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0);

  const getTypeIcon = (type: PromotionType) => {
    switch (type) {
      case 'Happy Hour': return <Clock className="w-4 h-4" />;
      case 'Porcentaje': return <Percent className="w-4 h-4" />;
      case '2x1': return <Tag className="w-4 h-4" />;
      case 'Cupón': return <Ticket className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: PromotionStatus) => {
    switch (status) {
      case 'Activo': return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 'Pausado': return "bg-rose-100 text-rose-800 border-rose-200";
      case 'Programado': return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col p-4 md:p-8 pt-6 pb-24 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-amber-500" />
            Promociones & Ofertas
          </h1>
          <p className="text-stone-500 mt-1 font-medium">Atrae más clientes configurando descuentos automáticos y ofertas.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl transition-colors shadow-lg shadow-amber-500/20 font-black cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Crear Promoción
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <div className="text-stone-500 text-sm font-semibold mb-1">Promociones Activas</div>
          <div className="text-3xl font-black text-emerald-600 mb-1">{activeCount}</div>
          <div className="text-xs text-stone-400">Funcionando ahora mismo</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <div className="text-stone-500 text-sm font-semibold mb-1">Canjes Registrados</div>
          <div className="text-3xl font-black text-amber-600 mb-1">{totalUsages}</div>
          <div className="text-xs text-stone-400">Veces que se aplicó un descuento</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <div className="text-stone-500 text-sm font-semibold mb-1">Total Promociones</div>
          <div className="text-3xl font-black text-blue-600 mb-1">{promotions.length}</div>
          <div className="text-xs text-stone-400">Ofertas en catálogo</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input 
            type="text" 
            placeholder="Buscar promoción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-stone-200 text-stone-900 text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* Promo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromos.map((promo) => (
          <div key={promo.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow group">
            {/* Header */}
            <div className="p-5 pb-4 border-b border-stone-100 flex justify-between items-start">
              <div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mb-3",
                  getStatusColor(promo.status)
                )}>
                  {promo.status === 'Activo' && <Power className="w-3 h-3 text-emerald-600" />}
                  {promo.status === 'Pausado' && <Pause className="w-3 h-3 text-rose-600" />}
                  {promo.status === 'Programado' && <Calendar className="w-3 h-3 text-amber-600" />}
                  {promo.status}
                </span>
                <h3 className="text-lg font-black text-stone-900 leading-tight group-hover:text-amber-600 transition-colors">
                  {promo.title}
                </h3>
              </div>
              <button 
                onClick={() => deletePromotion(promo.id)}
                className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar promoción"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-600 mb-2">
                <div className="p-1.5 bg-stone-100 rounded-md text-stone-500">
                  {getTypeIcon(promo.type)}
                </div>
                {promo.type}
              </div>
              <p className="text-sm text-stone-500 flex-1">
                {promo.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
                <div className="text-xs font-semibold text-stone-400">
                  <span className="text-stone-700 font-bold">{promo.usageCount || 0}</span> canjes
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      updatePromotion(promo.id, { 
                        status: promo.status === 'Activo' ? 'Pausado' : 'Activo' 
                      });
                    }}
                    className="px-3 py-1.5 bg-stone-50 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors border border-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {promo.status === 'Activo' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-rose-500" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Activar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredPromos.length === 0 && (
          <div className="col-span-full py-12 text-center text-stone-500 bg-white border border-dashed border-stone-200 rounded-2xl">
            No se encontraron promociones que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-2xl font-black text-stone-900">Nueva Promoción</h2>
              <p className="text-sm text-stone-500 mt-1">Configura los detalles de la oferta</p>
            </div>
            
            <div className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nombre de la Promoción</label>
                <input 
                  type="text" 
                  value={newPromo.title || ''}
                  onChange={e => setNewPromo({...newPromo, title: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-bold text-sm" 
                  placeholder="Ej. Happy Hour Verano" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Tipo</label>
                  <select 
                    value={newPromo.type || 'Porcentaje'}
                    onChange={e => setNewPromo({...newPromo, type: e.target.value as PromotionType})}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 font-bold text-sm"
                  >
                    <option value="Porcentaje">Descuento (%)</option>
                    <option value="Happy Hour">Happy Hour</option>
                    <option value="2x1">2x1</option>
                    <option value="Cupón">Código Cupón</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Estado Inicial</label>
                  <select 
                    value={newPromo.status || 'Activo'}
                    onChange={e => setNewPromo({...newPromo, status: e.target.value as PromotionStatus})}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 font-bold text-sm"
                  >
                    <option value="Activo">Activo Inmediatamente</option>
                    <option value="Programado">Programado</option>
                    <option value="Pausado">Pausado (Borrador)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Descripción y Reglas</label>
                <textarea 
                  value={newPromo.description || ''}
                  onChange={e => setNewPromo({...newPromo, description: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 h-24 resize-none font-medium text-sm" 
                  placeholder="Explica las reglas. Ej. Válido solo los martes en consumo local..."
                />
              </div>
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-200 flex gap-3 justify-end">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreatePromo}
                disabled={!newPromo.title || !newPromo.description}
                className="px-5 py-2.5 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
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
