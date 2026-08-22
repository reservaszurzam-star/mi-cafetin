import React, { useState, useEffect } from 'react';
import { 
  UsersRound, CalendarClock, Coins, UserPlus, Calendar, Clock,
  CheckCircle2, Sparkles, AlertCircle, Sun, Sunset, Moon, ShieldCheck
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { useAppStore } from "../../hooks/StoreContext";
import { StaffMember, AttendanceRecord, TipDistribution, INITIAL_STAFF, INITIAL_STAFF_PARADERO, INITIAL_STAFF_LASLOMAS, INITIAL_ATTENDANCE, INITIAL_TIPS } from "./staffTypes";
import { StaffListTab } from "./StaffListTab";
import { AttendanceTab } from "./AttendanceTab";
import { TipsCalculatorTab } from "./TipsCalculatorTab";
import { StaffFormModal } from "./StaffFormModal";

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function StaffView() {
  const { settings } = useAppStore();
  const isParadero = settings.companyName.toLowerCase().includes('paradero');
  const defaultStaffList = isParadero ? INITIAL_STAFF_PARADERO : INITIAL_STAFF_LASLOMAS;

  const [activeTab, setActiveTab] = useState<'staff' | 'attendance' | 'tips' | 'schedules'>('staff');

  // Estado persistido en LocalStorage por sede
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const key = `${settings.companyName}_staff_list`;
    const saved = localStorage.getItem(key);
    if (!saved) return defaultStaffList;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultStaffList;
    } catch {
      return defaultStaffList;
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const key = `${settings.companyName}_attendance_list`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [tips, setTips] = useState<TipDistribution[]>(() => {
    const key = `${settings.companyName}_tips_list`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : INITIAL_TIPS;
  });

  // Modal Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${settings.companyName}_staff_list`, JSON.stringify(staff));
  }, [staff, settings.companyName]);

  useEffect(() => {
    localStorage.setItem(`${settings.companyName}_attendance_list`, JSON.stringify(attendance));
  }, [attendance, settings.companyName]);

  useEffect(() => {
    localStorage.setItem(`${settings.companyName}_tips_list`, JSON.stringify(tips));
  }, [tips, settings.companyName]);

  // Handlers
  const handleSaveStaff = (data: Omit<StaffMember, 'id'>) => {
    if (editingStaff) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...data, id: editingStaff.id } : s));
    } else {
      const newMember: StaffMember = {
        ...data,
        id: `st-${Date.now()}`
      };
      setStaff(prev => [newMember, ...prev]);
    }
    setShowModal(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de personal?')) {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleStatus = (member: StaffMember) => {
    const nextStatus = member.status === 'Activo' ? 'Inactivo' : 'Activo';
    setStaff(prev => prev.map(s => s.id === member.id ? { ...s, status: nextStatus } : s));
  };

  const handleAddAttendance = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}`
    };
    setAttendance(prev => [newRecord, ...prev]);
  };

  const handleUpdateCheckOut = (recordId: string, checkOutTime: string) => {
    setAttendance(prev => prev.map(a => a.id === recordId ? { ...a, checkOut: checkOutTime } : a));
  };

  const handleAddTipDistribution = (dist: Omit<TipDistribution, 'id'>) => {
    const newDist: TipDistribution = {
      ...dist,
      id: `tip-${Date.now()}`
    };
    setTips(prev => [newDist, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Recursos Humanos & Turnos
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
              En Desarrollo · Exclusivo Owner
            </span>
            <span className="text-xs text-stone-400 font-bold">· {settings.companyName}</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <UsersRound className="w-7 h-7 text-amber-500" />
            Gestión de Personal, Asistencias & Propinas
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-0.5">
            Control de asistencia diaria, horarios de turnos, jornadas y calculadora de reparto de propinas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('staff')}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'staff' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <UsersRound className="w-3.5 h-3.5" />
              <span>Personal ({staff.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'attendance' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Asistencias</span>
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'tips' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Bote Propinas</span>
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'schedules' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Horarios</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingStaff(null);
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Personal</span>
          </button>
        </div>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'staff' && (
        <StaffListTab
          staff={staff}
          onOpenCreate={() => {
            setEditingStaff(null);
            setShowModal(true);
          }}
          onOpenEdit={(member) => {
            setEditingStaff(member);
            setShowModal(true);
          }}
          onDelete={handleDeleteStaff}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {activeTab === 'attendance' && (
        <AttendanceTab
          attendance={attendance}
          staff={staff.filter(s => s.status === 'Activo')}
          onAddAttendance={handleAddAttendance}
          onUpdateCheckOut={handleUpdateCheckOut}
        />
      )}

      {activeTab === 'tips' && (
        <TipsCalculatorTab
          staff={staff.filter(s => s.status === 'Activo')}
          history={tips}
          onSaveDistribution={handleAddTipDistribution}
        />
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Métricas de turnos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Turno Mañana (8am - 4pm)</span>
                <div className="text-xl font-black text-stone-900 mt-0.5">
                  {staff.filter(s => s.shift === 'Mañana' || s.shift === 'Completo').length} Colaboradores
                </div>
                <span className="text-[11px] font-bold text-amber-700">Apertura y almuerzos</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                <Sunset className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Turno Tarde (1pm - 9pm)</span>
                <div className="text-xl font-black text-stone-900 mt-0.5">
                  {staff.filter(s => s.shift === 'Tarde' || s.shift === 'Completo').length} Colaboradores
                </div>
                <span className="text-[11px] font-bold text-orange-700">Servicio continuo</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <Moon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Turno Noche (5pm - Cierre)</span>
                <div className="text-xl font-black text-stone-900 mt-0.5">
                  {staff.filter(s => s.shift === 'Noche' || s.shift === 'Completo').length} Colaboradores
                </div>
                <span className="text-[11px] font-bold text-indigo-700">Cenas y cierre de caja</span>
              </div>
            </div>
          </div>

          {/* Calendario semanal */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  Programación Semanal de Turnos
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Distribución operativa de meseros, cajeros, cocina y repartidores por día de la semana.
                </p>
              </div>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Turnos Asignados 100%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 pt-2">
              {DAYS_OF_WEEK.map((day, idx) => {
                const isWeekend = idx >= 5;

                return (
                  <div 
                    key={day} 
                    className={cn(
                      "rounded-2xl border p-3 flex flex-col justify-between gap-3",
                      isWeekend ? "bg-amber-50/40 border-amber-200" : "bg-stone-50/60 border-stone-200"
                    )}
                  >
                    <div className="border-b border-stone-200/80 pb-2">
                      <h4 className="font-black text-xs text-stone-900 flex items-center justify-between">
                        <span>{day}</span>
                        {isWeekend && <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Alta Demanda</span>}
                      </h4>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {staff.filter(s => s.status === 'Activo').slice(0, isWeekend ? 6 : 4).map(member => (
                        <div key={member.id} className="bg-white p-2 rounded-xl border border-stone-200 shadow-2xs text-[11px]">
                          <p className="font-black text-stone-900 truncate">{member.name}</p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-stone-500">
                            <span className="font-bold text-amber-800">{member.role}</span>
                            <span className="font-mono bg-stone-100 px-1 py-0.5 rounded">{member.shift}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <StaffFormModal
          isOpen={showModal}
          initialData={editingStaff}
          onClose={() => {
            setShowModal(false);
            setEditingStaff(null);
          }}
          onSave={handleSaveStaff}
        />
      )}
    </div>
  );
}
