import React, { useState } from 'react';
import { Truck, X } from 'lucide-react';

interface POSDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { customerName: string; phone: string; address: string }) => void;
}

export const POSDeliveryModal: React.FC<POSDeliveryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [delDiner, setDelDiner] = useState('');
  const [delPhone, setDelPhone] = useState('');
  const [delAddress, setDelAddress] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delDiner.trim()) return;

    onConfirm({
      customerName: delDiner.trim(),
      phone: delPhone.trim(),
      address: delAddress.trim(),
    });

    setDelDiner('');
    setDelPhone('');
    setDelAddress('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 leading-tight">Nuevo Pedido Delivery</h3>
              <p className="text-xs text-stone-500 font-semibold">Datos de entrega del cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              placeholder="Ej: Jorge Ramírez"
              value={delDiner}
              onChange={(e) => setDelDiner(e.target.value)}
              required
              autoFocus
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="text"
              placeholder="987654321"
              value={delPhone}
              onChange={(e) => setDelPhone(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Dirección de Entrega
            </label>
            <input
              type="text"
              placeholder="Av. Los Próceres 1420, Dpto 302"
              value={delAddress}
              onChange={(e) => setDelAddress(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-stone-900 text-white font-black rounded-xl text-xs hover:bg-stone-800 transition shadow-md"
            >
              Crear Comanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
