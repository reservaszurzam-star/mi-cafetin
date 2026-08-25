import React, { useState } from 'react';
import { X, CheckCircle2, Banknote, QrCode, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PaymentMethod, Settings, Customer } from '../../types';
import { PAYMENT_METHODS, PAY_ICONS, PAY_IMAGES } from './posConstants';
import { formatMoney } from '../../lib/formatters';
import { lookupDocumentData } from '../../lib/sunatService';

interface POSCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableLabel: string;
  total: number;
  settings: Settings;
  customers: Customer[];
  onConfirmPayment: (details: {
    paymentMethod: PaymentMethod;
    docType: 'Boleta' | 'Factura' | 'Nota de Venta';
    docNumber?: string;
    customerName?: string;
    splitType: 'single' | 'equal';
    splitWays: number;
    splitMethods: PaymentMethod[];
    printTicket: boolean;
  }) => void;
}

export const POSCheckoutModal: React.FC<POSCheckoutModalProps> = ({
  isOpen,
  onClose,
  tableLabel,
  total,
  settings,
  customers,
  onConfirmPayment,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [splitType, setSplitType] = useState<'single' | 'equal'>('single');
  const [splitWays, setSplitWays] = useState(2);
  const [splitMethods, setSplitMethods] = useState<PaymentMethod[]>(Array(10).fill('Efectivo'));

  const [docType, setDocType] = useState<'Boleta' | 'Factura' | 'Nota de Venta'>('Boleta');
  const [docNumber, setDocNumber] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [showQR, setShowQR] = useState(settings.showPaymentQR ?? true);
  const [printTicket, setPrintTicket] = useState(true);

  if (!isOpen) return null;

  const handleSearchDoc = async (numToSearch?: string) => {
    const targetDoc = (numToSearch || docNumber).replace(/\D/g, '').trim();
    if (!targetDoc) return;

    // Primero revisar en clientes locales
    const localMatch = customers.find(c => c.docNumber === targetDoc);
    if (localMatch) {
      setCustomerNameInput(localMatch.name);
      return;
    }

    if ((docType === 'Factura' && targetDoc.length === 11) || (docType === 'Boleta' && targetDoc.length === 8)) {
      setIsSearchingDoc(true);
      try {
        const queryType = docType === 'Factura' ? 'RUC' : 'DNI';
        const info = await lookupDocumentData(targetDoc, queryType);
        if (info?.name) {
          setCustomerNameInput(info.name);
        } else {
          setCustomerNameInput(docType === 'Factura' ? `EMPRESA RUC ${targetDoc}` : `CLIENTE DNI ${targetDoc}`);
        }
      } catch {
        // Fallback
      } finally {
        setIsSearchingDoc(false);
      }
    }
  };

  const handleDocChange = (val: string) => {
    setDocNumber(val);
    const clean = val.replace(/\D/g, '').trim();
    if ((docType === 'Factura' && clean.length === 11) || (docType === 'Boleta' && clean.length === 8)) {
      handleSearchDoc(clean);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPayment({
      paymentMethod,
      docType,
      docNumber: docNumber.trim() || undefined,
      customerName: customerNameInput.trim() || undefined,
      splitType,
      splitWays,
      splitMethods,
      printTicket,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50">
          <div>
            <h3 className="font-black text-xl text-stone-900">Cobrar {tableLabel}</h3>
            <p className="text-xs font-semibold text-stone-500 mt-0.5">Comprobante y división de cuenta</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-200 transition bg-white border border-stone-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          
          {/* Total Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 rounded-3xl text-white shadow-lg shadow-amber-500/20 text-center">
            <p className="text-amber-100 font-black uppercase tracking-widest text-[10px] mb-1">Total a cobrar</p>
            <p className="font-mono font-black text-4xl tracking-tight">{formatMoney(total, settings.currency)}</p>
          </div>

          {/* Tipo de Comprobante (Boleta / Factura / Nota) */}
          <div>
            <label className="block text-xs font-black text-stone-600 uppercase tracking-wider mb-2">
              Tipo de Comprobante
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Boleta", "Factura", "Nota de Venta"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDocType(t)}
                  className={cn(
                    "py-2.5 px-2 rounded-xl font-black text-xs transition border text-center cursor-pointer",
                    docType === t
                      ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* RUC / DNI Input */}
          {docType !== "Nota de Venta" && (
            <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={docType === "Factura" ? "RUC (11 dígitos)" : "DNI (8 dígitos)"}
                  value={docNumber}
                  onChange={(e) => handleDocChange(e.target.value)}
                  className="flex-1 bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleSearchDoc()}
                  disabled={isSearchingDoc}
                  className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSearchingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Buscar"}
                </button>
              </div>
              {isSearchingDoc && (
                <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Consultando base oficial RENIEC / SUNAT...
                </p>
              )}
              {customerNameInput && !isSearchingDoc && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{customerNameInput}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* División de Cuenta */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              type="button"
              onClick={() => setSplitType("single")}
              className={cn(
                "flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer",
                splitType === "single" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
              )}
            >
              Pago Único
            </button>
            <button
              type="button"
              onClick={() => setSplitType("equal")}
              className={cn(
                "flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer",
                splitType === "equal" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
              )}
            >
              Dividir en Partes Iguales
            </button>
          </div>

          {splitType === "single" ? (
            /* Métodos de Pago Grid */
            <div>
              <label className="block text-xs font-black text-stone-600 uppercase tracking-wider mb-2">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={cn(
                      "p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer",
                      paymentMethod === m
                        ? "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20"
                        : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                    )}
                  >
                    <div className="w-7 h-7 flex items-center justify-center">{PAY_ICONS[m]}</div>
                    <span className="font-black text-xs">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Split Equal */
            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-700">Dividir entre cuántas personas:</span>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSplitWays(n)}
                      className={cn(
                        "w-8 h-8 rounded-xl text-xs font-black transition",
                        splitWays === n ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-700"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-center p-3 bg-amber-100/80 rounded-xl text-amber-900 font-black text-sm font-mono">
                {formatMoney(total / splitWays, settings.currency)} por persona
              </div>
            </div>
          )}

          {/* Botón Finalizar Cobro */}
          <div className="pt-3 border-t border-stone-100 flex items-center gap-3">
            <button
              type="submit"
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              <span>Confirmar Pago de {formatMoney(total, settings.currency)}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
