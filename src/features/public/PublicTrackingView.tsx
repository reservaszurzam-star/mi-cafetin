import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  ArrowLeft, MapPin, Bike, Phone, Clock, CheckCircle2, 
  Navigation, Share2, Copy, Check, MessageCircle, RefreshCw,
  ShoppingBag, ShieldCheck, Compass, AlertCircle
} from 'lucide-react';
import { RestaurantOrder, DeliveryDriver } from "../../types";
import { useAppStore } from "../../hooks/StoreContext";
import { DEFAULT_RESTAURANT_COORDS, getOSRMRoute } from "../../lib/routingService";
import { cn } from "../../lib/utils";

interface PublicTrackingViewProps {
  orderId?: string;
  onBack: () => void;
}

export default function PublicTrackingView({ orderId, onBack }: PublicTrackingViewProps) {
  const { orders, drivers, settings } = useAppStore();

  // Buscar la orden por ID o seleccionar la primera orden de delivery activa
  const currentOrder = orders.find(o => o.id === orderId) || 
    orders.find(o => o.type === 'delivery' && o.status !== 'draft') || 
    orders[0];

  const assignedDriver = drivers.find(d => d.name === currentOrder?.driverName) || 
    drivers.find(d => d.id === currentOrder?.driverId) || 
    drivers[0];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState<number>(currentOrder?.routeDurationMins || 20);
  const [distanceKm, setDistanceKm] = useState<number>(currentOrder?.routeDistanceKm || 3.5);

  const RESTAURANT_COORDS = DEFAULT_RESTAURANT_COORDS;
  const destCoords: [number, number] = [
    currentOrder?.deliveryLat || RESTAURANT_COORDS[0] + 0.008,
    currentOrder?.deliveryLng || RESTAURANT_COORDS[1] + 0.005
  ];
  const driverCoords: [number, number] = [
    assignedDriver?.currentLat || RESTAURANT_COORDS[0] + 0.003,
    assignedDriver?.currentLng || RESTAURANT_COORDS[1] + 0.003
  ];

  // Copiar link público de rastreo web
  const handleCopyTrackingUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?track=${currentOrder?.id || 'demo'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Inicializar Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: RESTAURANT_COORDS,
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      routeLayerRef.current = layerGroup;
      mapInstanceRef.current = map;
    }
  }, []);

  // Dibujar ruta y marcadores en el mapa
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current || !currentOrder) return;

    const map = mapInstanceRef.current;
    const layer = routeLayerRef.current;
    layer.clearLayers();

    // 1. Base del Restaurante
    const restIcon = L.divIcon({
      className: 'custom-rest-pin',
      html: `
        <div style="background-color: #0f172a; color: #f59e0b; border: 3px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.35);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    L.marker(RESTAURANT_COORDS, { icon: restIcon })
      .addTo(layer)
      .bindPopup(`<b>${settings.companyName}</b><br>Local de preparación`);

    // 2. Destino del Cliente
    const destIcon = L.divIcon({
      className: 'custom-dest-pin',
      html: `
        <div style="background-color: #ef4444; color: white; border: 3px solid white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
    L.marker(destCoords, { icon: destIcon })
      .addTo(layer)
      .bindPopup(`<b>Tu Dirección de Entrega</b><br>${currentOrder.deliveryAddress || 'Domicilio'}`);

    // 3. Motorizado en vivo
    const driverIcon = L.divIcon({
      className: 'custom-driver-pin',
      html: `
        <div style="background-color: #0284c7; color: white; border: 3px solid white; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(2,132,199,0.5); position: relative;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
          <span style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background-color: #22c55e; border-radius: 50%; border: 2px solid white;"></span>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
    L.marker(driverCoords, { icon: driverIcon })
      .addTo(layer)
      .bindPopup(`<b>Repartidor: ${assignedDriver?.name || 'Motorizado'}</b><br>Placa: ${assignedDriver?.plateNumber || 'M-4589'}`);

    // 4. Obtener ruta vial real OSRM
    const loadRoute = async () => {
      try {
        const route = await getOSRMRoute(RESTAURANT_COORDS, destCoords);
        setDistanceKm(route.distanceKm);
        setEtaMinutes(route.durationMinutes);

        // Polilínea de sombra
        L.polyline(route.geometry, {
          color: '#d97706',
          weight: 6,
          opacity: 0.35,
        }).addTo(layer);

        // Polilínea de carretera principal
        L.polyline(route.geometry, {
          color: '#f59e0b',
          weight: 4,
          opacity: 0.95,
          dashArray: '8, 6',
        }).addTo(layer);

        // Ajustar vista para encuadrar ambos puntos
        const bounds = L.latLngBounds([RESTAURANT_COORDS, destCoords, driverCoords]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (err) {
        console.error(err);
      }
    };

    loadRoute();

  }, [currentOrder?.id, assignedDriver?.lastGpsUpdate]);

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-stone-200 space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-black text-stone-900">No hay pedido seleccionado</h2>
          <p className="text-xs text-stone-500">No se encontró información de rastreo para este código de pedido.</p>
          <button onClick={onBack} className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // Progreso del pedido
  const isPreparing = currentOrder.status === 'sent' || currentOrder.status === 'partially_sent';
  const isOnWay = currentOrder.status === 'served';
  const isDelivered = currentOrder.status === 'delivered';

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-bold text-xs p-2 rounded-xl hover:bg-stone-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="flex items-center gap-3">
            <img
              src={settings.logoUrl && settings.logoUrl !== "/icono.png" ? settings.logoUrl : "/Logo/logo-lomas-grill.png"}
              alt="Logo"
              className="w-9 h-9 rounded-xl object-contain bg-white border border-stone-200 p-0.5 shadow-xs"
              onError={(e) => { e.currentTarget.src = '/Logo/logo-lomas-grill.png'; }}
            />
            <div>
              <h1 className="font-black text-stone-900 text-sm leading-none">{settings.companyName}</h1>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Rastreo Web en Vivo</span>
            </div>
          </div>

          <button
            onClick={handleCopyTrackingUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition border border-stone-200"
            title="Copiar enlace web para compartir"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-stone-600" />}
            <span className="hidden sm:inline">{copiedLink ? '¡Enlace Copiado!' : 'Compartir'}</span>
          </button>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL: MAPA + ESTADO EN VIVO ── */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA MAPA LEAFLET EN VIVO */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[480px] lg:h-[680px] relative">
          
          {/* Card Flotante de ETA */}
          <div className="absolute top-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-stone-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-md">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Tiempo Estimado de Entrega</span>
                <h3 className="text-xl font-black text-stone-900 leading-tight">
                  {isDelivered ? '¡Pedido Entregado!' : `~${etaMinutes} minutos`}
                </h3>
                <p className="text-xs text-stone-500 font-semibold">Distancia por carretera: {distanceKm} km</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <span className={cn(
                "px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5",
                isDelivered ? "bg-emerald-100 text-emerald-800" :
                isOnWay ? "bg-blue-100 text-blue-800 animate-pulse" : "bg-amber-100 text-amber-800"
              )}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {isDelivered ? 'Entregado' : isOnWay ? 'En Camino' : 'Preparando'}
              </span>
            </div>
          </div>

          {/* Contenedor del Mapa */}
          <div ref={mapContainerRef} className="flex-1 w-full h-full z-[1]" />

          {/* Pie del Mapa */}
          <div className="p-3 bg-white border-t border-stone-100 flex items-center justify-between text-xs text-stone-600 font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GPS en Vivo Actualizado</span>
            </div>
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  const bounds = L.latLngBounds([RESTAURANT_COORDS, destCoords, driverCoords]);
                  mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
                }
              }}
              className="text-amber-600 font-bold hover:underline flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" /> Re-centrar Ruta
            </button>
          </div>

        </div>

        {/* COLUMNA LATERAL: DETALLES, CHOFER Y PROGRESO */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          
          {/* Tarjeta de Progreso */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Orden Delivery</span>
                <h3 className="font-black text-lg text-stone-900">{currentOrder.tableNumber}</h3>
              </div>
              <span className="font-mono font-black text-base text-stone-900 bg-stone-100 px-2.5 py-1 rounded-xl">
                {settings.currency} {currentOrder.total.toFixed(2)}
              </span>
            </div>

            {/* Stepper de Estados */}
            <div className="space-y-3 py-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="font-black text-xs text-stone-900">Pedido Confirmado</h4>
                  <p className="text-[11px] text-stone-500 font-medium">Hemos recibido tu comanda correctamente</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                  isPreparing || isOnWay || isDelivered ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-500"
                )}>
                  {isPreparing || isOnWay || isDelivered ? '✓' : '2'}
                </div>
                <div>
                  <h4 className="font-black text-xs text-stone-900">En Preparación (Cocina)</h4>
                  <p className="text-[11px] text-stone-500 font-medium">Nuestros chefs están preparando tus platos</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                  isOnWay || isDelivered ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-500"
                )}>
                  {isDelivered ? '✓' : isOnWay ? <Bike className="w-4 h-4" /> : '3'}
                </div>
                <div>
                  <h4 className="font-black text-xs text-stone-900">En Camino (Repartidor)</h4>
                  <p className="text-[11px] text-stone-500 font-medium">El motorizado se dirige hacia tu ubicación</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                  isDelivered ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-500"
                )}>
                  {isDelivered ? '✓' : '4'}
                </div>
                <div>
                  <h4 className="font-black text-xs text-stone-900">Entregado</h4>
                  <p className="text-[11px] text-stone-500 font-medium">¡Buen provecho! Gracias por tu compra</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta del Repartidor */}
          {assignedDriver && (
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-3">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Tu Motorizado</span>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-black">
                    <Bike className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-stone-900">{assignedDriver.name}</h4>
                    <p className="text-xs text-stone-500 font-semibold">
                      Placa: <strong>{assignedDriver.plateNumber || 'M-4589'}</strong> ({assignedDriver.vehicleType})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const clean = (assignedDriver.phone || '987000000').replace(/\D/g, '');
                    const phoneWithCode = clean.startsWith('51') ? clean : `51${clean}`;
                    const msg = `¡Hola *${assignedDriver.name}*! 👋 Te escribo por mi pedido delivery *${currentOrder.tableNumber || ''}* 🍗🛵`;
                    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="p-3 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-2xl border border-emerald-200 transition shadow-xs cursor-pointer"
                  title="Contactar al motorizado por WhatsApp"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </button>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs text-stone-600 font-medium flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{currentOrder.deliveryAddress || 'Dirección de entrega'}</span>
              </div>
            </div>
          )}

          {/* Detalle de Platos */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-2">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">Detalle de tu Pedido</span>
            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {currentOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-stone-700 text-xs font-semibold">
                  <span><strong>{item.quantity}x</strong> {item.productName}</span>
                  <span className="font-mono text-stone-900">{settings.currency} {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
