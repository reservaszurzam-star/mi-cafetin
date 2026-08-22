import React, { useState } from 'react';
import { Search, Plus, Layers, Edit3, Trash2, PieChart } from 'lucide-react';
import { Recipe } from './recipeTypes';
import { formatMoney } from '../../lib/formatters';

interface RecipesListTabProps {
  recipes: Recipe[];
  onOpenCreate: () => void;
  onOpenEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export const RecipesListTab: React.FC<RecipesListTabProps> = ({
  recipes,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const filteredRecipes = recipes.filter(r => {
    const matchSearch = r.productName.toLowerCase().includes(searchTerm.toLowerCase()) || r.ingredients.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = categoryFilter === 'todos' || r.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const avgMargin = recipes.length > 0
    ? recipes.reduce((sum, r) => sum + r.marginPercent, 0) / recipes.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Recetas / Escandallos</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{recipes.length}</div>
          <span className="text-[10px] font-bold text-stone-500">Platos costeaados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">Margen Bruto Promedio</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{avgMargin.toFixed(1)}%</div>
          <span className="text-[10px] font-bold text-emerald-600">Rentabilidad de carta</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">Control de Insumos</span>
          <div className="text-2xl font-black text-blue-700 mt-1">100%</div>
          <span className="text-[10px] font-bold text-stone-500">Fichas técnicas al día</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por plato o insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="todos">Todas las Categorías</option>
            <option value="Combos & Promos">Combos & Promos</option>
            <option value="Pollos a la Brasa">Pollos a la Brasa</option>
            <option value="Parrillas & Mostros">Parrillas & Mostros</option>
            <option value="Entradas & Chaufa">Entradas & Chaufa</option>
          </select>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Nuevo Escandallo
          </button>
        </div>
      </div>

      {/* Grid de Escandallos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((rec) => (
          <div key={rec.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-base text-stone-900 leading-snug">{rec.productName}</h4>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block mt-1">
                    {rec.category}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black font-mono text-emerald-700 block">{rec.marginPercent}%</span>
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Margen</span>
                </div>
              </div>

              {/* Insumos Resumen */}
              <div className="mt-3 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1.5 font-medium text-stone-600">
                <span className="font-bold text-stone-800 text-[11px] block">{rec.ingredients.length} insumos de preparación:</span>
                <div className="space-y-1">
                  {rec.ingredients.slice(0, 3).map((i, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="truncate">{i.quantity} {i.unit} {i.itemName}</span>
                      <span className="font-mono font-bold text-stone-900">{formatMoney(i.cost)}</span>
                    </div>
                  ))}
                  {rec.ingredients.length > 3 && (
                    <p className="text-[10px] text-stone-400 italic">+ {rec.ingredients.length - 3} insumos adicionales</p>
                  )}
                </div>
                
                <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-black">
                  <span>Costo Total Insumos:</span>
                  <span className="font-mono text-rose-600">{formatMoney(rec.totalCost)}</span>
                </div>
                <div className="flex justify-between text-xs font-black">
                  <span>Precio de Venta:</span>
                  <span className="font-mono text-stone-900">{formatMoney(rec.sellingPrice)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => onOpenEdit(rec)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Receta
              </button>
              <button
                onClick={() => onDelete(rec.id)}
                className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
