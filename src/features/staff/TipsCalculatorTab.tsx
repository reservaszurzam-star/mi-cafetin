import React, { useState } from 'react';
import { Coins, Calculator, Check, Users } from 'lucide-react';
import { TipDistribution, StaffMember } from './staffTypes';
import { formatMoney } from '../../lib/formatters';

interface TipsCalculatorTabProps {
  tips: TipDistribution[];
  staff: StaffMember[];
  onAddTipDistribution: (dist: Omit<TipDistribution, 'id'>) => void;
}

export const TipsCalculatorTab: React.FC<TipsCalculatorTabProps> = ({
  tips,
  staff,
  onAddTipDistribution,
}) => {
  const [totalTips, setTotalTips] = useState<string>('200');
  const [shiftName, setShiftName] = useState('Turno Noche');
  const [selectedStaffNames, setSelectedStaffNames] = useState<string[]>(
    staff.filter(s => s.status === 'Activo').map(s => s.name)
  );

  const activeStaff = staff.filter(s => s.status === 'Activo');
  const numPeople = selectedStaffNames.length || 1;
  const parsedTips = parseFloat(totalTips) || 0;
  const amountPerPerson = parsedTips / numPeople;

  const toggleStaffSelection = (name: string) => {
    setSelectedStaffNames(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleSaveDistribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTips <= 0 || selectedStaffNames.length === 0) return;

    onAddTipDistribution({
      date: new Date().toISOString().split('T')[0],
      shift: shiftName,
      totalTips: parsedTips,
      staffCount: selectedStaffNames.length,
      amountPerPerson,
      staffList: selectedStaffNames,
    });
  };

  return (
    <div className="space-y-6">
      {/* Calculadora de Reparto */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
            <Coins className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-stone-900 leading-tight">Calculadora de Reparto de Propinas</h3>
            <p className="text-xs text-stone-500 font-semibold">Distribución equitativa y transparente del bote del día</p>
          </div>
        </div>

        <form onSubmit={handleSaveDistribution} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Total Propinas Recaudadas (S/) *
              </label>
              <input
                type="number"
                step="5"
                value={totalTips}
                onChange={(e) => setTotalTips(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-lg font-black font-mono text-stone-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Turno / Concepto *
              </label>
              <select
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Turno Mañana">Turno Mañana</option>
                <option value="Turno Tarde">Turno Tarde</option>
                <option value="Turno Noche">Turno Noche</option>
                <option value="Día Completo">Día Completo (Cierre)</option>
              </select>
            </div>
          </div>

          {/* Selección de Personal para el Bote */}
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-2">
              Seleccionar Personal Participante ({selectedStaffNames.length} seleccionados)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {activeStaff.map(s => {
                const isSelected = selectedStaffNames.includes(s.name);
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleStaffSelection(s.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-400/30' 
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">{s.name.split(' ')[0]} ({s.role})</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen del Reparto */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-200 block">Monto a Entregar</span>
              <div className="text-2xl font-black">{formatMoney(amountPerPerson)} <span className="text-xs font-bold text-amber-200">/ persona</span></div>
            </div>
            <button
              type="submit"
              disabled={parsedTips <= 0 || selectedStaffNames.length === 0}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50"
            >
              Registrar Reparto
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Repartos */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <h4 className="font-black text-sm text-stone-900">Historial de Repartos de Propinas</h4>
        </div>

        <div className="divide-y divide-stone-100">
          {tips.map((t) => (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 transition">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-stone-900">{t.shift}</span>
                  <span className="text-[10px] font-bold text-stone-400 font-mono">· {t.date}</span>
                </div>
                <div className="text-xs text-stone-500 font-medium mt-1">
                  Repartido entre <strong>{t.staffCount} personas</strong>: {t.staffList.map(n => n.split(' ')[0]).join(', ')}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase font-black block">Total Bote</span>
                <span className="text-sm font-black text-stone-900 font-mono">{formatMoney(t.totalTips)}</span>
                <span className="text-[11px] font-black text-emerald-600 block">({formatMoney(t.amountPerPerson)} c/u)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
