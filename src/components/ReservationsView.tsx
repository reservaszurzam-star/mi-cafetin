import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/StoreContext';
import { Calendar as CalendarIcon, Clock, Phone, User, Check, X, CalendarPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Reservation } from '../types';

export default function ReservationsView() {
  const { reservations, addReservation, updateReservationStatus } = useAppStore();
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [resDate, setResDate] = useState(selectedDate);
  const [resTime, setResTime] = useState('19:30');
  const [guestCount, setGuestCount] = useState('2');
  const [tableNo, setTableNo] = useState('Mesa 1');

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => r.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [reservations, selectedDate]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    addReservation({
      customerName: custName,
      phone: custPhone,
      date: resDate,
      time: resTime,
      guestCount: parseInt(guestCount) || 2,
      tableNumber: tableNo,
      status: 'pending'
    });
    setIsAdding(false);
    setCustName(''); setCustPhone('');
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'completed': return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    }
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-amber-500" />
            Reservas de Mesas
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Gestiona las reservas y bloqueos de mesas por fecha.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="h-11 px-5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
          <CalendarPlus className="w-5 h-5" /> Nueva Reserva
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-full min-h-0">
        {/* Selector de Fecha */}
        <div className="w-full md:w-72 rounded-3xl border border-stone-200/70 dark:border-stone-800 p-6 shadow-xl shadow-stone-200/20 dark:shadow-none flex-shrink-0 relative overflow-hidden bg-white dark:bg-stone-900">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-500">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Día de Reserva</label>
              <p className="text-sm font-bold text-stone-900 dark:text-white">Filtro Activo</p>
            </div>
          </div>
          
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 transition-all focus:ring-4 focus:ring-amber-500/10 dark:text-white mb-5 font-bold cursor-pointer"
          />
          <div className="text-xs p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl text-center border border-stone-100 dark:border-stone-800">
            <p className="text-stone-500 dark:text-stone-400 mb-1">Mostrando agenda para el:</p>
            <strong className="text-stone-900 dark:text-white text-sm capitalize block">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </strong>
          </div>
        </div>

        {/* Lista de Reservas */}
        <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/70 dark:border-stone-800 shadow-xl shadow-stone-200/10 dark:shadow-none p-6 overflow-y-auto custom-scrollbar">
          {filteredReservations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <div className="w-20 h-20 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-10 h-10 text-stone-300 dark:text-stone-600" />
              </div>
              <p className="font-bold text-lg text-stone-900 dark:text-white">Día Libre</p>
              <p className="font-medium mt-1">No hay reservas agendadas para esta fecha.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredReservations.map(res => (
                <div key={res.id} className="group relative border-2 border-stone-100 dark:border-stone-800/60 rounded-3xl p-5 flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-300 bg-white dark:bg-stone-900 hover:shadow-lg hover:shadow-amber-500/5">
                  <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity bg-amber-400"></div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-stone-400" /> {res.customerName}
                      </h3>
                      {res.phone && <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {res.phone}</p>}
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", getStatusColor(res.status))}>
                      {getStatusLabel(res.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 py-3 border-y border-stone-200 dark:border-stone-800 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-stone-900 dark:text-white">{res.time}</span>
                    </div>
                    <div className="w-px h-4 bg-stone-300 dark:bg-stone-700"></div>
                    <div className="font-bold text-stone-900 dark:text-white">{res.tableNumber}</div>
                    <div className="w-px h-4 bg-stone-300 dark:bg-stone-700"></div>
                    <div className="text-stone-600 dark:text-stone-400 text-sm">{res.guestCount} pax</div>
                  </div>

                  <div className="flex justify-end gap-2">
                    {res.status === 'pending' && (
                      <button onClick={() => updateReservationStatus(res.id, 'confirmed')} className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-1"><Check className="w-3 h-3"/> Confirmar</button>
                    )}
                    {(res.status === 'pending' || res.status === 'confirmed') && (
                      <button onClick={() => updateReservationStatus(res.id, 'cancelled')} className="px-3 py-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center gap-1"><X className="w-3 h-3"/> Cancelar</button>
                    )}
                    {res.status === 'confirmed' && (
                      <button onClick={() => updateReservationStatus(res.id, 'completed')} className="px-3 py-1.5 text-xs font-bold bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600">Marcar Completada</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-md flex items-center justify-center p-4">
           <form onSubmit={handleAdd} className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              
              <div className="bg-stone-50 dark:bg-stone-950/50 px-8 py-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <CalendarPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-stone-900 dark:text-white leading-tight">Agendar Reserva</h3>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-0.5">Registra una nueva mesa en el calendario</p>
                </div>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Nombre del Cliente</label>
                    <input placeholder="Ej. Juan Pérez" value={custName} onChange={e=>setCustName(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Teléfono</label>
                    <input placeholder="Opcional" value={custPhone} onChange={e=>setCustPhone(e.target.value)} className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Personas (PAX)</label>
                    <input type="number" min="1" value={guestCount} onChange={e=>setGuestCount(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Fecha</label>
                    <input type="date" value={resDate} onChange={e=>setResDate(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Hora</label>
                    <input type="time" value={resTime} onChange={e=>setResTime(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Mesa Asignada</label>
                    <input placeholder="Ej. Mesa 5, Terraza" value={tableNo} onChange={e=>setTableNo(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 dark:bg-stone-950/50 p-6 flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
                <button type="button" onClick={()=>setIsAdding(false)} className="px-5 py-3 font-bold text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-3 font-black text-sm bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-100 active:scale-95 transition-all shadow-xl shadow-stone-900/10">Confirmar Reserva</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
