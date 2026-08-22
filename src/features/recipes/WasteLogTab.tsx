import React, { useState } from 'react';
import { AlertTriangle, Plus, Search, Trash2 } from 'lucide-react';
import { WasteRecord } from './recipeTypes';
import { formatMoney } from '../../lib/formatters';

interface WasteLogTabProps {
  wastes: WasteRecord[];
  onOpenCreate: () => void;
  onDelete: (id: string) => void;
}

export const WasteLogTab: React.FC<WasteLogTabProps> = ({
  wastes,
  onOpenCreate,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('todos');

  const filteredWastes = wastes.filter(w => {
    const matchSearch = w.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || w.responsible.toLowerCase().includes(searchTerm.toLowerCase());
    const matchReason = reasonFilter === 'todos' || w.reason === reasonFilter;
    return matchSearch && matchReason;
  });

  const totalWasteCost = wastes.reduce((sum, w) => sum + w.cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por insumo o responsable..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los Motivos</option>
            <option value="Mal estado">Mal estado</option>
            <option value="Vencimiento">Vencimiento</option>
            <option value="Error de cocina">Error de cocina</option>
            <option value="Derrame / Rotura">Derrame / Rotura</option>
          </select>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Registrar Merma
          </button>
        </div>
      </div>

      {/* Tabla de Mermas */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h4 className="font-black text-sm text-stone-900">Historial de Mermas Registradas</h4>
          <span className="text-xs font-bold text-rose-600">Total Pérdida: {formatMoney(totalWasteCost)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-900 text-white font-black text-[11px] uppercase tracking-wider">
                <th className="p-3.5 px-4">Insumo</th>
                <th className="p-3.5">Cantidad</th>
                <th className="p-3.5">Costo Pérdida</th>
                <th className="p-3.5">Motivo</th>
                <th className="p-3.5">Responsable</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredWastes.map((w) => (
                <tr key={w.id} className="hover:bg-stone-50 transition">
                  <td className="p-3.5 px-4 font-bold text-stone-900">{w.itemName}</td>
                  <td className="p-3.5 font-bold font-mono">{w.quantity} {w.unit}</td>
                  <td className="p-3.5 font-black font-mono text-rose-600">{formatMoney(w.cost)}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                      {w.reason}
                    </span>
                  </td>
                  <td className="p-3.5 text-stone-700 font-semibold">{w.responsible}</td>
                  <td className="p-3.5 text-stone-500 font-mono">{w.date}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onDelete(w.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
