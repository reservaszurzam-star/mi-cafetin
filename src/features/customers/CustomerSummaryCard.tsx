import React from 'react';
import { Customer, Settings } from '../../types';
import { formatMoney, createWhatsAppUrl } from '../../lib/formatters';
import { 
  Phone, IdCard, MessageCircle, FileDown, Trash2, 
  CheckCircle, AlertCircle, Plus, Minus
} from 'lucide-react';

interface CustomerSummaryCardProps {
  customer: Customer;
  balance: number;
  settings: Settings;
  onOpenCharge: () => void;
  onOpenPayment: () => void;
  onDownloadPdf: () => void;
  onDeleteCustomer: () => void;
}

export const CustomerSummaryCard: React.FC<CustomerSummaryCardProps> = ({
  customer,
  balance,
  settings,
  onOpenCharge,
  onOpenPayment,
  onDownloadPdf,
  onDeleteCustomer,
}) => {
  const handleSendWhatsAppReminder = () => {
    if (!customer.phone) {
      alert("El cliente no tiene un teléfono registrado.");
      return;
    }
    const msg = `Hola ${customer.name}, le saludamos de *${settings.companyName}*.\n` +
      `Le informamos que su saldo pendiente es de *${formatMoney(balance, settings.currency)}*.\n` +
      `Agradecemos su pronta regularización. ¡Muchas gracias!`;

    const url = createWhatsAppUrl(customer.phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900">{customer.name}</h2>
            {balance <= 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3 h-3" /> Al Día
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                <AlertCircle className="w-3 h-3" /> Deudor
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500 font-semibold mt-1">
            <span>{customer.docType || 'DNI'}: {customer.docNumber || 'Sin Documento'}</span>
            <span>·</span>
            <span>Tel: {customer.phone || 'Sin Teléfono'}</span>
          </div>
        </div>

        {/* Saldo Badge */}
        <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-center sm:text-right">
          <span className="text-[10px] uppercase font-black tracking-widest text-stone-400 block">Saldo Actual</span>
          <span className={`text-2xl font-black font-mono ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatMoney(balance, settings.currency)}
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-stone-100">
        <button
          onClick={onOpenCharge}
          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4 text-rose-600" /> Registrar Consumo (Fiado)
        </button>

        <button
          onClick={onOpenPayment}
          className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition"
        >
          <Minus className="w-4 h-4 text-emerald-600" /> Registrar Pago / Abono
        </button>

        {customer.phone && balance > 0 && (
          <button
            onClick={handleSendWhatsAppReminder}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Recordar por WhatsApp
          </button>
        )}

        <button
          onClick={onDownloadPdf}
          className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
        >
          <FileDown className="w-3.5 h-3.5" /> Descargar PDF
        </button>

        <button
          onClick={onDeleteCustomer}
          className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition ml-auto"
          title="Eliminar cliente"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
