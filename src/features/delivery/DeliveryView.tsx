import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { 
  Bike, Navigation, Share2, Radio, Database
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { RestaurantOrder, DeliveryDriver, SupabaseSyncConfig } from "../../types";
import DeliveryMapView from './DeliveryMapView';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  syncOrderToSupabase, 
  syncDriverToSupabase, 
  pushDriverGpsTracking
} from "../../lib/supabase";
import { buildWhatsAppDispatchMessage } from "../../lib/routingService";
import { createWhatsAppUrl } from "../../lib/formatters";

// Subcomponentes modulares
import { DeliveryKanbanTab } from "./DeliveryKanbanTab";
import { DriversTab } from "./DriversTab";
import { DeliveryZonesTab } from "./DeliveryZonesTab";
import { SupabaseSyncTab } from "./SupabaseSyncTab";
import { AssignDriverModal } from "./AssignDriverModal";
import { DriverFormModal } from "./DriverFormModal";
import { ZoneFormModal } from "./ZoneFormModal";

export default function DeliveryView() {
  const { 
    orders, updateOrder, updateOrderStatus,
    drivers, addDriver, updateDriver, deleteDriver,
    deliveryZones, addDeliveryZone, deleteDeliveryZone,
    users, currentUser,
    updateDriverGpsLocation,
    settings 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'kanban' | 'map' | 'drivers' | 'zones' | 'supabase'>('kanban');

  // Modales
  const [assigningOrder, setAssigningOrder] = useState<RestaurantOrder | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);
  const [showZoneModal, setShowZoneModal] = useState(false);

  // Supabase State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseSyncConfig>(getSupabaseConfig());
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // GPS Live Tracking State
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Filtrar pedidos delivery
  const deliveryOrders = useMemo(() => {
    return orders.filter(o => o.type === 'delivery' && o.status !== 'draft');
  }, [orders]);

  // Asignar Motorizado a Pedido
  const handleAssignDriver = (order: RestaurantOrder, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      const updatedOrderData: Partial<RestaurantOrder> = {
        driverId: driver.id,
        driverName: driver.name,
        driverUserId: driver.userId,
        status: 'served',
      };

      updateOrder(order.id, updatedOrderData);
      updateDriver(driver.id, {
        status: 'en_ruta',
        activeOrdersCount: (driver.activeOrdersCount || 0) + 1
      });

      if (supabaseConfig.enabled) {
        syncOrderToSupabase({ ...order, ...updatedOrderData });
      }
    }
    setAssigningOrder(null);
  };

  // Guardar Motorizado
  const handleSaveDriver = (driverData: {
    name: string;
    phone: string;
    plateNumber: string;
    vehicleType: 'Moto' | 'Bicicleta' | 'Auto';
    userId?: string;
  }) => {
    const matchedUser = users.find(u => u.id === driverData.userId);

    if (editingDriver) {
      updateDriver(editingDriver.id, {
        ...driverData,
        username: matchedUser?.username,
        userEmail: matchedUser?.email,
      });
    } else {
      addDriver({
        ...driverData,
        status: 'disponible',
        username: matchedUser?.username,
        userEmail: matchedUser?.email,
        isOnline: false,
      });
    }

    setShowDriverModal(false);
    setEditingDriver(null);
  };

  // Guardar Zona
  const handleSaveZone = (zoneData: { name: string; cost: number; estimatedMinutes: number }) => {
    addDeliveryZone(zoneData);
    setShowZoneModal(false);
  };

  // Toggle GPS Transmisor
  const toggleLiveGpsTracking = () => {
    if (isLiveGpsActive) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsLiveGpsActive(false);

      const activeDriver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
      if (activeDriver) {
        updateDriver(activeDriver.id, { isOnline: false });
      }
    } else {
      if (!('geolocation' in navigator)) {
        alert('La geolocalización no está soportada en este navegador.');
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const loc = {
            lat: Number(latitude.toFixed(6)),
            lng: Number(longitude.toFixed(6)),
            timestamp: new Date().toISOString(),
          };

          const activeDriver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
          if (activeDriver) {
            updateDriverGpsLocation(activeDriver.id, loc.lat, loc.lng, true);
            if (supabaseConfig.enabled) {
              pushDriverGpsTracking({
                driverId: activeDriver.id,
                driverUserId: activeDriver.userId || currentUser.id,
                lat: loc.lat,
                lng: loc.lng,
                timestamp: loc.timestamp,
              });
            }
          }
        },
        (err) => {
          console.warn('Error GPS:', err.message);
          const simLat = -12.0232 + (Math.random() - 0.5) * 0.003;
          const simLng = -76.9918 + (Math.random() - 0.5) * 0.003;
          const activeDriver = drivers.find(d => d.userId === currentUser.id) || drivers[0];
          if (activeDriver) {
            updateDriverGpsLocation(activeDriver.id, simLat, simLng, true);
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      setWatchId(id);
      setIsLiveGpsActive(true);
    }
  };

  // Probar Conexión Supabase
  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anonKey);
      setTestResult(res);
      if (res.success) {
        saveSupabaseConfig({ ...supabaseConfig, enabled: true });
        setSupabaseConfig(prev => ({ ...prev, enabled: true }));
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  // Sincronizar Todo con Supabase
  const handleSyncAllToSupabase = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Sincronizando datos con Supabase...');
    try {
      let syncedOrders = 0;
      let syncedDrivers = 0;

      for (const d of drivers) {
        const ok = await syncDriverToSupabase(d);
        if (ok) syncedDrivers++;
      }

      for (const o of deliveryOrders) {
        const ok = await syncOrderToSupabase(o);
        if (ok) syncedOrders++;
      }

      const now = new Date().toLocaleTimeString();
      saveSupabaseConfig({ lastSync: now });
      setSupabaseConfig(prev => ({ ...prev, lastSync: now }));
      setSyncStatusMsg(`¡Sincronización completada! ${syncedDrivers} repartidores y ${syncedOrders} pedidos actualizados.`);
    } catch (err: any) {
      setSyncStatusMsg(`Error en sincronización: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Enviar Pedido por WhatsApp al Motorizado
  const sendWhatsAppToDriver = (ord: RestaurantOrder) => {
    const driver = drivers.find(d => d.name === ord.driverName) || drivers[0];
    const targetPhone = driver?.phone || ord.customerPhone || "987654321";
    const address = ord.deliveryAddress || "Dirección de entrega";
    const itemsList = ord.items.map(i => `• ${i.quantity}x ${i.productName}`).join('\n');
    
    const msg = buildWhatsAppDispatchMessage({
      companyName: settings.companyName,
      orderNumber: ord.tableNumber,
      customerName: ord.dinerName || 'Cliente',
      customerPhone: ord.customerPhone,
      deliveryAddress: address,
      coords: ord.deliveryLat && ord.deliveryLng ? [ord.deliveryLat, ord.deliveryLng] : undefined,
      totalAmount: ord.total,
      currency: settings.currency,
      itemsSummary: itemsList,
      driverName: driver?.name,
      distanceKm: ord.routeDistanceKm,
      durationMins: ord.routeDurationMins,
    });

    const url = createWhatsAppUrl(targetPhone, msg);
    window.open(url, '_blank');
  };

  // Enviar Carta Digital al Cliente
  const sendDigitalMenuToCustomer = (phone?: string) => {
    const targetPhone = phone || "987654321";
    const msg = `¡Hola! Te compartimos nuestra *Carta Digital Actualizada* de *${settings.companyName}*.\n` +
      `Haz tu pedido directamente por aquí o consulta nuestras promociones:\n\n` +
      `https://carta.restaurant.pe/${settings.companyName.toLowerCase().replace(/\s+/g, '-')}\n\n` +
      `Muchas gracias por tu preferencia.`;

    const url = createWhatsAppUrl(targetPhone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER Y TABS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Bike className="w-7 h-7 text-amber-500" />
            Centro de Control Delivery & Flota
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Ruteo OSRM, Geocodificación OSM, vinculación de usuarios y sincronización Supabase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Transmisor GPS para Repartidor */}
          <button
            onClick={toggleLiveGpsTracking}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm cursor-pointer",
              isLiveGpsActive 
                ? "bg-emerald-500 text-white ring-2 ring-emerald-400/40 animate-pulse" 
                : "bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300"
            )}
            title="Activar o pausar transmisión de posición GPS del chofer actual"
          >
            <Radio className={cn("w-3.5 h-3.5", isLiveGpsActive ? "text-white" : "text-amber-500")} />
            <span>{isLiveGpsActive ? 'GPS Activo (Transmitiendo)' : 'Activar GPS Chofer'}</span>
          </button>

          <button
            onClick={() => sendDigitalMenuToCustomer()}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enviar Carta Digital</span>
          </button>

          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('kanban')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap", activeTab === 'kanban' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900")}
            >
              Tablero Envíos
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap", activeTab === 'map' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900")}
            >
              <Navigation className="w-3.5 h-3.5 text-amber-500" />
              <span>Mapa & Ruteo GPS</span>
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap", activeTab === 'drivers' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900")}
            >
              Motorizados ({drivers.length})
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap", activeTab === 'zones' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900")}
            >
              Zonas & Tarifas
            </button>
            <button
              onClick={() => setActiveTab('supabase')}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap", activeTab === 'supabase' ? "bg-emerald-600 text-white shadow-sm" : "text-stone-600 hover:text-stone-900")}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Nube</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TAB 1: KANBAN DE ENVÍOS ═══ */}
      {activeTab === 'kanban' && (
        <DeliveryKanbanTab
          orders={orders}
          drivers={drivers}
          settings={settings}
          onAssignDriver={(ord) => setAssigningOrder(ord)}
          onMarkDelivered={(id) => updateOrderStatus(id, 'delivered')}
          onSendWhatsAppToDriver={sendWhatsAppToDriver}
        />
      )}

      {/* ═══ TAB 2: MAPA EN VIVO & RUTEO GPS ═══ */}
      {activeTab === 'map' && (
        <DeliveryMapView
          orders={deliveryOrders}
          drivers={drivers}
          zones={deliveryZones}
        />
      )}

      {/* ═══ TAB 3: GESTIÓN DE MOTORIZADOS ═══ */}
      {activeTab === 'drivers' && (
        <DriversTab
          drivers={drivers}
          users={users}
          onOpenCreateDriver={() => {
            setEditingDriver(null);
            setShowDriverModal(true);
          }}
          onOpenEditDriver={(drv) => {
            setEditingDriver(drv);
            setShowDriverModal(true);
          }}
          onDeleteDriver={deleteDriver}
        />
      )}

      {/* ═══ TAB 4: ZONAS Y TARIFAS ═══ */}
      {activeTab === 'zones' && (
        <DeliveryZonesTab
          zones={deliveryZones}
          settings={settings}
          onOpenCreateZone={() => setShowZoneModal(true)}
          onDeleteZone={deleteDeliveryZone}
        />
      )}

      {/* ═══ TAB 5: INTEGRACIÓN CON SUPABASE NUBE ═══ */}
      {activeTab === 'supabase' && (
        <SupabaseSyncTab
          supabaseConfig={supabaseConfig}
          onUpdateConfig={(cfg) => {
            setSupabaseConfig(cfg);
            saveSupabaseConfig(cfg);
          }}
          onTestConnection={handleTestSupabase}
          onSyncAll={handleSyncAllToSupabase}
          isTesting={isTesting}
          isSyncing={isSyncing}
          testResult={testResult}
          syncStatusMsg={syncStatusMsg}
        />
      )}

      {/* ═══ MODAL ASIGNAR REPARTIDOR ═══ */}
      <AssignDriverModal
        order={assigningOrder}
        drivers={drivers}
        onClose={() => setAssigningOrder(null)}
        onAssign={handleAssignDriver}
      />

      {/* ═══ MODAL CREAR / EDITAR MOTORIZADO ═══ */}
      <DriverFormModal
        isOpen={showDriverModal}
        onClose={() => {
          setShowDriverModal(false);
          setEditingDriver(null);
        }}
        onSave={handleSaveDriver}
        editingDriver={editingDriver}
        users={users}
      />

      {/* ═══ MODAL NUEVA ZONA ═══ */}
      <ZoneFormModal
        isOpen={showZoneModal}
        onClose={() => setShowZoneModal(false)}
        onSave={handleSaveZone}
      />

    </div>
  );
}
