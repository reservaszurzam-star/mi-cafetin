import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  Calendar as CalendarIcon, Clock, Phone, User, Check, X, 
  CalendarPlus, Users, UtensilsCrossed, DollarSign, MessageCircle,
  AlertCircle, CheckCircle2, ChevronRight, Plus, Trash2
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { Reservation, PreOrderItem } from "../../types";

export default function ReservationsView() {
  const { reservations, addReservation, updateReservationStatus, products, settings } = useAppStore();
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [resDate, setResDate] = useState(selectedDate);
  const [resTime, setResTime] = useState('19:30');
  const [guestCount, setGuestCount] = useState('4');
  const [tableNo, setTableNo] = useState('Mesa 101');
  const [depositAmount, setDepositAmount] = useState('50.00');
  const [notes, setNotes] = useState('');
  
  // Pre-orden de platos
  const [preOrderedItems, setPreOrderedItems] = useState<PreOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => r.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [reservations, selectedDate]);

  const handleAddPreOrderItem = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    setPreOrderedItems(prev => {
      const idx = prev.findIndex(i => i.productId === prod.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { productId: prod.id, productName: prod.name, quantity: 1, price: prod.price }];
    });
  };

  const handleRemovePreOrderItem = (productId: string) => {
    setPreOrderedItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;
    addReservation({
      customerName: custName.trim(),
      phone: custPhone.trim(),
      date: resDate,
      time: resTime,
      guestCount: parseInt(guestCount) || 2,
      tableNumber: tableNo,
      deposit: parseFloat(depositAmount) || 0,
      notes: notes.trim(),
      preOrderItems: preOrderedItems,
      status: 'confirmed'
    });
    setIsAdding(false);
    setCustName(''); 
    setCustPhone('');
    setNotes('');
    setPreOrderedItems([]);
  };

  // Enviar recordatorio por WhatsApp
  const sendWhatsAppReminder = (res: Reservation) => {
    const cleanPhone = (res.phone || "51987654321").replace(/\D/g, '');
    const preOrderText = res.preOrderItems && res.preOrderItems.length > 0
      ? `%0A*Platos Pre-ordenados:*%0A` + res.preOrderItems.map(i => `• ${i.quantity}x ${i.productName}`).join('%0A')
      : '';

    const msg = `*CONFIRMACIÓN DE RESERVA - ${settings.companyName.toUpperCase()}*%0A%0A` +
      `Estimado(a) *${res.customerName}*:%0A` +
      `Confirmamos los datos de su reserva:%0A%0A` +
      `*Fecha:* ${res.date}%0A` +
      `*Hora:* ${res.time}%0A` +
      `*Personas:* ${res.guestCount}%0A` +
      `*Mesa Asignada:* ${res.tableNumber}` +
      preOrderText + `%0A%0A` +
      `Los esperamos con mucho gusto. Muchas gracias.`;

    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">Pendiente</span>;
      case 'confirmed': return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">Confirmada</span>;
      case 'completed': return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-stone-100 text-stone-700">Completada</span>;
      case 'cancelled': return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-amber-500" />
            Reservas & Pre-pedidos de Mesas
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Gestión de reservas, tiempo de llegada, platos anticipados y adelanto en caja
          </p>
        </div>

        <button 
          onClick={() => setIsAdding(true)} 
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
        >
          <CalendarPlus className="w-4 h-4" /> Nueva Reserva
        </button>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Panel Izquierdo: Calendario / Filtro */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-black text-stone-500 uppercase tracking-wider mb-2">
              Fecha de la Agenda
            </label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 cursor-pointer shadow-xs"
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block mb-1">Día Seleccionado</span>
            <p className="font-black text-sm text-stone-900 capitalize">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs font-bold text-amber-700 mt-1">{filteredReservations.length} reservas registradas</p>
          </div>
        </div>

        {/* Panel Derecho: Lista de Reservas */}
        <div className="md:col-span-8 space-y-3">
          {filteredReservations.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center text-stone-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">No hay reservas para esta fecha</p>
              <p className="text-xs text-stone-400 mt-1">Haz clic en "Nueva Reserva" para registrar una</p>
            </div>
          ) : (
            filteredReservations.map((res) => (
              <div key={res.id} className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:border-amber-400 transition flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 font-mono font-black text-base flex items-center justify-center">
                      {res.time}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-stone-900">{res.customerName}</h4>
                      <div className="flex items-center gap-3 text-xs text-stone-500 font-semibold mt-0.5">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-stone-400" /> {res.guestCount} personas</span>
                        <span className="flex items-center gap-1"><UtensilsCrossed className="w-3.5 h-3.5 text-stone-400" /> {res.tableNumber}</span>
                        {res.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-stone-400" /> {res.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(res.status)}
                    <button
                      onClick={() => sendWhatsAppReminder(res)}
                      className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition"
                      title="Enviar recordatorio WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Platos Pre-ordenados */}
                {res.preOrderItems && res.preOrderItems.length > 0 && (
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider block">
                      Platos Pre-ordenados para Cocina:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {res.preOrderItems.map((item, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-800">
                          {item.quantity}x {item.productName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones de Estado */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <div className="text-xs text-stone-500 font-semibold">
                    {res.deposit ? `Adelanto recibido: ${settings.currency} ${res.deposit.toFixed(2)}` : 'Sin adelanto'}
                  </div>

                  <div className="flex gap-2">
                    {res.status === 'pending' && (
                      <button
                        onClick={() => updateReservationStatus(res.id, 'confirmed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                      >
                        Confirmar
                      </button>
                    )}
                    {res.status === 'confirmed' && (
                      <button
                        onClick={() => updateReservationStatus(res.id, 'completed')}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition"
                      >
                        Completar
                      </button>
                    )}
                    {res.status !== 'cancelled' && (
                      <button
                        onClick={() => updateReservationStatus(res.id, 'cancelled')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 rounded-xl text-xs font-bold transition"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ═══ MODAL CREAR RESERVA ═══ */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-stone-200 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="font-black text-lg text-stone-900 mb-1">Registrar Nueva Reserva</h3>
            <p className="text-xs text-stone-500 mb-4">Ingresa los datos del comensal y los platos anticipados</p>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nombre del Cliente</label>
                  <input
                    type="text"
                    placeholder="Ej: Lucía Benavides"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej: 987654321"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Hora</label>
                  <input
                    type="time"
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Personas</label>
                  <input
                    type="number"
                    min="1"
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Mesa Asignada</label>
                  <input
                    type="text"
                    placeholder="Ej: Mesa 102, Terraza 401"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Adelanto / Depósito (S/)</label>
                  <input
                    type="number"
                    step="5"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
              </div>

              {/* Pre-orden de Platos */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Pre-orden de Platos (Opcional)
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded-xl p-2 text-xs font-bold text-stone-900"
                  >
                    <option value="">Seleccionar plato o bebida...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {settings.currency} {p.price.toFixed(2)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPreOrderItem}
                    className="px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600"
                  >
                    + Agregar
                  </button>
                </div>

                {preOrderedItems.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {preOrderedItems.map(item => (
                      <div key={item.productId} className="flex justify-between items-center bg-white p-2 rounded-xl border border-stone-200 text-xs">
                        <span className="font-bold text-stone-900">{item.quantity}x {item.productName}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-700">{settings.currency} {(item.price * item.quantity).toFixed(2)}</span>
                          <button type="button" onClick={() => handleRemovePreOrderItem(item.productId)} className="text-rose-500 hover:text-rose-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-stone-900 text-white font-bold rounded-xl text-xs"
                >
                  Guardar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
