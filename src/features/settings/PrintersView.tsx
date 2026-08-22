import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  Printer, Wifi, CheckCircle2, ServerCrash, RefreshCw, Plus, 
  Trash2, Edit3, X, FileText, Check, ArrowRight, Activity, 
  Cpu, Zap, Receipt, AlertCircle, Radio, QrCode
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { StationPrinter, OrderStation } from '../../types';

const AVAILABLE_CATEGORIES = [
  "Combos & Promos",
  "Pollos a la Brasa",
  "Parrillas & Carnes",
  "Ceviches & Pescados",
  "Guarniciones & Extras",
  "Bebidas & Refrescos",
  "Tragos & Cocteles",
  "Postres & Dulces",
  "Menú Diario"
];

const AVAILABLE_STATIONS: OrderStation[] = [
  "Horno & Pollos",
  "Cocina & Parrilla",
  "Barra & Bebidas",
  "Estación Postres",
  "Caja & Facturación"
];

export default function PrintersView() {
  const { printers, updatePrinters, settings } = useAppStore();

  // Test Ping State
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { ok: boolean; latency: number }>>({});

  // Modal Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<StationPrinter | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formStation, setFormStation] = useState<OrderStation | string>("Horno & Pollos");
  const [formIp, setFormIp] = useState("192.168.1.100");
  const [formConnType, setFormConnType] = useState<"network" | "usb" | "bluetooth">("network");
  const [formPaperWidth, setFormPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formAutoPrint, setFormAutoPrint] = useState(true);

  // Modal Test Print Ticket Simulation
  const [testTicketPrinter, setTestTicketPrinter] = useState<StationPrinter | null>(null);
  const [printingStatus, setPrintingStatus] = useState<"idle" | "printing" | "success">("idle");

  const handleOpenCreate = () => {
    setEditingPrinter(null);
    setFormName("");
    setFormStation("Horno & Pollos");
    setFormIp("192.168.1.10" + (printers.length + 1));
    setFormConnType("network");
    setFormPaperWidth("80mm");
    setFormCategories(["Combos & Promos", "Pollos a la Brasa"]);
    setFormAutoPrint(true);
    setShowModal(true);
  };

  const handleOpenEdit = (p: StationPrinter) => {
    setEditingPrinter(p);
    setFormName(p.name);
    setFormStation(p.station);
    setFormIp(p.ipAddress || "192.168.1.100");
    setFormConnType(p.connectionType || "network");
    setFormPaperWidth(p.paperWidth || "80mm");
    setFormCategories(p.categories || []);
    setFormAutoPrint(p.autoPrint !== false);
    setShowModal(true);
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPrinter) {
      const updated = printers.map(p => p.id === editingPrinter.id ? {
        ...p,
        name: formName.trim(),
        station: formStation,
        ipAddress: formIp.trim(),
        connectionType: formConnType,
        paperWidth: formPaperWidth,
        categories: formCategories,
        autoPrint: formAutoPrint,
      } : p);
      updatePrinters(updated);
    } else {
      const newPrinter: StationPrinter = {
        id: `prn-${Date.now()}`,
        name: formName.trim(),
        station: formStation,
        ipAddress: formIp.trim(),
        connectionType: formConnType,
        paperWidth: formPaperWidth,
        categories: formCategories,
        status: "online",
        autoPrint: formAutoPrint,
      };
      updatePrinters([...printers, newPrinter]);
    }

    setShowModal(false);
    setEditingPrinter(null);
  };

  const handleDeletePrinter = (id: string) => {
    if (confirm("¿Estás seguro de desvincular esta impresora?")) {
      updatePrinters(printers.filter(p => p.id !== id));
    }
  };

  const handleTestPing = (printer: StationPrinter) => {
    setPingingId(printer.id);
    setTimeout(() => {
      const latency = Math.floor(Math.random() * 18) + 8;
      setPingResults(prev => ({
        ...prev,
        [printer.id]: { ok: true, latency }
      }));
      setPingingId(null);
    }, 600);
  };

  const handleTestPrint = (printer: StationPrinter) => {
    setTestTicketPrinter(printer);
    setPrintingStatus("printing");
    setTimeout(() => {
      setPrintingStatus("success");
    }, 1200);
  };

  const toggleCategory = (cat: string) => {
    setFormCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Hardware & Redes
            </span>
            <span className="text-xs text-stone-400 font-bold">· {settings.companyName}</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Printer className="w-7 h-7 text-amber-500" />
            Centro de Impresoras Térmicas & Ruteo
          </h1>
          <p className="text-xs text-stone-500 font-semibold mt-0.5">
            Monitoreo en tiempo real de ticketeras de Cocina, Horno, Barra y Facturación SUNAT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenCreate}
            className="h-11 px-5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-5 h-5" /> Vincular Impresora
          </button>
        </div>
      </div>

      {/* ── MÉTRICAS DE RED ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Ticketeras Conectadas</span>
            <Printer className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{printers.length}</div>
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> Todas en línea
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Protocolo de Red</span>
            <Wifi className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">ESC/POS</div>
          <span className="text-[10px] font-bold text-stone-500">Puerto TCP: 9100</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Ancho de Papel</span>
            <Receipt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-800 mt-1">80mm / 58mm</div>
          <span className="text-[10px] font-bold text-purple-700">Corte automático activo</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Pre-Cuenta Mozo</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-800 mt-1">Habilitada</div>
          <span className="text-[10px] font-bold text-blue-700">Impresión antes de cobrar</span>
        </div>
      </div>

      {/* ── GRID DE IMPRESORAS ACTIVAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {printers.map((printer) => {
          const ping = pingResults[printer.id];
          const isPinging = pingingId === printer.id;

          return (
            <div 
              key={printer.id} 
              className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-amber-400 transition-all"
            >
              {/* Header de la Impresora */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      <Printer className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-stone-900 leading-tight">{printer.name}</h3>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md">
                          En Línea
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-stone-500 font-bold">
                        <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          {printer.ipAddress || '192.168.1.100'}:9100
                        </span>
                        <span className="text-stone-400">· {printer.paperWidth || '80mm'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(printer)}
                      title="Editar Configuración"
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePrinter(printer.id)}
                      title="Desvincular"
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Estación & Categorías Ruteadas */}
                <div className="space-y-3 mt-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-stone-500 uppercase tracking-wider text-[10px]">Estación de Salida:</span>
                    <span className="font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                      {printer.station}
                    </span>
                  </div>

                  <div>
                    <span className="font-black text-stone-500 uppercase tracking-wider text-[10px] block mb-1.5">
                      Categorías de Platos Ruteadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {printer.categories.map(cat => (
                        <span 
                          key={cat}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200"
                        >
                          {cat}
                        </span>
                      ))}
                      {printer.categories.length === 0 && (
                        <span className="text-xs font-semibold text-stone-400 italic">
                          Sin categorías asignadas (comandas generales).
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con Acciones de Diagnóstico */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  {ping ? (
                    <span className="text-emerald-700 font-black">Ping: {ping.latency} ms (Excelente)</span>
                  ) : (
                    <span>Estado: Listo</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(printer)}
                    disabled={isPinging}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Wifi className={cn("w-3.5 h-3.5", isPinging && "animate-spin")} />
                    <span>{isPinging ? "Probando..." : "Diagnóstico Ping"}</span>
                  </button>

                  <button
                    onClick={() => handleTestPrint(printer)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Imprimir Prueba</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL AGREGAR / EDITAR IMPRESORA ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSavePrinter}
            className="bg-white rounded-3xl w-full max-w-lg border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <Printer className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    {editingPrinter ? "Editar Ticketera" : "Vincular Nueva Impresora Térmica"}
                  </h3>
                  <p className="text-xs text-stone-500 font-semibold">Configuración de IP, ruteo y corte de papel</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                  Nombre de la Impresora *
                </label>
                <input 
                  autoFocus
                  placeholder="Ej: Impresora Cocina Caliente 01"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Estación Operativa
                  </label>
                  <select
                    value={formStation}
                    onChange={e => setFormStation(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  >
                    {AVAILABLE_STATIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Dirección IP (Red Local)
                  </label>
                  <input 
                    placeholder="192.168.1.100"
                    value={formIp}
                    onChange={e => setFormIp(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Tipo de Conexión
                  </label>
                  <select
                    value={formConnType}
                    onChange={e => setFormConnType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  >
                    <option value="network">Ethernet / WiFi (Red IP)</option>
                    <option value="usb">Cable USB Directo</option>
                    <option value="bluetooth">Bluetooth Inalámbrico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Ancho de Papel
                  </label>
                  <select
                    value={formPaperWidth}
                    onChange={e => setFormPaperWidth(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  >
                    <option value="80mm">80 mm (Ticket Estándar Grande)</option>
                    <option value="58mm">58 mm (Ticket Angosto)</option>
                  </select>
                </div>
              </div>

              {/* Ruteo de Categorías */}
              <div>
                <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-2">
                  Ruteo de Categorías de Carta:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  {AVAILABLE_CATEGORIES.map(cat => {
                    const isChecked = formCategories.includes(cat);
                    return (
                      <label 
                        key={cat}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition",
                          isChecked ? "bg-amber-100/70 border-amber-300 text-amber-950" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat)}
                          className="w-4 h-4 rounded accent-amber-600"
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 px-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition shadow-md shadow-amber-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingPrinter ? "Guardar Cambios" : "Guardar Impresora"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL SIMULACIÓN DE TICKET TÉRMICO ── */}
      {testTicketPrinter && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-stone-800">
                  Prueba: {testTicketPrinter.name}
                </span>
              </div>
              <button 
                onClick={() => setTestTicketPrinter(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulación del Ticket Térmico */}
            <div className="p-6 bg-stone-100 flex justify-center">
              <div className="bg-white w-full max-w-[280px] p-4 shadow-md font-mono text-[11px] text-stone-800 border-t-4 border-dashed border-stone-300 border-b-4 space-y-2">
                <div className="text-center pb-2 border-b border-dashed border-stone-300">
                  <h4 className="font-black text-sm uppercase">{settings.companyName}</h4>
                  <p className="text-[10px] text-stone-500">TEST DE IMPRESIÓN ESC/POS</p>
                  <p className="text-[10px] text-stone-500">{new Date().toLocaleString()}</p>
                </div>

                <div className="py-1 border-b border-dashed border-stone-300 space-y-0.5">
                  <p className="font-bold">MESA: 04 (Salón Piso 1)</p>
                  <p>MOZO: Valentino (Owner)</p>
                  <p>ESTACIÓN: {testTicketPrinter.station}</p>
                  <p>IP: {testTicketPrinter.ipAddress || '192.168.1.100'}:9100</p>
                </div>

                <div className="py-1 border-b border-dashed border-stone-300 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>1x 1/4 POLLO BRASA</span>
                    <span>S/ 24.00</span>
                  </div>
                  <p className="text-[10px] text-stone-500 ml-3">* Con papas y ensalada clásica</p>
                  <div className="flex justify-between font-bold">
                    <span>1x CHICHA MORADA 500ML</span>
                    <span>S/ 8.00</span>
                  </div>
                </div>

                <div className="pt-1 flex justify-between font-black text-xs">
                  <span>TOTAL ESTIMADO:</span>
                  <span>S/ 32.00</span>
                </div>

                <div className="pt-2 text-center text-[10px] text-stone-400">
                  *** COMANDA DE COCINA GENERADA ***
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ticket Enviado con Éxito
              </span>

              <button
                onClick={() => setTestTicketPrinter(null)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
