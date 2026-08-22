import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, KeyRound, AlertTriangle, FileText, Search, User, 
  Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Download, 
  Filter, Eye, X, Lock, Shield, Sparkles, Terminal, Laptop
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { useAppStore } from "../../hooks/StoreContext";

type AuditEventType = 'anulacion' | 'caja' | 'precios' | 'descuento' | 'auth' | 'seguridad';
type AuditSeverity = 'critico' | 'advertencia' | 'info';

interface AuditLogEntry {
  id: string;
  type: AuditEventType;
  severity: AuditSeverity;
  title: string;
  desc: string;
  user: string;
  role: string;
  timestamp: string;
  ipAddress: string;
  terminal: string;
  details?: Record<string, any>;
}

export default function AuditLogView() {
  const { settings, users } = useAppStore();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("todos");
  const [detailModalEntry, setDetailModalEntry] = useState<AuditLogEntry | null>(null);

  const mockLogs: AuditLogEntry[] = [
    {
      id: "aud-101",
      type: "anulacion",
      severity: "critico",
      title: "Anulación de Comanda #1042 (Mesa 04)",
      desc: "Se eliminaron 2x Lomo Saltado Criollo tras 15 minutos en comanda. Motivo: Error de digitación de mozo.",
      user: "Allison",
      role: "Administrador",
      timestamp: "Hace 12 min",
      ipAddress: "192.168.1.15",
      terminal: settings.posTerminalId || "POS-01",
      details: {
        orderId: "ord-1042",
        table: "Mesa 04",
        amount: "S/ 64.00",
        reason: "Cambio de plato solicitado por comensal",
        authorizedBy: "Allison (Admin)"
      }
    },
    {
      id: "aud-102",
      type: "caja",
      severity: "advertencia",
      title: "Apertura manual de gaveta de dinero",
      desc: "Se ejecutó comando 'Abrir Cajón' sin cobro de venta asociado en la caja principal.",
      user: "Irina",
      role: "Cajero",
      timestamp: "Hace 45 min",
      ipAddress: "192.168.1.20",
      terminal: "POS-CAJA-01",
      details: {
        drawerAction: "Manual Pulse",
        cashInDrawer: "S/ 1,450.00",
        shift: "Turno Mañana"
      }
    },
    {
      id: "aud-103",
      type: "descuento",
      severity: "advertencia",
      title: "Cortesía / Descuento 100% aplicado",
      desc: "Descuento total aplicado a pedido #1030 (S/ 48.00). Motivo: Cortesía para cliente corporativo frecuente.",
      user: "Valentino (Owner)",
      role: "Owner",
      timestamp: "Hoy, 13:30",
      ipAddress: "192.168.1.10",
      terminal: "PORTAL-DIRECTIVO",
      details: {
        discountAmount: "S/ 48.00",
        discountPercent: "100%",
        customer: "Dra. Lucía Benavides (VIP)"
      }
    },
    {
      id: "aud-104",
      type: "precios",
      severity: "info",
      title: "Actualización de Precio de Carta",
      desc: "Modificación de precio: 'Combo Familiar 1 Pollo' de S/ 70.00 a S/ 72.00.",
      user: "Denisse",
      role: "Administrador",
      timestamp: "Hoy, 10:15",
      ipAddress: "192.168.1.14",
      terminal: "ADMIN-DESKTOP",
      details: {
        productId: "1",
        oldPrice: "S/ 70.00",
        newPrice: "S/ 72.00"
      }
    },
    {
      id: "aud-105",
      type: "auth",
      severity: "info",
      title: "Inicio de Sesión Exitoso",
      desc: "Validación de PIN de seguridad e inicio de turno de cobranza.",
      user: "Karina",
      role: "Cajero",
      timestamp: "Hoy, 08:00",
      ipAddress: "192.168.1.22",
      terminal: "POS-CAJA-02"
    },
    {
      id: "aud-106",
      type: "seguridad",
      severity: "critico",
      title: "Intento de acceso con PIN erróneo (3 intentos)",
      desc: "Bloqueo preventivo temporal de terminal por 3 intentos consecutivos fallidos.",
      user: "Desconocido (Terminal Mozo)",
      role: "Desconocido",
      timestamp: "Ayer, 21:40",
      ipAddress: "192.168.1.33",
      terminal: "TABLET-MOZO-03"
    }
  ];

  const filteredLogs = useMemo(() => {
    return mockLogs.filter(log => {
      const matchSearch = 
        log.title.toLowerCase().includes(search.toLowerCase()) ||
        log.desc.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.includes(search);

      const matchType = selectedType === "todos" || log.type === selectedType;
      const matchSeverity = selectedSeverity === "todos" || log.severity === selectedSeverity;

      return matchSearch && matchType && matchSeverity;
    });
  }, [search, selectedType, selectedSeverity]);

  const handleExportCSV = () => {
    const headers = "ID,Fecha,Tipo,Severidad,Usuario,Rol,IP,Terminal,Evento\n";
    const rows = filteredLogs.map(l => 
      `"${l.id}","${l.timestamp}","${l.type}","${l.severity}","${l.user}","${l.role}","${l.ipAddress}","${l.terminal}","${l.title.replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria_${settings.companyName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
              Seguridad & Trazabilidad
            </span>
            <span className="text-xs text-stone-400 font-bold">· {settings.companyName}</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            Log de Auditoría & Eventos Críticos
          </h1>
          <p className="text-xs text-stone-500 font-semibold mt-0.5">
            Registro inmutable de aperturas de caja, anulaciones de comandas, cortesías y accesos de seguridad.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="h-11 px-5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-stone-900/10 text-xs"
        >
          <Download className="w-4 h-4" /> Exportar Registro CSV
        </button>
      </div>

      {/* ── MÉTRICAS DE SEGURIDAD ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Eventos Totales</span>
            <FileText className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{mockLogs.length}</div>
          <span className="text-[10px] font-bold text-stone-500">Historial auditado</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Eventos Críticos</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {mockLogs.filter(l => l.severity === 'critico').length}
          </div>
          <span className="text-[10px] font-bold text-rose-600">Requieren supervisión</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Anulaciones de Comanda</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {mockLogs.filter(l => l.type === 'anulacion').length}
          </div>
          <span className="text-[10px] font-bold text-amber-700">En las últimas 24 horas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Estado de Protección</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">100% Activo</div>
          <span className="text-[10px] font-bold text-emerald-600">Trazabilidad en tiempo real</span>
        </div>
      </div>

      {/* ── BÚSQUEDA Y FILTROS ── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Buscar por usuario, folio de comanda, descripción o IP..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="anulacion">Anulaciones</option>
            <option value="caja">Aperturas de Caja</option>
            <option value="descuento">Descuentos & Cortesías</option>
            <option value="precios">Cambios de Precios</option>
            <option value="auth">Inicios de Sesión</option>
            <option value="seguridad">Alertas de Seguridad</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="bg-stone-50 border border-stone-200 text-xs font-bold px-3 py-2.5 rounded-xl outline-none cursor-pointer"
          >
            <option value="todos">Toda Severidad</option>
            <option value="critico">Solo Críticos</option>
            <option value="advertencia">Solo Advertencias</option>
            <option value="info">Solo Informativos</option>
          </select>
        </div>
      </div>

      {/* ── TIMELINE DE AUDITORÍA ── */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 px-6 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
          <h3 className="font-black text-sm text-stone-900">
            Registro Cronológico ({filteredLogs.length} eventos)
          </h3>
          <span className="flex items-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" /> Bitácora Inmutable
          </span>
        </div>

        <div className="divide-y divide-stone-100 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-bold text-sm text-stone-600">No se encontraron eventos con los filtros seleccionados.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isCritico = log.severity === 'critico';
              const isAdvertencia = log.severity === 'advertencia';

              return (
                <div 
                  key={log.id} 
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 mt-0.5 border shadow-2xs",
                      isCritico ? "bg-rose-50 border-rose-200 text-rose-600" :
                      isAdvertencia ? "bg-amber-50 border-amber-200 text-amber-600" :
                      "bg-blue-50 border-blue-200 text-blue-600"
                    )}>
                      {isCritico ? <ShieldAlert className="w-5 h-5" /> :
                       isAdvertencia ? <AlertTriangle className="w-5 h-5" /> :
                       <FileText className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-stone-900 leading-tight">
                          {log.title}
                        </h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                          isCritico ? "bg-rose-100 text-rose-800" :
                          isAdvertencia ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        )}>
                          {log.severity}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 font-medium leading-relaxed max-w-3xl">
                        {log.desc}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-500 font-semibold flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md">
                          <User className="w-3 h-3 text-stone-400" /> {log.user} ({log.role})
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px] text-stone-400">
                          <Laptop className="w-3 h-3" /> {log.terminal}
                        </span>
                        <span className="font-mono text-[10px] text-stone-400">
                          IP: {log.ipAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <span className="text-[11px] font-mono font-bold text-stone-400 flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-xl">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </span>

                    <button
                      onClick={() => setDetailModalEntry(log)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalles</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── MODAL DETALLE DE AUDITORÍA ── */}
      {detailModalEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-sm text-stone-900">Metadatos del Evento</h3>
              </div>
              <button 
                onClick={() => setDetailModalEntry(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold text-stone-700">
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Evento:</span>
                <p className="font-black text-stone-900 text-sm">{detailModalEntry.title}</p>
                <p className="text-stone-600 mt-1">{detailModalEntry.desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Usuario</span>
                  <span className="font-black text-stone-900">{detailModalEntry.user}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Rol / Permiso</span>
                  <span className="font-black text-stone-900">{detailModalEntry.role}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Terminal</span>
                  <span className="font-mono text-stone-900 font-bold">{detailModalEntry.terminal}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Dirección IP</span>
                  <span className="font-mono text-stone-900 font-bold">{detailModalEntry.ipAddress}</span>
                </div>
              </div>

              {detailModalEntry.details && (
                <div>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
                    Parámetros Operativos (Payload):
                  </span>
                  <pre className="bg-stone-900 text-amber-400 p-3 rounded-2xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(detailModalEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 px-6 border-t border-stone-100 bg-stone-50 flex justify-end">
              <button
                onClick={() => setDetailModalEntry(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition"
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
