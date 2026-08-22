import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  FileText, CheckCircle2, AlertTriangle, XCircle, Search, 
  Filter, Download, ArrowRightLeft, Plus, Eye, Printer, 
  Building2, UserCheck, ShieldCheck, RefreshCw, Hash
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { SunatInvoice } from "../../types";
import { ThermalTicket } from "../tickets/ThermalTicket";

export default function SunatView() {
  const { sunatInvoices, createSunatInvoice, updateSunatInvoiceStatus, settings } = useAppStore();
  const [activeTab, setActiveTab] = useState<'Todos' | 'Aceptados' | 'Rechazados' | 'Pendientes'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'Boleta' | 'Factura' | 'Nota de Crédito'>('Boleta');
  const [customerName, setCustomerName] = useState('');
  const [customerDocType, setCustomerDocType] = useState<'DNI' | 'RUC'>('DNI');
  const [customerDocNumber, setCustomerDocNumber] = useState('');
  const [totalAmountInput, setTotalAmountInput] = useState('85.00');

  // Preview de Comprobante / Ticket
  const [previewInvoice, setPreviewInvoice] = useState<SunatInvoice | null>(null);

  const filteredDocs = useMemo(() => {
    return sunatInvoices.filter(doc => {
      const matchTab = 
        activeTab === 'Todos' ? true :
        activeTab === 'Aceptados' ? doc.status === 'Aceptado' :
        activeTab === 'Rechazados' ? doc.status === 'Rechazado' :
        activeTab === 'Pendientes' ? doc.status === 'Pendiente' : true;

      const matchSearch = 
        doc.number.includes(searchQuery) ||
        doc.series.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.customerDocNumber && doc.customerDocNumber.includes(searchQuery));

      return matchTab && matchSearch;
    });
  }, [sunatInvoices, activeTab, searchQuery]);

  const totalEmitted = sunatInvoices.reduce((acc, doc) => acc + doc.total, 0);
  const acceptedCount = sunatInvoices.filter(d => d.status === 'Aceptado').length;
  const pendingCount = sunatInvoices.filter(d => d.status === 'Pendiente').length;
  const rejectedCount = sunatInvoices.filter(d => d.status === 'Rechazado').length;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalAmountInput) || 0;
    const subtotal = Number((total / 1.18).toFixed(2));
    const igv = Number((total - subtotal).toFixed(2));
    const series = invoiceType === 'Factura' ? 'F001' : invoiceType === 'Boleta' ? 'B001' : 'FC01';
    const number = String(sunatInvoices.length + 1).padStart(6, '0');

    createSunatInvoice({
      type: invoiceType,
      series,
      number,
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Cliente General',
      customerDocType,
      customerDocNumber: customerDocNumber.trim() || '00000000',
      subtotal,
      igv,
      total,
      status: 'Aceptado',
      paymentMethod: 'Efectivo',
    });

    setShowNewInvoiceModal(false);
    setCustomerName('');
    setCustomerDocNumber('');
    setTotalAmountInput('85.00');
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-amber-500" />
            Facturación Electrónica SUNAT
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Emisión de Boletas (B001), Facturas (F001) y sincronización con OSE / PSE
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewInvoiceModal(true)}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Emitir Comprobante
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <span className="text-stone-500 text-xs font-bold uppercase tracking-wider block mb-1">Total Emitido</span>
          <div className="text-3xl font-black font-mono text-stone-900 mb-1">{settings.currency} {totalEmitted.toFixed(2)}</div>
          <p className="text-xs font-semibold text-stone-500">{sunatInvoices.length} comprobantes registrados</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Aceptados SUNAT
          </span>
          <div className="text-3xl font-black font-mono text-emerald-900 mb-1">{acceptedCount}</div>
          <p className="text-xs font-bold text-emerald-700">Con CDR y Hash válido</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <span className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> En Cola / Pendientes
          </span>
          <div className="text-3xl font-black font-mono text-amber-900 mb-1">{pendingCount}</div>
          <p className="text-xs font-bold text-amber-700">Por sincronizar con OSE</p>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <span className="text-rose-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <XCircle className="w-4 h-4 text-rose-600" /> Rechazados
          </span>
          <div className="text-3xl font-black font-mono text-rose-900 mb-1">{rejectedCount}</div>
          <p className="text-xs font-bold text-rose-700">Requieren corrección</p>
        </div>
      </div>

      {/* ── TABLA DE COMPROBANTES ── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-stone-50/60">
          <div className="flex gap-1 bg-stone-200/70 p-1 rounded-xl w-full sm:w-auto">
            {(['Todos', 'Aceptados', 'Pendientes', 'Rechazados'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex-1 sm:flex-none",
                  activeTab === tab 
                    ? "bg-white text-stone-900 shadow-sm" 
                    : "text-stone-600 hover:text-stone-900"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar por serie, número o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-stone-900 outline-none focus:border-amber-500 shadow-xs"
            />
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-6 py-3 border-b border-stone-200 bg-stone-100/70 text-[11px] font-black text-stone-600 uppercase tracking-wider">
          <div className="col-span-3">Comprobante</div>
          <div className="col-span-2">Fecha / Hora</div>
          <div className="col-span-3">Cliente / Documento</div>
          <div className="col-span-2 text-right">Total (S/)</div>
          <div className="col-span-2 text-center">Estado SUNAT</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-stone-100 overflow-y-auto max-h-[500px] custom-scrollbar">
          {filteredDocs.length === 0 ? (
            <div className="p-10 text-center text-stone-400 text-xs font-bold">
              No se encontraron comprobantes electrónicos
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div 
                key={doc.id} 
                className="grid grid-cols-12 gap-3 px-6 py-3.5 hover:bg-amber-50/30 transition items-center text-xs"
              >
                <div className="col-span-3">
                  <div className="font-mono font-black text-stone-900 text-sm">{doc.series}-{doc.number}</div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase">{doc.type}</span>
                </div>

                <div className="col-span-2 text-stone-600 font-medium">
                  {new Date(doc.date).toLocaleDateString('es-PE')}
                  <span className="block text-[10px] text-stone-400 font-mono">
                    {new Date(doc.date).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="col-span-3">
                  <div className="font-bold text-stone-900 truncate">{doc.customerName}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{doc.customerDocType}: {doc.customerDocNumber}</div>
                </div>

                <div className="col-span-2 text-right">
                  <span className="font-mono font-black text-stone-900 text-sm">
                    {settings.currency} {doc.total.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-stone-400">IGV: {settings.currency} {doc.igv.toFixed(2)}</span>
                </div>

                <div className="col-span-2 flex items-center justify-center gap-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1",
                    doc.status === 'Aceptado' ? "bg-emerald-100 text-emerald-800" :
                    doc.status === 'Rechazado' ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  )}>
                    {doc.status === 'Aceptado' && <CheckCircle2 className="w-3 h-3" />}
                    {doc.status === 'Rechazado' && <XCircle className="w-3 h-3" />}
                    {doc.status === 'Pendiente' && <AlertTriangle className="w-3 h-3" />}
                    {doc.status}
                  </span>

                  <button
                    onClick={() => setPreviewInvoice(doc)}
                    className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
                    title="Ver e Imprimir Ticket Térmico"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ═══ MODAL EMISIÓN DE COMPROBANTE ═══ */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-lg text-stone-900 mb-1">Emitir Comprobante Electrónico</h3>
            <p className="text-xs text-stone-500 mb-4">Genera Boleta o Factura con conexión SUNAT</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Tipo de Comprobante</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Boleta', 'Factura', 'Nota de Crédito'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setInvoiceType(t);
                        if (t === 'Factura') setCustomerDocType('RUC');
                        if (t === 'Boleta') setCustomerDocType('DNI');
                      }}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition",
                        invoiceType === t ? "bg-stone-900 text-white border-stone-900" : "bg-stone-50 text-stone-600 border-stone-200"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Documento</label>
                  <select
                    value={customerDocType}
                    onChange={(e) => setCustomerDocType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Número de Doc.</label>
                  <input
                    type="text"
                    placeholder={customerDocType === 'RUC' ? "20601234567" : "45892147"}
                    value={customerDocNumber}
                    onChange={(e) => setCustomerDocNumber(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nombre / Razón Social</label>
                <input
                  type="text"
                  placeholder="Ej: Inversiones del Norte S.A.C."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Monto Total (S/)</label>
                <input
                  type="number"
                  step="0.1"
                  value={totalAmountInput}
                  onChange={(e) => setTotalAmountInput(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-sm font-black font-mono text-stone-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Firmar y Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ PREVIEW TÉRMICO DE COMPROBANTE ═══ */}
      {previewInvoice && (
        <ThermalTicket
          order={{
            id: previewInvoice.orderId || `ord-${previewInvoice.number}`,
            type: "salón",
            floor: 1,
            tableNumber: "Mesa 101",
            status: "sent",
            items: [
              { id: "1", productId: "1", productName: "Consumo Restaurante", quantity: 1, price: previewInvoice.total, station: "Cocina", sentToKitchen: true, batchNumber: 1 }
            ],
            total: previewInvoice.total,
            createdAt: previewInvoice.date,
            updatedAt: previewInvoice.date,
            waiterName: "Cajero Principal",
          }}
          ticketType="boleta_cliente"
          invoiceSeries={previewInvoice.series}
          invoiceNumber={previewInvoice.number}
          customerDocType={previewInvoice.customerDocType}
          customerDocNumber={previewInvoice.customerDocNumber}
          showQR={true}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

    </div>
  );
}
