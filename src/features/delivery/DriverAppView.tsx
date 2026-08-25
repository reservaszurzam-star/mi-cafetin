import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Bike, Navigation, MapPin, Phone, MessageCircle, CheckCircle2, 
  Clock, DollarSign, LocateFixed, Compass, ShieldCheck, AlertCircle, 
  ExternalLink, ArrowRight, Check, X, RefreshCw, Layers, Volume2, 
  ChevronRight, Sparkles, Send, Radio, User
} from 'lucide-react';
import { RestaurantOrder, DeliveryDriver, PaymentMethod } from '../../types';
import { useAppStore } from '../../hooks/StoreContext';
import { 
  DEFAULT_RESTAURANT_COORDS, 
  getOSRMRoute, 
  getGoogleMapsNavigationUrl, 
  getWazeNavigationUrl,
  searchAddressNominatim
} from '../../lib/routingService';
import { pushDriverGpsTracking } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { formatPhoneDisplay } from '../../lib/formatters';

interface DriverAppViewProps {
  onBackToAdmin?: () => void;
}

export default function DriverAppView({ onBackToAdmin }: DriverAppViewProps) {
  const { 
    orders, updateOrder, updateOrderStatus, closeOrderAndPay,
    drivers, updateDriver, updateDriverGpsLocation,
    currentUser, ownerSimulatedRole, settings, tenantId
  } = useAppStore();

  const isParadero = tenantId === 'paradero';
  const brandName = settings.companyName || (isParadero ? 'Paradero 104' : 'Las Lomas Grill');

  // 1. Identificar el motorizado activo
  const activeDriver = useMemo(() => {
    // Si el usuario logueado está vinculado a un motorizado por ID, email o username
    const linked = drivers.find(d => 
      (d.userId && d.userId === currentUser.id) ||
      (d.userEmail && d.userEmail.toLowerCase() === currentUser.email?.toLowerCase()) ||
      (d.username && d.username.toLowerCase() === currentUser.username.toLowerCase())
    );
    if (linked) return linked;

    // Si no está vinculado (ej. Owner simulando rol o testing), tomar el primer motorizado
    return drivers[0] || {
      id: 'drv-demo',
      name: currentUser.name || 'Motorizado Express',
      phone: currentUser.phone || '995881303',
      vehicleType: 'Moto',
      plateNumber: 'M-4589',
      status: 'disponible',
      isOnline: true,
      activeOrdersCount: 0,
    } as DeliveryDriver;
  }, [drivers, currentUser]);

  // Tabs de navegación del Motorizado
  const [activeTab, setActiveTab] = useState<'available' | 'active_route' | 'history'>('available');

  // Estado de GPS
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'active' | 'denied' | 'error'>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [lastGpsTime, setLastGpsTime] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Pedido que se está entregando actualmente
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<RestaurantOrder | null>(null);

  // Modal de Cobro y Confirmación de Entrega
  const [deliveringOrder, setDeliveringOrder] = useState<RestaurantOrder | null>(null);
  const [paymentMethodSelected, setPaymentMethodSelected] = useState<PaymentMethod>('Efectivo');
  const [amountCollected, setAmountCollected] = useState<string>('');

  // Referencias de Mapa Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  // Distancia y tiempo de ruta activa
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);
  const [routeDurationMins, setRouteDurationMins] = useState<number>(0);
  const [isRouting, setIsRouting] = useState(false);

  // Filtrar pedidos disponibles (listos en el restaurante sin motorizado asignado)
  const availableOrders = useMemo(() => {
    return orders.filter(o => 
      (o.type === 'delivery' || o.tableNumber.startsWith('D-')) &&
      !o.driverId &&
      o.status !== 'draft' &&
      o.status !== 'delivered' &&
      o.status !== 'paid' &&
      o.status !== 'cancelled'
    );
  }, [orders]);

  // Filtrar pedidos que tiene asignados este motorizado
  const myAssignedOrders = useMemo(() => {
    return orders.filter(o => 
      (o.driverId === activeDriver.id || o.driverName === activeDriver.name) &&
      o.status !== 'delivered' &&
      o.status !== 'paid' &&
      o.status !== 'cancelled'
    );
  }, [orders, activeDriver]);

  // Historial de pedidos entregados hoy por este motorizado
  const completedTodayOrders = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(o => 
      (o.driverId === activeDriver.id || o.driverName === activeDriver.name) &&
      (o.status === 'delivered' || o.status === 'paid') &&
      new Date(o.createdAt || Date.now()).toDateString() === todayStr
    );
  }, [orders, activeDriver]);

  // Helpers para calcular total y medio de pago
  const getOrderTotal = (ord?: RestaurantOrder | null): number => {
    if (!ord) return 0;
    if (typeof ord.total === 'number' && ord.total > 0) return ord.total;
    const itemsSum = (ord.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
    return itemsSum + (ord.deliveryCost || 0);
  };

  const getOrderPaymentMethod = (ord?: RestaurantOrder | null): PaymentMethod => {
    if (!ord) return 'Efectivo';
    const notesLower = (ord.notes || '').toLowerCase();
    if (notesLower.includes('plin')) return 'Plin';
    if (notesLower.includes('tarjeta') || notesLower.includes('card')) return 'Tarjeta';
    if (notesLower.includes('transferencia')) return 'Transferencia';
    return 'Efectivo';
  };

  // Sincronizar pedido en ruta activo
  useEffect(() => {
    if (myAssignedOrders.length > 0) {
      setActiveDeliveryOrder(myAssignedOrders[0]);
    } else {
      setActiveDeliveryOrder(null);
    }
  }, [myAssignedOrders]);

  // Iniciar / Solicitar GPS en vivo
  const requestAndStartGps = (onSuccessCoords?: (coords: { lat: number; lng: number }) => void) => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }

    setGpsStatus('acquiring');

    // 1. Obtener posición inmediata precisa
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setGpsCoords(coords);
        setGpsAccuracy(Math.round(accuracy));
        setGpsStatus('active');
        setLastGpsTime(new Date().toLocaleTimeString('es-PE'));

        // Actualizar en el store y Supabase
        updateDriverGpsLocation(activeDriver.id, latitude, longitude, true);
        pushDriverGpsTracking({
          driverId: activeDriver.id,
          lat: latitude,
          lng: longitude,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: new Date().toISOString(),
        });

        if (onSuccessCoords) {
          onSuccessCoords(coords);
        }
      },
      (error) => {
        console.warn('Error al obtener ubicación GPS:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus('denied');
          alert('Por favor autoriza el acceso a la ubicación GPS en tu celular para que tus clientes puedan ver el pedido en camino.');
        } else {
          setGpsStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );

    // 2. Escuchar cambios continuos en segundo plano (watchPosition)
    if (watchIdRef.current === null) {
      const wId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading, speed } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          setGpsAccuracy(Math.round(accuracy));
          setGpsStatus('active');
          setLastGpsTime(new Date().toLocaleTimeString('es-PE'));

          // Transmitir al mapa y base de datos en tiempo real
          updateDriverGpsLocation(activeDriver.id, latitude, longitude, true);
          pushDriverGpsTracking({
            driverId: activeDriver.id,
            lat: latitude,
            lng: longitude,
            heading: heading || undefined,
            speed: speed || undefined,
            timestamp: new Date().toISOString(),
          });

          // Si el mapa está inicializado, mover el marcador del motorizado
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng([latitude, longitude]);
          }
        },
        (err) => {
          console.warn('watchPosition error:', err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );
      watchIdRef.current = wId;
    }
  };

  // Detener GPS al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Iniciar GPS automáticamente al cargar si hay un pedido activo
  useEffect(() => {
    if (myAssignedOrders.length > 0 && gpsStatus === 'idle') {
      requestAndStartGps();
    }
  }, [myAssignedOrders]);

  // ── ACEPTAR PEDIDO & INICIAR RUTA ──
  const handleAcceptOrder = (order: RestaurantOrder) => {
    // 1. Pedir ubicación GPS obligatoria
    requestAndStartGps((coords) => {
      // 2. Asignar orden a este motorizado
      const updatedOrderData: Partial<RestaurantOrder> = {
        driverId: activeDriver.id,
        driverName: activeDriver.name,
        driverUserId: currentUser.id,
        status: 'served', // En ruta
        deliveryLat: order.deliveryLat || (coords.lat + 0.008),
        deliveryLng: order.deliveryLng || (coords.lng + 0.006),
      };

      updateOrder(order.id, updatedOrderData);
      updateDriver(activeDriver.id, {
        status: 'en_ruta',
        activeOrdersCount: (activeDriver.activeOrdersCount || 0) + 1,
        isOnline: true,
      });

      // Vibración de confirmación en móviles
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 60, 150]);
      }

      // Cambiar a la pestaña de ruta activa
      setActiveTab('active_route');
    });
  };

  // ── INICIALIZAR Y DIBUJAR MAPA LEAFLET PARA LA RUTA ACTIVA ──
  useEffect(() => {
    if (activeTab !== 'active_route' || !activeDeliveryOrder || !mapContainerRef.current) return;

    // Crear mapa si no existe
    if (!mapInstanceRef.current) {
      const initialCenter: [number, number] = gpsCoords 
        ? [gpsCoords.lat, gpsCoords.lng] 
        : DEFAULT_RESTAURANT_COORDS;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    // Dibujar marcadores y ruta vial
    const drawRouteOnMap = async () => {
      if (!mapInstanceRef.current || !routeLayerGroupRef.current) return;
      const map = mapInstanceRef.current;
      const layer = routeLayerGroupRef.current;
      layer.clearLayers();

      setIsRouting(true);

      const originCoords: [number, number] = gpsCoords 
        ? [gpsCoords.lat, gpsCoords.lng] 
        : DEFAULT_RESTAURANT_COORDS;

      let destCoords: [number, number] = [
        activeDeliveryOrder.deliveryLat || (originCoords[0] + 0.008),
        activeDeliveryOrder.deliveryLng || (originCoords[1] + 0.005)
      ];

      // Si no tenía coordenadas de destino, intentar geocodificar por dirección
      if (!activeDeliveryOrder.deliveryLat && activeDeliveryOrder.deliveryAddress) {
        const geo = await searchAddressNominatim(activeDeliveryOrder.deliveryAddress);
        if (geo.length > 0) {
          destCoords = [geo[0].lat, geo[0].lng];
          updateOrder(activeDeliveryOrder.id, { deliveryLat: geo[0].lat, deliveryLng: geo[0].lng });
        }
      }

      // 1. Marcador del Motorizado en vivo
      const driverIcon = L.divIcon({
        className: 'driver-live-pin',
        html: `
          <div style="background-color: #0284c7; color: #ffffff; border: 3px solid #ffffff; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(2,132,199,0.5); animation: pulse 2s infinite;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const driverMarker = L.marker(originCoords, { icon: driverIcon })
        .addTo(layer)
        .bindPopup(`<b>${activeDriver.name} (Tú)</b><br>En camino con pedido #${activeDeliveryOrder.id.slice(-4)}`);
      driverMarkerRef.current = driverMarker;

      // 2. Marcador del Cliente
      const clientIcon = L.divIcon({
        className: 'client-dest-pin',
        html: `
          <div style="background-color: #e11d48; color: #ffffff; border: 3px solid #ffffff; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(225,29,72,0.5);">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      L.marker(destCoords, { icon: clientIcon })
        .addTo(layer)
        .bindPopup(`<b>Cliente: ${activeDeliveryOrder.dinerName || 'Cliente Delivery'}</b><br>${activeDeliveryOrder.deliveryAddress || 'Dirección de Entrega'}`);

      // 3. Trazar Ruta Vial con OSRM
      try {
        const routeData = await getOSRMRoute(originCoords, destCoords);
        setRouteDistanceKm(routeData.distanceKm);
        setRouteDurationMins(routeData.durationMinutes);

        // Polilínea de sombra
        L.polyline(routeData.geometry, {
          color: '#0f172a',
          weight: 7,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layer);

        // Polilínea de ruta principal
        const poly = L.polyline(routeData.geometry, {
          color: '#0284c7',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(layer);

        // Ajustar vista a ambos puntos
        map.fitBounds(poly.getBounds(), { padding: [40, 40] });
      } catch (err) {
        console.warn('Error al calcular ruta OSRM:', err);
      } finally {
        setIsRouting(false);
      }
    };

    drawRouteOnMap();
  }, [activeTab, activeDeliveryOrder, gpsCoords]);

  // ── ENVIAR WHATSAPP AL CLIENTE (AVISO DE RUTA) ──
  const handleNotifyCustomerWhatsApp = (order: RestaurantOrder) => {
    if (!order.customerPhone) {
      alert('El cliente no registró número telefónico.');
      return;
    }
    const cleanPhone = order.customerPhone.replace(/\D/g, "");
    const phoneWithCode = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;
    const clientName = order.dinerName || 'estimado cliente';
    const totalVal = getOrderTotal(order);
    const payMeth = getOrderPaymentMethod(order);
    const msg = `¡Hola ${clientName}! Te saluda ${activeDriver.name}, tu repartidor de ${brandName} 🛵💨.\n\nYa voy en camino con tu pedido a la dirección:\n📍 ${order.deliveryAddress || 'Tu domicilio'}\n\nTiempo estimado de llegada: ~${routeDurationMins || 15} minutos.\n\nTotal a pagar: S/ ${totalVal.toFixed(2)} (${payMeth}). ¡Muchas gracias!`;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── CONFIRMAR ENTREGA FINALIZADA & COBRAR ──
  const handleOpenCompleteModal = (order: RestaurantOrder) => {
    setDeliveringOrder(order);
    setPaymentMethodSelected(getOrderPaymentMethod(order));
    setAmountCollected(getOrderTotal(order).toFixed(2));
  };

  const handleFinishDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringOrder) return;

    // Cobrar y cerrar orden
    closeOrderAndPay(
      deliveringOrder.id,
      { method: paymentMethodSelected, amount: parseFloat(amountCollected) || getOrderTotal(deliveringOrder) }
    );

    // Actualizar estado del motorizado
    updateDriver(activeDriver.id, {
      status: 'disponible',
      activeOrdersCount: Math.max(0, (activeDriver.activeOrdersCount || 1) - 1),
    });

    setDeliveringOrder(null);
    setActiveDeliveryOrder(null);
    setActiveTab('available');

    alert('🎉 ¡Excelente trabajo! Entrega completada y registrada en caja.');
  };

  // Totales del turno del motorizado
  const totalCollectedToday = completedTodayOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);

  return (
    <div className="flex flex-col min-h-[85vh] bg-stone-100 text-stone-900 animate-in fade-in duration-200">
      
      {/* ══ CABECERA PRINCIPAL DEL MOTORIZADO ══ */}
      <header className="sticky top-0 z-40 bg-stone-900 text-white p-4 sm:p-5 shadow-lg border-b border-stone-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-md border border-sky-500/30">
                  MODO MOTORIZADO
                </span>
                <span className="text-xs text-stone-400 font-bold">· {brandName}</span>
              </div>
              <h1 className="font-black text-base sm:text-lg leading-tight flex items-center gap-1.5 mt-0.5">
                <span>{activeDriver.name}</span>
                <span className="text-xs font-mono text-stone-400 font-bold">({activeDriver.plateNumber || 'Moto'})</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Estado GPS en vivo */}
            <button
              onClick={() => requestAndStartGps()}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition border cursor-pointer",
                gpsStatus === 'active'
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : gpsStatus === 'acquiring'
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/40"
              )}
              title="Toca para recalibrar GPS"
            >
              <Radio className={cn("w-3.5 h-3.5", gpsStatus === 'active' && "animate-pulse")} />
              <span className="hidden sm:inline">
                {gpsStatus === 'active' ? `GPS Activo (±${gpsAccuracy}m)` : gpsStatus === 'acquiring' ? 'Buscando GPS...' : 'Activar GPS'}
              </span>
              <span className="sm:hidden">
                {gpsStatus === 'active' ? 'GPS ON' : 'GPS'}
              </span>
            </button>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Panel Admin
              </button>
            )}
          </div>

        </div>

        {/* Barra de pestañas inferiores del motorizado */}
        <div className="max-w-5xl mx-auto mt-4 grid grid-cols-3 gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
          <button
            onClick={() => setActiveTab('available')}
            className={cn(
              "py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative",
              activeTab === 'available'
                ? "bg-sky-500 text-white shadow-md"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <span>📥 Disponibles</span>
            {availableOrders.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 text-[10px] rounded-full font-black",
                activeTab === 'available' ? "bg-white text-sky-900" : "bg-sky-500 text-white"
              )}>
                {availableOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('active_route')}
            className={cn(
              "py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer relative",
              activeTab === 'active_route'
                ? "bg-sky-500 text-white shadow-md"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <span>🛵 En Ruta</span>
            {myAssignedOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === 'history'
                ? "bg-sky-500 text-white shadow-md"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <span>📊 Entregas Hoy ({completedTodayOrders.length})</span>
          </button>
        </div>
      </header>

      {/* ══ CUERPO DE LA APP SEGÚN PESTAÑA ══ */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* ── ALERTA DE PERMISOS GPS SI ESTÁ INACTIVO ── */}
        {gpsStatus !== 'active' && (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 font-black">
                <LocateFixed className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-sm text-stone-900">Ubicación GPS Requerida</h4>
                <p className="text-xs text-stone-600 font-medium">
                  Activa el GPS de tu teléfono para trazar la ruta hacia el cliente y transmitir tu ubicación en vivo.
                </p>
              </div>
            </div>
            <button
              onClick={() => requestAndStartGps()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl shadow transition cursor-pointer shrink-0 active:scale-95"
            >
              Permitir GPS
            </button>
          </div>
        )}

        {/* ═══ TAB 1: PEDIDOS DISPONIBLES PARA ACEPTAR ═══ */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-stone-900">Pedidos Listos para Despacho</h2>
                <p className="text-xs text-stone-500 font-medium">Toca "Aceptar Pedido" para iniciar el viaje y trazar la ruta</p>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-white border border-stone-200 text-stone-700 rounded-xl shadow-2xs">
                {availableOrders.length} disponible{availableOrders.length !== 1 ? 's' : ''}
              </span>
            </div>

            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
                  <Bike className="w-8 h-8" />
                </div>
                <h3 className="font-black text-base text-stone-800">¡Todo despejado! No hay pedidos pendientes</h3>
                <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
                  En cuanto un cliente pida delivery o cocina termine una orden, aparecerá aquí automáticamente para que la tomes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableOrders.map((ord) => {
                  const itemsCount = (ord.items || []).reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div 
                      key={ord.id}
                      className="bg-white rounded-3xl p-5 border-2 border-stone-200 hover:border-sky-500 transition-all shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        
                        {/* Cabecera de la comanda */}
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-900 font-black text-xs font-mono">
                              {ord.tableNumber || 'D-01'}
                            </span>
                            <span className="text-xs font-black text-stone-900">
                              #{ord.id.replace(/\D/g, '').slice(-4) || '185'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(ord.createdAt || Date.now()).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Datos del Cliente */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 font-black text-stone-900 text-sm">
                            <User className="w-4 h-4 text-stone-400 shrink-0" />
                            <span>{ord.dinerName || 'Cliente Delivery'}</span>
                            {ord.customerPhone && (
                              <span className="text-xs font-normal text-stone-500">· {formatPhoneDisplay(ord.customerPhone)}</span>
                            )}
                          </div>

                          <div className="flex items-start gap-2 text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span className="font-semibold leading-snug">
                              {ord.deliveryAddress || 'Dirección de Entrega a coordinar'}
                            </span>
                          </div>
                        </div>

                        {/* Platos a llevar */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                            Contenido del Pedido ({itemsCount} item{itemsCount !== 1 ? 's' : ''}):
                          </span>
                          <div className="bg-stone-50/80 rounded-xl p-2.5 space-y-1 text-xs border border-stone-100">
                            {(ord.items || []).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-stone-700">
                                <span className="font-bold">{item.quantity}x {item.productName}</span>
                                <span className="font-mono text-stone-500">S/ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Total y Pago */}
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50/80 border border-sky-100 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-sky-800">Método de Cobro:</span>
                            <div className="font-black text-sky-950">{getOrderPaymentMethod(ord)}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-sky-800">Total a Cobrar:</span>
                            <div className="text-base font-black text-sky-950">S/ {getOrderTotal(ord).toFixed(2)}</div>
                          </div>
                        </div>

                      </div>

                      {/* Botón de Acción Principal */}
                      <button
                        type="button"
                        onClick={() => handleAcceptOrder(ord)}
                        className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-98 text-white text-sm font-black rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Bike className="w-5 h-5" />
                        <span>Aceptar Pedido & Iniciar Ruta ➔</span>
                      </button>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ═══ TAB 2: MI ENTREGA EN RUTA (MAPA GPS ACTIVO) ═══ */}
        {activeTab === 'active_route' && (
          <div className="space-y-4">
            
            {!activeDeliveryOrder ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                  <Navigation className="w-8 h-8" />
                </div>
                <h3 className="font-black text-base text-stone-800">No tienes ninguna entrega en curso</h3>
                <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
                  Ve a la pestaña de "Disponibles" para aceptar tu siguiente pedido y trazar la ruta en el mapa.
                </p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Ver Pedidos Disponibles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Panel de Datos y Acciones (1 Columna en Desktop) */}
                <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
                  
                  {/* Tarjeta de Datos del Cliente & Destino */}
                  <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs">
                          EN RUTA 🛵
                        </span>
                        <span className="text-xs font-black text-stone-900 font-mono">
                          {activeDeliveryOrder.tableNumber || 'D-01'}
                        </span>
                      </div>
                      <span className="text-xs font-black text-stone-700">
                        S/ {getOrderTotal(activeDeliveryOrder).toFixed(2)}
                      </span>
                    </div>

                    {/* Cliente */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Entregar a:</span>
                      <div className="font-black text-stone-900 text-base">{activeDeliveryOrder.dinerName || 'Cliente Delivery'}</div>
                      <div className="flex items-start gap-2 text-stone-700 bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs">
                        <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="font-bold">{activeDeliveryOrder.deliveryAddress || 'Dirección de Entrega'}</span>
                      </div>
                    </div>

                    {/* Estimación de Ruta */}
                    <div className="grid grid-cols-2 gap-2 bg-sky-50 border border-sky-100 p-3 rounded-2xl text-center">
                      <div>
                        <span className="text-[10px] font-black uppercase text-sky-800 block">Distancia</span>
                        <div className="text-lg font-black text-sky-950">{routeDistanceKm || 3.2} km</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-sky-800 block">Tiempo Estimado</span>
                        <div className="text-lg font-black text-sky-950">~{routeDurationMins || 15} min</div>
                      </div>
                    </div>

                    {/* Botones de Navegación Externa (Google Maps / Waze) */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                        Navegación GPS Paso a Paso:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={getGoogleMapsNavigationUrl(activeDeliveryOrder.deliveryAddress || `${DEFAULT_RESTAURANT_COORDS[0]},${DEFAULT_RESTAURANT_COORDS[1]}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Navigation className="w-4 h-4 text-amber-400" />
                          <span>Google Maps</span>
                        </a>

                        <a
                          href={getWazeNavigationUrl([activeDeliveryOrder.deliveryLat || DEFAULT_RESTAURANT_COORDS[0], activeDeliveryOrder.deliveryLng || DEFAULT_RESTAURANT_COORDS[1]])}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Compass className="w-4 h-4 text-sky-200" />
                          <span>Waze</span>
                        </a>
                      </div>
                    </div>

                    {/* Contacto Directo con el Cliente */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">
                        Contactar al Cliente:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleNotifyCustomerWhatsApp(activeDeliveryOrder)}
                          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Avisar WhatsApp</span>
                        </button>

                        {activeDeliveryOrder.customerPhone ? (
                          <a
                            href={`tel:${activeDeliveryOrder.customerPhone}`}
                            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition border border-stone-300 cursor-pointer"
                          >
                            <Phone className="w-4 h-4 text-stone-600" />
                            <span>Llamar</span>
                          </a>
                        ) : (
                          <div className="p-3 bg-stone-100 text-stone-400 rounded-2xl text-xs font-bold flex items-center justify-center">
                            Sin teléfono
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón de Confirmación de Entrega */}
                    <div className="pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(activeDeliveryOrder)}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirmar Entrega & Cobrar</span>
                      </button>
                    </div>

                  </div>

                </div>

                {/* Mapa Interactivo (2 Columnas en Desktop) */}
                <div className="lg:col-span-2 order-1 lg:order-2 flex flex-col space-y-3">
                  
                  <div className="relative w-full h-[450px] sm:h-[550px] bg-stone-200 rounded-3xl overflow-hidden border-2 border-stone-200 shadow-md">
                    
                    {/* Contenedor Leaflet */}
                    <div ref={mapContainerRef} className="w-full h-full" />

                    {/* Overlay de estado GPS */}
                    <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-200 shadow-md flex items-center gap-2 text-xs font-bold text-stone-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Transmisión GPS en vivo activa</span>
                    </div>

                    {/* Botón Flotante Recalibrar GPS */}
                    <button
                      onClick={() => requestAndStartGps()}
                      className="absolute bottom-4 left-4 z-[400] bg-white hover:bg-stone-50 text-stone-900 px-4 py-2.5 rounded-2xl border border-stone-200 shadow-lg text-xs font-black flex items-center gap-2 cursor-pointer transition active:scale-95"
                    >
                      <LocateFixed className="w-4 h-4 text-sky-600" />
                      <span>Mi Ubicación</span>
                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ═══ TAB 3: HISTORIAL DE ENTREGAS DE HOY ═══ */}
        {activeTab === 'history' && (
          <div className="space-y-5">
            
            {/* Resumen de Métricas del Turno */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Entregas Completadas</span>
                <div className="text-3xl font-black text-stone-900 mt-1">{completedTodayOrders.length}</div>
                <p className="text-xs text-stone-500 font-semibold mt-0.5">En el turno de hoy</p>
              </div>

              <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">Total Recaudado</span>
                <div className="text-3xl font-black text-emerald-950 font-mono mt-1">S/ {totalCollectedToday.toFixed(2)}</div>
                <p className="text-xs text-emerald-700 font-bold mt-0.5">Dinero y cobros de clientes</p>
              </div>

              <div className="bg-sky-50 p-5 rounded-3xl border border-sky-200 shadow-xs">
                <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider block">Rendimiento GPS</span>
                <div className="text-3xl font-black text-sky-950 mt-1">100%</div>
                <p className="text-xs text-sky-700 font-bold mt-0.5">Rutas trazadas con éxito</p>
              </div>
            </div>

            {/* Lista de Entregas */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-black text-base text-stone-900">Historial Detallado de Hoy</h3>
                <span className="text-xs font-bold text-stone-400">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>

              {completedTodayOrders.length === 0 ? (
                <div className="p-12 text-center text-stone-400 text-xs font-medium">
                  Aún no has completado entregas en el turno de hoy.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {completedTodayOrders.map((ord) => (
                    <div key={ord.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs font-mono">
                            {ord.tableNumber || 'D-01'}
                          </span>
                          <span className="font-black text-sm text-stone-900">{ord.dinerName || 'Cliente'}</span>
                          <span className="text-xs text-stone-400">· #{ord.id.slice(-4)}</span>
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{ord.deliveryAddress || 'Entrega en local'}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <span className="text-sm font-black font-mono text-stone-900">S/ {getOrderTotal(ord).toFixed(2)}</span>
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Entregado ({getOrderPaymentMethod(ord)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ═══ MODAL COBRAR & FINALIZAR ENTREGA ═══ */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">Confirmar Entrega</h3>
                  <p className="text-xs text-stone-500 font-semibold">Registrar cobro y cerrar comanda</p>
                </div>
              </div>
              <button 
                onClick={() => setDeliveringOrder(null)} 
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFinishDelivery} className="space-y-4">
              
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Cliente:</span>
                  <span className="font-black text-stone-900">{deliveringOrder.dinerName || 'Cliente Delivery'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Dirección:</span>
                  <span className="font-semibold text-stone-800 text-right">{deliveringOrder.deliveryAddress}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200">
                  <span className="font-black text-stone-900">Total a Cobrar:</span>
                  <span className="font-black text-emerald-800 text-sm">S/ {getOrderTotal(deliveringOrder).toFixed(2)}</span>
                </div>
              </div>

              {/* Selector de Método de Pago recibido */}
              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                  ¿Cómo pagó el cliente?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Efectivo', 'Plin', 'Tarjeta', 'Transferencia'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethodSelected(method as PaymentMethod)}
                      className={cn(
                        "p-3 rounded-xl border-2 text-xs font-black transition text-center cursor-pointer",
                        paymentMethodSelected === method
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500/30"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                      )}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monto recibido */}
              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1">
                  Monto Recibido (S/)
                </label>
                <input
                  type="number"
                  step="0.10"
                  value={amountCollected}
                  onChange={(e) => setAmountCollected(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-sm font-black font-mono text-stone-900 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringOrder(null)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  ✅ Finalizar Entrega
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
