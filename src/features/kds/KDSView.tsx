import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChefHat, Clock, CheckCircle2, AlertCircle, Utensils, 
  Coffee, Printer, Settings, Maximize2, Minimize2, 
  Volume2, VolumeX, Flame, Bell, Layers, CheckSquare, 
  Square, Sparkles, Filter, ExternalLink, RefreshCw
} from 'lucide-react';
import { useAppStore } from "../../hooks/StoreContext";
import { ThermalTicket } from "../tickets/ThermalTicket";
import { RestaurantOrder, KitchenScreen, OrderItem } from "../../types";
import { KDSConfigModal } from "./KDSConfigModal";
import { routeAndPrintOrderApi } from "../../lib/printerService";
import { bluetoothPrinter } from "../../lib/bluetoothPrinter";

// Reproductor de Chime de Cocina con Web Audio API (cero dependencias externas)
function playKitchenChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

    // Tono 1 (880 Hz - A5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tono 2 (1318.5 Hz - E6)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.log("Audio not allowed yet without user interaction:", e);
  }
}

export default function KDSView() {
  const { 
    orders, 
    products,
    kitchenScreens, 
    toggleItemPrepared, 
    markOrderServed,
    printers,
    settings
  } = useAppStore();

  const [activeScreenId, setActiveScreenId] = useState<string>(() => {
    return kitchenScreens[0]?.id || 'kds-1';
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    return localStorage.getItem('cafetin_kds_autoprint') !== 'false';
  });
  const [ticketToPrint, setTicketToPrint] = useState<{ order: RestaurantOrder; stationName: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Pantalla KDS seleccionada actualmente
  const activeScreen = useMemo(() => {
    return kitchenScreens.find(s => s.id === activeScreenId) || kitchenScreens[0] || {
      id: 'default',
      name: 'Pantalla Master (Cocina)',
      station: 'Todas',
      categories: [],
      color: 'amber' as const,
      soundEnabled: true,
      alertMinutes: 10,
      dangerMinutes: 20,
      autoRefreshSeconds: 5,
      isActive: true,
    };
  }, [kitchenScreens, activeScreenId]);

  // Detección de nuevas comandas entrantes para alerta sonora
  const prevOrdersCountRef = useRef(0);
  const printedItemIdsRef = useRef<Set<string>>(new Set());

  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'sent' || o.status === 'partially_sent');
  }, [orders]);

  useEffect(() => {
    if (activeOrders.length > prevOrdersCountRef.current && prevOrdersCountRef.current > 0) {
      if (soundEnabled && (activeScreen.soundEnabled ?? true)) {
        playKitchenChime();
      }
    }
    prevOrdersCountRef.current = activeOrders.length;
  }, [activeOrders.length, soundEnabled, activeScreen.soundEnabled]);

  // Filtrar pedidos y platos específicos que corresponden a esta pantalla KDS
  const screenOrders = useMemo(() => {
    return activeOrders.map(order => {
      const isMasterScreen = activeScreen.station === 'Todas' || activeScreen.station === 'Todas (Pantalla Master)';
      
      const filteredItems = order.items.filter(item => {
        if (!item.sentToKitchen) return false;
        if (isMasterScreen) return true;

        // Comprobación por estación asignada al item o categoría
        const itemStation = (item.station || '').toLowerCase();
        const screenStation = activeScreen.station.toLowerCase();
        const matchesStation = itemStation.includes(screenStation) || screenStation.includes(itemStation);

        // Comprobación por categorías configuradas
        if (activeScreen.categories && activeScreen.categories.length > 0) {
          const product = products.find(p => p.id === item.productId || p.name === item.productName);
          const matchesCategory = product ? activeScreen.categories.includes(product.category) : false;
          return matchesStation || matchesCategory;
        }

        return matchesStation;
      });

      return {
        ...order,
        items: filteredItems,
      };
    }).filter(order => order.items.length > 0);
  }, [activeOrders, activeScreen, products]);

  // Auto-Impresión automática en KDS de Cocina al recibir comandas de las meseras
  useEffect(() => {
    if (!autoPrintEnabled) return;

    screenOrders.forEach(order => {
      const unsentOrNewItems = order.items.filter(item => !printedItemIdsRef.current.has(item.id));
      if (unsentOrNewItems.length > 0) {
        unsentOrNewItems.forEach(item => printedItemIdsRef.current.add(item.id));

        // 1. Enviar a servicio de impresión de red / USB / Spooler
        routeAndPrintOrderApi(
          {
            ...order,
            items: unsentOrNewItems,
          },
          printers || [],
          settings,
          { targetStation: activeScreen.station }
        ).catch(err => console.log("KDS Auto-print error:", err));

        // 2. Si este dispositivo de cocina tiene ticketera Bluetooth vinculada, imprimir directo
        if (bluetoothPrinter.getConnectedDeviceInfo()?.connected) {
          bluetoothPrinter.printOrderTicket(
            {
              ...order,
              items: unsentOrNewItems,
            },
            settings,
            {
              ticketType: 'comanda_cocina',
              paperWidth: bluetoothPrinter.getConnectedDeviceInfo()?.paperWidth || '58mm',
            }
          ).catch(err => console.log("KDS Direct BT Auto-print error:", err));
        }
      }
    });
  }, [screenOrders, autoPrintEnabled, printers, settings, activeScreen.station]);

  // Métricas de la pantalla activa
  const totalItemsPending = screenOrders.reduce((acc, o) => acc + o.items.filter(i => !i.prepared).length, 0);
  const totalItemsPrepared = screenOrders.reduce((acc, o) => acc + o.items.filter(i => i.prepared).length, 0);

  // Toggle Full Screen Nativo de Navegador
  const toggleFullScreenNative = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`space-y-5 transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-stone-950 p-4 sm:p-6 overflow-y-auto' : ''}`}>
      
      {/* ── BARRA SUPERIOR: SELECTOR DE PANTALLA, RELOJ Y CONTROLES ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
        
        {/* Título & Reloj en Vivo */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white leading-tight">
                {activeScreen.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                {activeScreen.station}
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5 flex items-center gap-2">
              <span>🕒 {currentTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{screenOrders.length} comandas activas</span>
            </p>
          </div>
        </div>

        {/* Botones de Control y Ajustes */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Botón Auto-Impresión Térmica */}
          <button
            onClick={() => {
              const next = !autoPrintEnabled;
              setAutoPrintEnabled(next);
              localStorage.setItem('cafetin_kds_autoprint', String(next));
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              autoPrintEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
            }`}
            title="Imprimir automáticamente en ticketera física al llegar pedidos de las meseras"
          >
            <Printer className={`w-4 h-4 ${autoPrintEnabled ? 'text-emerald-600' : ''}`} />
            <span>{autoPrintEnabled ? '🖨️ Auto-Impresión ON' : 'Auto-Impresión OFF'}</span>
          </button>
          
          {/* Botón Alerta Sonora */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playKitchenChime();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              soundEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-200 dark:border-stone-700'
            }`}
            title="Alerta sonora al recibir pedidos"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Campana ON' : 'Silenciado'}</span>
          </button>

          {/* Botón Pantalla Completa TV */}
          <button
            onClick={toggleFullScreenNative}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Modo Monitor TV / Tablet"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
            <span>{isFullscreen ? 'Salir TV' : 'Modo Monitor TV'}</span>
          </button>

          {/* Botón Configurar Pantallas KDS */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar Pantallas</span>
          </button>

        </div>

      </div>

      {/* ── SELECTOR DE PESTAÑAS / PANTALLAS KDS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {kitchenScreens.map((screen) => {
          const isSelected = screen.id === activeScreenId;
          
          // Contar pedidos pendientes en esta pantalla
          const count = activeOrders.filter(o => {
            if (screen.station === 'Todas' || screen.station === 'Todas (Pantalla Master)') return true;
            return o.items.some(i => {
              if (!i.sentToKitchen) return false;
              const matchStation = (i.station || '').toLowerCase().includes(screen.station.toLowerCase());
              return matchStation;
            });
          }).length;

          return (
            <button
              key={screen.id}
              onClick={() => setActiveScreenId(screen.id)}
              className={`px-4 py-3 rounded-2xl font-black text-xs transition cursor-pointer shrink-0 flex items-center gap-2.5 border ${
                isSelected
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'
              }`}
            >
              <span>{screen.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isSelected 
                  ? 'bg-stone-950 text-amber-400' 
                  : count > 0 
                    ? 'bg-amber-500 text-stone-950' 
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── GRILLA DE COMANDAS ACTIVAS ── */}
      {screenOrders.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-10 border border-stone-200 dark:border-stone-800 shadow-sm text-center py-20 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
            <ChefHat className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-stone-800 dark:text-stone-200">
            No hay comandas pendientes para {activeScreen.name}
          </h3>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-2">
            Todos los platos de esta estación han sido preparados y despachados. Las nuevas órdenes enviadas desde el POS aparecerán aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {screenOrders.map((order) => {
            const createdAtMs = new Date(order.createdAt || Date.now()).getTime();
            const minutesElapsed = Math.floor((currentTime.getTime() - createdAtMs) / (1000 * 60));
            
            // Estado de alerta por tiempo transcurrido
            const isDanger = minutesElapsed >= (activeScreen.dangerMinutes || 20);
            const isWarning = minutesElapsed >= (activeScreen.alertMinutes || 10) && !isDanger;

            // Revisar si todos los platos de esta pantalla ya están marcados como preparados
            const allScreenItemsPrepared = order.items.every(i => i.prepared);

            const displayOrderNo = order.id ? order.id.replace(/\D/g, '').slice(-6) : '000000';
            const isDelivery = order.type === 'delivery' || order.tableNumber.startsWith('D-');

            return (
              <div
                key={order.id}
                className={`rounded-3xl border-2 shadow-lg flex flex-col justify-between overflow-hidden transition-all bg-white dark:bg-stone-900 ${
                  isDanger
                    ? 'border-red-500 dark:border-red-500 shadow-red-500/10'
                    : isWarning
                      ? 'border-amber-500 dark:border-amber-500 shadow-amber-500/10'
                      : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Header de la Tarjeta */}
                <div>
                  <div className={`p-4 text-white flex items-center justify-between ${
                    isDanger 
                      ? 'bg-red-600' 
                      : isWarning 
                        ? 'bg-amber-600' 
                        : 'bg-stone-900'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-md">
                          {isDelivery ? 'DELIVERY' : `PISO ${order.floor || 1}`}
                        </span>
                        <span className="text-[11px] font-mono opacity-80">
                          #{displayOrderNo}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black mt-1 leading-tight tracking-tight">
                        {order.tableNumber}
                      </h3>
                      {order.dinerName && (
                        <p className="text-xs text-white/80 font-medium truncate max-w-[200px] mt-0.5">
                          {order.dinerName}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm ${
                        isDanger 
                          ? 'bg-white text-red-700 animate-pulse' 
                          : isWarning 
                            ? 'bg-white text-amber-800' 
                            : 'bg-amber-500 text-stone-950'
                      }`}>
                        <Clock className="w-3.5 h-3.5" /> {minutesElapsed} min
                      </span>
                      <p className="text-[10px] text-white/70 font-semibold mt-1.5 truncate max-w-[110px]">
                        Mozo: {order.waiterName || 'Salón'}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Platos Ruteados a esta Pantalla */}
                  <div className="p-4 space-y-3 divide-y divide-stone-100 dark:divide-stone-800/60">
                    {order.items.map((item) => {
                      const isItemPrepared = Boolean(item.prepared);

                      return (
                        <div 
                          key={item.id} 
                          onClick={() => toggleItemPrepared(order.id, item.id)}
                          className={`pt-3 first:pt-0 flex items-start justify-between gap-3 cursor-pointer select-none rounded-xl p-1.5 transition ${
                            isItemPrepared 
                              ? 'opacity-40 bg-stone-50 dark:bg-stone-800/30' 
                              : 'hover:bg-amber-50/50 dark:hover:bg-stone-800/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {/* Checkbox de Plato Preparado */}
                            <div className="pt-0.5">
                              {isItemPrepared ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-stone-300 hover:text-amber-500 transition" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                                  isItemPrepared
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-500 text-stone-950'
                                }`}>
                                  {item.quantity}x
                                </span>
                                <span className={`font-black text-sm text-stone-900 dark:text-white leading-tight uppercase truncate ${
                                  isItemPrepared ? 'line-through text-stone-400' : ''
                                }`}>
                                  {item.productName}
                                </span>
                              </div>

                              {/* Nota especial de preparación */}
                              {item.notes && (
                                <div className="mt-1.5 ml-8 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md inline-block border border-red-200 dark:border-red-900">
                                  ⚠️ {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-[9px] uppercase font-bold text-stone-400 dark:text-stone-500 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 shrink-0">
                            {item.station || activeScreen.station}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer de Acciones */}
                <div className="p-4 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTicketToPrint({ order, stationName: activeScreen.station })}
                      className="flex-1 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Imprimir comanda térmica de esta estación"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                      <span>Ticket Comanda</span>
                    </button>
                    
                    <button
                      onClick={() => markOrderServed(order.id)}
                      className={`flex-2 py-2.5 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                        allScreenItemsPrepared
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 animate-bounce'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{allScreenItemsPrepared ? '¡Todo Listo! Despachar' : 'Marcar Servido'}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL CONFIGURADOR DE PANTALLAS KDS ── */}
      <KDSConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSelectScreenForFullScreen={(sc) => {
          setActiveScreenId(sc.id);
          setIsFullscreen(true);
        }}
      />

      {/* ── MODAL DE IMPRESIÓN TÉRMICA DE COMANDA ── */}
      {ticketToPrint && (
        <ThermalTicket
          order={ticketToPrint.order}
          ticketType="comanda_cocina"
          stationName={ticketToPrint.stationName}
          onClose={() => setTicketToPrint(null)}
        />
      )}

    </div>
  );
}
