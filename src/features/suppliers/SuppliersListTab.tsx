import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, Building2, Edit3, Trash2, MessageCircle } from 'lucide-react';
import { Supplier } from './supplierTypes';
import { createWhatsAppUrl } from '../../lib/formatters';

interface SuppliersListTabProps {
  suppliers: Supplier[];
  onOpenCreate: () => void;
  onOpenEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

export const SuppliersListTab: React.FC<SuppliersListTabProps> = ({
  suppliers,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const filteredSuppliers = suppliers.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.ruc.includes(searchTerm) || s.contactName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'todos' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por razón social, RUC o asesor..."
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
            <option value="todos">Todos los Rubros</option>
            <option value="Carnes & Aves">Carnes & Aves</option>
            <option value="Verduras & Frutas">Verduras & Frutas</option>
            <option value="Abarrotes">Abarrotes</option>
            <option value="Bebidas & Licores">Bebidas & Licores</option>
            <option value="Pescados & Mariscos">Pescados & Mariscos</option>
            <option value="Descartables & Limpieza">Descartables & Limpieza</option>
          </select>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Registrar Proveedor
          </button>
        </div>
      </div>

      {/* Grid de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((sup) => (
          <div key={sup.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-base text-stone-900">{sup.name}</h4>
                  <span className="text-[10px] font-mono font-bold text-stone-500 block">RUC: {sup.ruc || 'No registrado'}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {sup.category}
                </span>
              </div>

              <div className="mt-3 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1.5 font-medium text-stone-600">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Contacto:</span>
                  <span className="font-bold text-stone-900">{sup.contactName || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">Condición:</span>
                  <span className="font-bold text-emerald-700">{sup.paymentTerms}</span>
                </div>
                {sup.address && (
                  <div className="flex items-start justify-between pt-1 border-t border-stone-200">
                    <span className="text-stone-400 shrink-0 mr-2">Local:</span>
                    <span className="text-stone-700 text-right truncate">{sup.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => {
                  const url = createWhatsAppUrl(sup.phone, `Hola ${sup.contactName}, nos comunicamos desde el restaurante para coordinar un pedido.`);
                  window.open(url, '_blank');
                }}
                className="flex-1 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={() => onOpenEdit(sup)}
                className="p-2 text-stone-600 hover:text-amber-600 rounded-xl hover:bg-stone-100 transition"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(sup.id)}
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
