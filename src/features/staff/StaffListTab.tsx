import React, { useState } from 'react';
import { Search, Plus, Phone, IdCard, Briefcase, Edit3, Trash2, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StaffMember } from './staffTypes';
import { formatMoney } from '../../lib/formatters';

interface StaffListTabProps {
  staff: StaffMember[];
  onOpenCreate: () => void;
  onOpenEdit: (member: StaffMember) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (member: StaffMember) => void;
}

export const StaffListTab: React.FC<StaffListTabProps> = ({
  staff,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.dni.includes(searchTerm) || s.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'todos' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = staff.filter(s => s.status === 'Activo').length;
  const totalDailySalary = staff.filter(s => s.status === 'Activo').reduce((sum, s) => sum + (s.salaryDaily || 0), 0);

  return (
    <div className="space-y-4">
      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Total Personal</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{staff.length}</div>
          <span className="text-[10px] font-bold text-stone-500">{activeCount} activos para turnos</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Personal Activo</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
          <span className="text-[10px] font-bold text-emerald-600">Disponibles en el salón</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">Presupuesto Diario Planilla</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{formatMoney(totalDailySalary)}</div>
          <span className="text-[10px] font-bold text-stone-500">Cálculo de jornales activos</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los Puestos</option>
            <option value="Mozo">Mozos</option>
            <option value="Cocinero">Cocineros</option>
            <option value="Parrillero">Parrilleros</option>
            <option value="Cajero">Cajeros</option>
            <option value="Bartender">Bartenders</option>
            <option value="Repartidor">Repartidores</option>
          </select>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" /> Registrar Empleado
          </button>
        </div>
      </div>

      {/* Grid de Personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((member) => (
          <div key={member.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-base text-stone-900">{member.name}</h4>
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md mt-1">
                    {member.role}
                  </span>
                </div>
                <button
                  onClick={() => onToggleStatus(member)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-black border transition cursor-pointer",
                    member.status === 'Activo' 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  {member.status}
                </button>
              </div>

              <div className="mt-3 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1.5 font-medium text-stone-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-400"><IdCard className="w-3.5 h-3.5" /> DNI:</span>
                  <span className="font-bold text-stone-900 font-mono">{member.dni || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-400"><Phone className="w-3.5 h-3.5" /> Teléfono:</span>
                  <span className="font-bold text-stone-900">{member.phone || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-400"><Briefcase className="w-3.5 h-3.5" /> Turno:</span>
                  <span className="font-bold text-stone-900">{member.shift}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                  <span className="text-stone-500">Jornal Diario:</span>
                  <span className="font-black text-amber-700 font-mono">{formatMoney(member.salaryDaily || 0)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => onOpenEdit(member)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={() => onDelete(member.id)}
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
