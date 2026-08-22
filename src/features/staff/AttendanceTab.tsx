import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, AlertCircle, Clock, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AttendanceRecord, StaffMember } from './staffTypes';

interface AttendanceTabProps {
  attendance: AttendanceRecord[];
  staff: StaffMember[];
  onAddAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  onUpdateCheckOut: (recordId: string, checkOutTime: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  attendance,
  staff,
  onAddAttendance,
  onUpdateCheckOut,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [status, setStatus] = useState<AttendanceRecord['status']>('Puntual');
  const [notes, setNotes] = useState('');

  const activeStaff = staff.filter(s => s.status === 'Activo');

  const handleRegisterEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    const matchedStaff = staff.find(s => s.id === selectedStaffId);
    if (!matchedStaff) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    onAddAttendance({
      staffId: matchedStaff.id,
      staffName: matchedStaff.name,
      role: matchedStaff.role,
      date: dateStr,
      checkIn: timeStr,
      status,
      notes: notes.trim() || undefined,
    });

    setSelectedStaffId('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Formulario Registro de Entrada Rápida */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
            <CalendarClock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-stone-900 leading-tight">Marcar Entrada de Asistencia</h3>
            <p className="text-xs text-stone-500 font-semibold">Registro de horario de ingreso del personal</p>
          </div>
        </div>

        <form onSubmit={handleRegisterEntry} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Empleado *
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              required
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="">-- Seleccionar Personal --</option>
              {activeStaff.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role} · Turno {s.shift})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Estado de Ingreso
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="Puntual">Puntual</option>
              <option value="Tardanza">Tardanza</option>
              <option value="Permiso">Permiso</option>
              <option value="Falta">Falta</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={!selectedStaffId}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Marcar Ingreso
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Asistencia */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h4 className="font-black text-sm text-stone-900">Registros de Asistencia Recientes</h4>
          <span className="text-xs text-stone-500 font-bold">{attendance.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-900 text-white font-black text-[11px] uppercase tracking-wider">
                <th className="p-3.5 px-4">Personal</th>
                <th className="p-3.5">Cargo</th>
                <th className="p-3.5">Fecha</th>
                <th className="p-3.5">Ingreso</th>
                <th className="p-3.5">Salida</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {attendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-stone-50 transition">
                  <td className="p-3.5 px-4 font-bold text-stone-900">{rec.staffName}</td>
                  <td className="p-3.5 text-stone-600 font-semibold">{rec.role}</td>
                  <td className="p-3.5 font-mono text-stone-500">{rec.date}</td>
                  <td className="p-3.5 font-bold font-mono text-stone-900">{rec.checkIn}</td>
                  <td className="p-3.5 font-mono text-stone-700">{rec.checkOut || '-'}</td>
                  <td className="p-3.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black border",
                      rec.status === 'Puntual' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      rec.status === 'Tardanza' ? "bg-amber-50 text-amber-700 border-amber-200" :
                      rec.status === 'Permiso' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {!rec.checkOut ? (
                      <button
                        onClick={() => {
                          const now = new Date();
                          const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
                          onUpdateCheckOut(rec.id, timeStr);
                        }}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[11px] font-bold transition"
                      >
                        Marcar Salida
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400 font-bold">Completado</span>
                    )}
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
