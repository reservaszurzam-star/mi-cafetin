import React, { useState, useEffect } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  Printer, Wifi, CheckCircle2, ServerCrash, RefreshCw, Plus, 
  Trash2, Edit3, X, FileText, Check, ArrowRight, Activity, 
  Cpu, Zap, Receipt, AlertCircle, Radio, QrCode, Power,
  ShieldCheck, AlertTriangle, Clock, Send, Usb, Bluetooth, Smartphone
} from 'lucide-react';
import { cn, generateUUID } from "../../lib/utils";
import { StationPrinter, OrderStation } from '../../types';
import { bluetoothPrinter, BluetoothDeviceInfo } from '../../lib/bluetoothPrinter';
import { 
  runPrinterDiagnosticApi, 
  printTestTicketApi, 
  fetchSystemPrintersApi,
  DiagnosticResponse,
  PrintTestResponse,
  SystemPrinterOption
} from '../../lib/printerService';

const AVAILABLE_CATEGORIES = [
  "Combos & Promos",
  "Pollos a la Brasa",
  "Parrillas & Mostros",
  "Parrillas & Carnes",
  "Ceviches & Pescados",
  "Entradas & Chaufa",
  "Guarniciones & Salsas",
  "Guarniciones & Extras",
  "Bebidas & Refrescos",
  "Tragos & Cocteles",
  "Postres & Dulces",
  "Postres",
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

  // Diagnóstico en tiempo real
  const [diagnosticPrinter, setDiagnosticPrinter] = useState<StationPrinter | null>(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResponse | null>(null);

  // Estados de prueba de impresión física
  const [testPrintingId, setTestPrintingId] = useState<string | null>(null);
  const [printFeedback, setPrintFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Modal Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<StationPrinter | null>(null);

  // Lista de impresoras detectadas en Windows
  const [systemPrinters, setSystemPrinters] = useState<SystemPrinterOption[]>([]);
  const [loadingSystemPrinters, setLoadingSystemPrinters] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formStation, setFormStation] = useState<OrderStation | string>("Caja & Facturación");
  const [formIp, setFormIp] = useState("192.168.1.101");
  const [formUsbName, setFormUsbName] = useState("POS-58-Series");
  const [formPort, setFormPort] = useState<number>(9100);
  const [formConnType, setFormConnType] = useState<"tcp" | "network" | "usb" | "bluetooth">("tcp");
  const [formPaperWidth, setFormPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formAutoPrint, setFormAutoPrint] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);

  // Verificar todas las impresoras al entrar
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);

  // Estados de Bluetooth
  const [isPairingBt, setIsPairingBt] = useState(false);
  const [btConnectedInfo, setBtConnectedInfo] = useState<BluetoothDeviceInfo | null>(() => bluetoothPrinter.getConnectedDeviceInfo());

  const loadSystemPrinters = async () => {
    setLoadingSystemPrinters(true);
    const list = await fetchSystemPrintersApi();
    setSystemPrinters(list);
    if (list.length > 0 && !formUsbName) {
      const defaultThermal = list.find(p => p.name.toLowerCase().includes('pos') || p.name.toLowerCase().includes('58') || p.name.toLowerCase().includes('80') || p.name.toLowerCase().includes('bienex')) || list[0];
      setFormUsbName(defaultThermal.name);
    }
    setLoadingSystemPrinters(false);
  };

  const handlePairBluetoothDirectly = async (paperWidth: '58mm' | '80mm' = '58mm') => {
    setIsPairingBt(true);
    setPrintFeedback(null);
    try {
      const info = await bluetoothPrinter.pairBleDevice(paperWidth);
      setBtConnectedInfo(info);
      setFormName(info.name);
      setFormConnType("bluetooth");
      setFormPaperWidth(paperWidth);

      const existingIndex = printers.findIndex(p => p.connectionType === 'bluetooth' || p.name === info.name);
      if (existingIndex >= 0) {
        const updated = [...printers];
        updated[existingIndex] = {
          ...updated[existingIndex],
          name: info.name,
          connectionType: 'bluetooth',
          status: 'online',
          paperWidth,
          isActive: true,
          updatedAt: new Date().toISOString(),
        };
        updatePrinters(updated);
      } else {
        const newPrinter: StationPrinter = {
          id: generateUUID(),
          name: info.name || "Ticketera Bluetooth",
          station: formStation || "Caja & Facturación",
          ipAddress: info.name,
          port: 0,
          connectionType: "bluetooth",
          paperWidth,
          categories: ["Combos & Promos", "Pollos a la Brasa", "Bebidas & Refrescos", "Postres", "Menú Diario"],
          status: "online",
          autoPrint: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatePrinters([...printers, newPrinter]);
      }

      setPrintFeedback({
        id: 'bt',
        success: true,
        message: `¡Ticketera Bluetooth "${info.name}" conectada con éxito!`
      });
    } catch (err: any) {
      setPrintFeedback({
        id: 'bt',
        success: false,
        message: err.message || "No se pudo vincular la ticketera Bluetooth"
      });
    } finally {
      setIsPairingBt(false);
    }
  };

  const handlePairSerialBluetooth = async (paperWidth: '58mm' | '80mm' = '58mm') => {
    setIsPairingBt(true);
    setPrintFeedback(null);
    try {
      const info = await bluetoothPrinter.pairSerialDevice(paperWidth);
      setBtConnectedInfo(info);
      setFormName(info.name);
      setFormConnType("bluetooth");
      setFormPaperWidth(paperWidth);
      setPrintFeedback({
        id: 'bt',
        success: true,
        message: `¡Puerto Serial / COM Bluetooth conectado correctamente!`
      });
    } catch (err: any) {
      setPrintFeedback({
        id: 'bt',
        success: false,
        message: err.message || "Error al conectar por puerto serial"
      });
    } finally {
      setIsPairingBt(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPrinter(null);
    setFormName("");
    setFormStation("Cocina & Parrilla");
    setFormIp(`192.168.1.10${printers.length + 1}`);
    setFormPort(9100);
    setFormConnType("tcp");
    setFormPaperWidth("80mm");
    setFormCategories(["Parrillas & Mostros", "Entradas & Chaufa"]);
    setFormAutoPrint(true);
    setFormIsActive(true);
    loadSystemPrinters();
    setShowModal(true);
  };

  const handleOpenEdit = (p: StationPrinter) => {
    setEditingPrinter(p);
    setFormName(p.name);
    setFormStation(p.station);
    setFormIp(p.ipAddress || "192.168.1.100");
    setFormUsbName(p.ipAddress || "POS-58-Series");
    setFormPort(p.port || 9100);
    setFormConnType(p.connectionType || "tcp");
    setFormPaperWidth(p.paperWidth || "80mm");
    setFormCategories(p.categories || []);
    setFormAutoPrint(p.autoPrint !== false);
    setFormIsActive(p.isActive !== false);
    loadSystemPrinters();
    setShowModal(true);
  };

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const isUsb = formConnType === "usb";
    const isBt = formConnType === "bluetooth";
    const finalTarget = isUsb ? formUsbName.trim() : (isBt ? (formName.trim() || 'Bluetooth') : formIp.trim());

    if (editingPrinter) {
      const updated = printers.map(p => p.id === editingPrinter.id ? {
        ...p,
        name: formName.trim(),
        station: formStation,
        ipAddress: finalTarget,
        port: isUsb || isBt ? 0 : (Number(formPort) || 9100),
        connectionType: formConnType,
        paperWidth: formPaperWidth,
        categories: formCategories,
        autoPrint: formAutoPrint,
        isActive: formIsActive,
        updatedAt: new Date().toISOString(),
      } : p);
      updatePrinters(updated);
    } else {
      const newPrinter: StationPrinter = {
        id: generateUUID(),
        name: formName.trim(),
        station: formStation,
        ipAddress: finalTarget,
        port: isUsb || isBt ? 0 : (Number(formPort) || 9100),
        connectionType: formConnType,
        paperWidth: formPaperWidth,
        categories: formCategories,
        status: isBt ? "online" : "offline",
        autoPrint: formAutoPrint,
        isActive: formIsActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatePrinters([...printers, newPrinter]);
    }

    setShowModal(false);
    setEditingPrinter(null);
  };

  const handleDeletePrinter = (id: string) => {
    if (confirm("¿Estás seguro de desvincular esta impresora térmica?")) {
      updatePrinters(printers.filter(p => p.id !== id));
    }
  };

  const handleRunDiagnostic = async (printer: StationPrinter) => {
    setDiagnosticPrinter(printer);
    setDiagnosticLoading(true);
    setDiagnosticResult(null);

    // Marcar temporalmente en estado "connecting" en la UI
    updatePrinters(printers.map(p => p.id === printer.id ? { ...p, status: "connecting" } : p));

    if (printer.connectionType === 'bluetooth') {
      const isConn = bluetoothPrinter.getConnectedDeviceInfo()?.connected;
      const res: DiagnosticResponse = {
        success: Boolean(isConn),
        status: isConn ? 'online' : 'offline',
        ip: printer.name || 'Bluetooth',
        port: 0,
        connectionType: 'bluetooth',
        message: isConn ? 'Ticketera Bluetooth vinculada y lista para imprimir.' : 'Ticketera Bluetooth no conectada. Presiona "Vincular".',
        timestamp: new Date().toISOString(),
        steps: [
          {
            step: '1. Canal Bluetooth BLE / Serial',
            status: isConn ? 'success' : 'warning',
            message: isConn ? 'Conexión GATT / Serial activa' : 'Sin conexión activa actualmente',
          },
          {
            step: '2. Búfer ESC/POS',
            status: 'success',
            message: 'Comandos ESC/POS binarios listos (58mm/80mm)',
          }
        ]
      };
      setDiagnosticResult(res);
      setDiagnosticLoading(false);
      updatePrinters(printers.map(p => p.id === printer.id ? { ...p, status: res.status } : p));
      return;
    }

    const result = await runPrinterDiagnosticApi(printer);
    setDiagnosticResult(result);
    setDiagnosticLoading(false);

    // Actualizar estado real en la lista de impresoras
    const newStatus = result.success ? "online" : "offline";
    updatePrinters(printers.map(p => p.id === printer.id ? { ...p, status: newStatus } : p));
  };

  const handlePrintTest = async (printer: StationPrinter) => {
    setTestPrintingId(printer.id);
    setPrintFeedback(null);

    let res: { success: boolean; message: string };

    if (printer.connectionType === 'bluetooth') {
      try {
        const ok = await bluetoothPrinter.printTestTicket(settings.companyName || "Mi Cafetín", settings.slogan);
        res = {
          success: ok,
          message: ok 
            ? "¡Ticket de prueba impreso correctamente por Bluetooth!" 
            : "No se pudo imprimir por Bluetooth."
        };
      } catch (err: any) {
        res = {
          success: false,
          message: err.message || "Error al enviar a la ticketera Bluetooth"
        };
      }
    } else {
      res = await printTestTicketApi(printer, settings.companyName || "Mi Cafetín");
    }
    
    setTestPrintingId(null);
    setPrintFeedback({
      id: printer.id,
      success: res.success,
      message: res.message,
    });

    if (res.success) {
      updatePrinters(printers.map(p => p.id === printer.id ? { ...p, status: "online" } : p));
    }

    setTimeout(() => {
      setPrintFeedback(null);
    }, 6000);
  };

  const handleVerifyAllPrinters = async () => {
    setIsVerifyingAll(true);
    for (const printer of printers) {
      if (printer.isActive !== false && printer.ipAddress) {
        const res = await runPrinterDiagnosticApi(printer);
        const newStatus = res.success ? "online" : "offline";
        updatePrinters(prev => prev.map(p => p.id === printer.id ? { ...p, status: newStatus } : p));
      }
    }
    setIsVerifyingAll(false);
  };

  const toggleCategory = (cat: string) => {
    setFormCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const onlinePrintersCount = printers.filter(p => p.status === "online" && p.isActive !== false).length;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Hardware · Red TCP, Cable USB & Bluetooth
            </span>
            <span className="text-xs text-stone-400 font-bold">· {settings.companyName}</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Printer className="w-7 h-7 text-amber-500" />
            Centro de Impresoras Térmicas Bienex, USB & Bluetooth
          </h1>
          <p className="text-xs text-stone-500 font-semibold mt-0.5">
            Soporte nativo para conexión por Red TCP/IP, Cable USB directo y Ticketeras Inalámbricas Bluetooth (POS-58 / MTP / PT-210).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleVerifyAllPrinters}
            disabled={isVerifyingAll}
            className="h-11 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", isVerifyingAll && "animate-spin text-amber-600")} />
            <span>{isVerifyingAll ? "Verificando..." : "Comprobar Todas"}</span>
          </button>

          <button 
            onClick={handleOpenCreate}
            className="h-11 px-5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" /> Vincular Impresora
          </button>
        </div>
      </div>

      {/* ── CARD RÁPIDO DE VINCULACIÓN BLUETOOTH ── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-stone-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border border-blue-800/40 relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <Bluetooth className="w-7 h-7 text-blue-300 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-base sm:text-lg tracking-tight">Conexión Inalámbrica Bluetooth</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-400/20 text-blue-200 border border-blue-400/30">
                Portátil & Móvil (BLE / Serial)
              </span>
              {btConnectedInfo?.connected && (
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> {btConnectedInfo.name}
                </span>
              )}
            </div>
            <p className="text-xs text-blue-200/80 font-medium mt-1 max-w-xl">
              Vincula tu ticketera térmica Bluetooth portátil (58mm / 80mm) con 1 clic para imprimir comandas y boletas desde tu laptop, tablet o celular.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => handlePairBluetoothDirectly('58mm')}
            disabled={isPairingBt}
            className="flex-1 lg:flex-none h-11 px-4 bg-blue-500 hover:bg-blue-400 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 transition cursor-pointer disabled:opacity-50"
          >
            <Bluetooth className={`w-4 h-4 ${isPairingBt ? 'animate-spin' : ''}`} />
            <span>{isPairingBt ? 'Buscando...' : '🔍 Vincular Ticketera Bluetooth'}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await bluetoothPrinter.printTestTicket(settings.companyName || "Mi Cafetín", settings.slogan);
                setPrintFeedback({ id: 'bt-quick', success: true, message: "¡Ticket de prueba enviado por Bluetooth!" });
              } catch (e: any) {
                setPrintFeedback({ id: 'bt-quick', success: false, message: e.message || "Error al enviar prueba Bluetooth. Vincula la ticketera primero." });
              }
            }}
            className="flex-1 lg:flex-none h-11 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-300" />
            <span>Probar Impresión</span>
          </button>
        </div>
      </div>

      {/* ── MÉTRICAS DE RED & HARDWARE ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Ticketeras Vinculadas</span>
            <Printer className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{printers.length}</div>
          <span className={cn(
            "text-[10px] font-bold flex items-center gap-1 mt-0.5",
            onlinePrintersCount > 0 ? "text-emerald-600" : "text-stone-500"
          )}>
            <CheckCircle2 className="w-3 h-3" /> {onlinePrintersCount} en línea
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Modos de Conexión</span>
            <Wifi className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">TCP, USB & BT</div>
          <span className="text-[10px] font-bold text-stone-500">Red 9100 / USB / Bluetooth</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Ancho & Corte</span>
            <Receipt className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">80mm / 58mm</div>
          <span className="text-[10px] font-bold text-purple-700">Corte automático integrado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Ruteo por Categoría</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">Automático</div>
          <span className="text-[10px] font-bold text-blue-700">Horno, Cocina, Barra, Postres</span>
        </div>
      </div>

      {/* ── BANNER FEEDBACK DE IMPRESIÓN ── */}
      {printFeedback && (
        <div className={cn(
          "p-4 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2",
          printFeedback.success 
            ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
            : "bg-rose-50 border-rose-200 text-rose-900"
        )}>
          <div className="flex items-center gap-3">
            {printFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs font-bold">{printFeedback.message}</span>
          </div>
          <button 
            onClick={() => setPrintFeedback(null)}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── GRID DE IMPRESORAS ACTIVAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {printers.map((printer) => {
          const isPinging = diagnosticLoading && diagnosticPrinter?.id === printer.id;
          const isPrinting = testPrintingId === printer.id;
          const isActive = printer.isActive !== false;
          const isUsb = printer.connectionType === "usb";
          const isBt = printer.connectionType === "bluetooth";

          let statusBadge = (
            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              Desconectada
            </span>
          );

          if (!isActive) {
            statusBadge = (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                <Power className="w-2.5 h-2.5 text-rose-600" /> Inactiva
              </span>
            );
          } else if (printer.status === "online") {
            statusBadge = (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En Línea
              </span>
            );
          } else if (printer.status === "connecting") {
            statusBadge = (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-600" />
                Verificando
              </span>
            );
          } else if (printer.status === "error") {
            statusBadge = (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                Error
              </span>
            );
          }

          return (
            <div 
              key={printer.id} 
              className={cn(
                "bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden group transition-all",
                isActive ? (isBt ? "border-blue-200 hover:border-blue-400" : "border-stone-200 hover:border-amber-400") : "border-stone-200 bg-stone-50/70 opacity-80"
              )}
            >
              {/* Header de la Impresora */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 border",
                      isBt 
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : (printer.status === "online" && isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                            : "bg-stone-100 border-stone-200 text-stone-500")
                    )}>
                      {isBt ? <Bluetooth className="w-6 h-6 text-blue-600" /> : isUsb ? <Usb className="w-6 h-6" /> : <Printer className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-stone-900 leading-tight">{printer.name}</h3>
                        {statusBadge}
                      </div>
                      <div className="flex items-center gap-2 mt-1 font-mono text-[11px] text-stone-500 font-bold">
                        {isBt ? (
                          <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                            <Bluetooth className="w-3 h-3 text-blue-600" /> {printer.ipAddress || 'Bluetooth Inalámbrico'}
                          </span>
                        ) : isUsb ? (
                          <span className="bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                            <Usb className="w-3 h-3 text-purple-600" /> {printer.ipAddress || 'USB: Spooler'}
                          </span>
                        ) : (
                          <span className="bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            {printer.ipAddress || '192.168.1.100'}:{printer.port || 9100}
                          </span>
                        )}
                        <span className="text-stone-400">· {printer.paperWidth || '80mm'}</span>
                        <span className={cn(
                          "text-[10px] uppercase px-1.5 py-0.5 rounded border font-black",
                          isBt 
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : (isUsb ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-amber-50 text-amber-800 border-amber-200")
                        )}>
                          {isBt ? 'BLUETOOTH' : isUsb ? 'USB DIRECTO' : 'RED TCP'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(printer)}
                      title="Editar Configuración"
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePrinter(printer.id)}
                      title="Desvincular"
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Estación & Categorías Ruteadas */}
                <div className="space-y-3 mt-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-stone-500 uppercase tracking-wider text-[10px]">Estación de Salida:</span>
                    <span className="font-black text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                      {printer.station}
                    </span>
                  </div>

                  <div>
                    <span className="font-black text-stone-500 uppercase tracking-wider text-[10px] block mb-1.5">
                      Categorías de Platos Asignadas:
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
                          Sin categorías asignadas (todas las comandas de su estación).
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con Acciones de Diagnóstico y Test Físico */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <div className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                  <Activity className={cn(
                    "w-3.5 h-3.5",
                    printer.status === "online" ? "text-emerald-500" : "text-stone-400"
                  )} />
                  <span>
                    {printer.status === "online" ? "Estado: Listo" : "Estado: Sin verificar"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunDiagnostic(printer)}
                    disabled={isPinging}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Wifi className={cn("w-3.5 h-3.5", isPinging && "animate-spin text-amber-600")} />
                    <span>{isPinging ? "Comprobando..." : "Diagnóstico Real"}</span>
                  </button>

                  <button
                    onClick={() => handlePrintTest(printer)}
                    disabled={isPrinting}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Receipt className={cn("w-3.5 h-3.5", isPrinting && "animate-pulse")} />
                    <span>{isPrinting ? "Enviando..." : "Imprimir Prueba"}</span>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
                  {formConnType === 'usb' ? <Usb className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    {editingPrinter ? "Editar Ticketera Térmica" : "Vincular Nueva Impresora Térmica"}
                  </h3>
                  <p className="text-xs text-stone-500 font-semibold">Configuración de Red TCP, Cable USB o Bluetooth</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
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
                  placeholder="Ej: Ticketera Caja Principal"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Tipo de Conexión
                  </label>
                  <select
                    value={formConnType}
                    onChange={e => {
                      const newType = e.target.value as any;
                      setFormConnType(newType);
                      if (newType === 'usb' && !formName) {
                        setFormName("Impresora USB Laptop");
                      } else if (newType === 'bluetooth' && !formName) {
                        setFormName("Ticketera Bluetooth POS");
                      }
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                  >
                    <option value="tcp">🌐 Red TCP/IP (Ethernet / WiFi 9100)</option>
                    <option value="usb">🔌 Cable USB Directo a esta Laptop / PC</option>
                    <option value="bluetooth">📲 Bluetooth Inalámbrico (BLE / POS-58 / Portátil)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Estación de Salida
                  </label>
                  <select
                    value={formStation}
                    onChange={e => setFormStation(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                  >
                    {AVAILABLE_STATIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CAMPOS DINÁMICOS SEGÚN TIPO DE CONEXIÓN */}
              {formConnType === 'bluetooth' ? (
                <div className="bg-blue-50/90 p-4 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bluetooth className="w-5 h-5 text-blue-600 animate-pulse" />
                      <span className="font-black text-xs text-blue-950 uppercase tracking-wider">
                        Vincular Ticketera Bluetooth:
                      </span>
                    </div>
                    {btConnectedInfo?.connected && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Vinculada
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    Conecta directamente cualquier ticketera portátil Bluetooth (POS-58, MTP-II, PT-210, Zjiang, etc.) sin necesidad de cables ni red local.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePairBluetoothDirectly(formPaperWidth)}
                      disabled={isPairingBt}
                      className="py-3 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      <Bluetooth className={`w-4 h-4 ${isPairingBt ? 'animate-spin' : ''}`} />
                      <span>{isPairingBt ? 'Buscando...' : '🔍 Buscar Dispositivo Bluetooth'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePairSerialBluetooth(formPaperWidth)}
                      disabled={isPairingBt}
                      className="py-3 px-3.5 bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Radio className="w-4 h-4 text-blue-600" />
                      <span>Conectar por Puerto COM</span>
                    </button>
                  </div>

                  {btConnectedInfo?.connected && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-stone-500 font-medium">Dispositivo Vinculado: </span>
                        <strong className="text-blue-950">{btConnectedInfo.name}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => bluetoothPrinter.printTestTicket(settings.companyName, settings.slogan)}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-700" />
                        <span>Imprimir Ticket Prueba</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : formConnType === 'usb' ? (
                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black text-purple-950 uppercase tracking-wider">
                      Impresora USB Detectada en Windows:
                    </label>
                    <button 
                      type="button" 
                      onClick={loadSystemPrinters}
                      className="text-[10px] font-black text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={cn("w-3 h-3", loadingSystemPrinters && "animate-spin")} />
                      <span>Actualizar Lista</span>
                    </button>
                  </div>

                  {systemPrinters.length > 0 ? (
                    <select
                      value={formUsbName}
                      onChange={e => {
                        setFormUsbName(e.target.value);
                        if (e.target.value.toLowerCase().includes('58')) {
                          setFormPaperWidth('58mm');
                        } else if (e.target.value.toLowerCase().includes('80')) {
                          setFormPaperWidth('80mm');
                        }
                      }}
                      className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-purple-600 text-purple-950 cursor-pointer"
                    >
                      {systemPrinters.map(p => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.driverName || 'Controlador Windows'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      placeholder="Ej: POS-58-Series o Bienex USB"
                      value={formUsbName}
                      onChange={e => setFormUsbName(e.target.value)}
                      className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-purple-600 text-purple-950"
                    />
                  )}
                  <p className="text-[10px] font-semibold text-purple-700">
                    💡 Selecciona el nombre con el que Windows reconoce tu ticketera USB (ej: <strong>POS-58-Series</strong>).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                      Dirección IP (Red Local) *
                    </label>
                    <input 
                      placeholder="192.168.1.101"
                      value={formIp}
                      onChange={e => setFormIp(e.target.value)}
                      required
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                      Puerto TCP
                    </label>
                    <input 
                      type="number"
                      placeholder="9100"
                      value={formPort}
                      onChange={e => setFormPort(parseInt(e.target.value) || 9100)}
                      required
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Ancho de Papel
                  </label>
                  <select
                    value={formPaperWidth}
                    onChange={e => setFormPaperWidth(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
                  >
                    <option value="80mm">80 mm (Ticket Estándar Bienex / 48 cols)</option>
                    <option value="58mm">58 mm (Ticket Angosto / 32 cols)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Estado Operativo
                  </label>
                  <label className="flex items-center gap-2 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formIsActive}
                      onChange={e => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-600"
                    />
                    <span>{formIsActive ? "🟢 Impresora Activa" : "🔴 Deshabilitada"}</span>
                  </label>
                </div>
              </div>

              {/* Ruteo de Categorías */}
              <div>
                <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-2">
                  Ruteo de Categorías de Carta:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-2xl border border-stone-200 max-h-48 overflow-y-auto">
                  {AVAILABLE_CATEGORIES.map(cat => {
                    const isChecked = formCategories.includes(cat);
                    return (
                      <label 
                        key={cat}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition",
                          isChecked ? "bg-amber-100/80 border-amber-400 text-amber-950" : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat)}
                          className="w-4 h-4 rounded accent-amber-600"
                        />
                        <span className="truncate">{cat}</span>
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center gap-2 transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingPrinter ? "Guardar Cambios" : "Guardar Impresora"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL DIAGNÓSTICO EN TIEMPO REAL ── */}
      {diagnosticPrinter && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    {diagnosticPrinter.connectionType === 'usb' ? "Diagnóstico USB en Tiempo Real" : "Diagnóstico TCP en Tiempo Real"}
                  </h3>
                  <p className="text-xs text-stone-500 font-mono font-bold">
                    {diagnosticPrinter.name} ({diagnosticPrinter.connectionType === 'usb' ? `USB: ${diagnosticPrinter.ipAddress}` : `${diagnosticPrinter.ipAddress}:${diagnosticPrinter.port || 9100}`})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDiagnosticPrinter(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist de Diagnóstico */}
            <div className="p-6 space-y-4">
              {diagnosticLoading && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-xs font-bold text-stone-600">
                    {diagnosticPrinter.connectionType === 'usb' 
                      ? `Comprobando comunicación con spooler USB de Windows (${diagnosticPrinter.ipAddress})...` 
                      : `Estableciendo conexión socket TCP con ${diagnosticPrinter.ipAddress}:${diagnosticPrinter.port || 9100}...`}
                  </p>
                </div>
              )}

              {!diagnosticLoading && diagnosticResult && (
                <>
                  <div className="space-y-2.5">
                    {diagnosticResult.steps.map((step, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3 rounded-2xl border text-xs flex items-start gap-3 transition",
                          step.status === "success" && "bg-emerald-50/80 border-emerald-200 text-emerald-950",
                          step.status === "warning" && "bg-amber-50/80 border-amber-200 text-amber-950",
                          step.status === "error" && "bg-rose-50/80 border-rose-200 text-rose-950"
                        )}
                      >
                        {step.status === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        {step.status === "warning" && (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        {step.status === "error" && (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-black">{step.step}</div>
                          <div className="text-[11px] opacity-90 mt-0.5">{step.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estado General */}
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between font-black text-xs",
                    diagnosticResult.success 
                      ? "bg-emerald-100 border-emerald-300 text-emerald-950" 
                      : "bg-rose-100 border-rose-300 text-rose-950"
                  )}>
                    <span>ESTADO FINAL:</span>
                    <span>{diagnosticResult.success ? "🟢 LISTO PARA IMPRIMIR" : "🔴 FUERA DE LÍNEA"}</span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 px-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-3">
              <button
                onClick={() => handleRunDiagnostic(diagnosticPrinter)}
                disabled={diagnosticLoading}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", diagnosticLoading && "animate-spin")} />
                <span>Reintentar</span>
              </button>

              <div className="flex gap-2">
                {diagnosticResult?.success && (
                  <button
                    onClick={() => {
                      const p = diagnosticPrinter;
                      setDiagnosticPrinter(null);
                      handlePrintTest(p);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Imprimir Prueba Física</span>
                  </button>
                )}

                <button
                  onClick={() => setDiagnosticPrinter(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
