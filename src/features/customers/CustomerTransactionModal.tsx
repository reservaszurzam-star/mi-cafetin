import React, { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface CustomerTransactionModalProps {
  isOpen: boolean;
  type: 'charge' | 'payment';
  onClose: () => void;
  onConfirm: (amount: number, description: string, paymentMethod?: PaymentMethod) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "Efectivo", "Yape", "Plin", "Tarjeta", "Transferencia", "Otro"
];

export const CustomerTransactionModal: React.FC<CustomerTransactionModalProps> = ({
  isOpen,
  type,
  onClose,
  onConfirm,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');

  if (!isOpen) return null;

  const isCharge = type === 'charge';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    let desc = description.trim();
    if (!isCharge && !desc) desc = 'Pago / Abono de deuda';
    if (isCharge && !desc) {
      alert('Por favor ingrese una descripción del consumo');
      return;
    }

    onConfirm(numAmount, desc, !isCharge ? paymentMethod : undefined);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
              isCharge ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isCharge ? <Plus className="w-5 h-5 text-rose-600" /> : <Minus className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900 leading-tight">
                {isCharge ? 'Registrar Consumo (Fiado)' : 'Registrar Pago / Abono'}
              </h3>
              <p className="text-xs text-stone-500 font-semibold">
                {isCharge ? 'Aumenta la deuda del cliente' : 'Reduce la deuda del cliente'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Monto (S/) *
            </label>
            <input
              type="number"
              step="0.50"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-lg font-black font-mono text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Descripción / Concepto *
            </label>
            <input
              type="text"
              placeholder={isCharge ? "Ej: Consumo 1/2 Pollo + Bebida" : "Ej: Abono en efectivo / Yape"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required={isCharge}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          {!isCharge && (
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

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
              className={`flex-1 py-2.5 text-white font-black rounded-xl text-xs shadow-md transition ${
                isCharge ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isCharge ? 'Registrar Cargo' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
