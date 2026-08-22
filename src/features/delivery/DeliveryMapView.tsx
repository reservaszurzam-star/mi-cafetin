import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Navigation, MapPin, Bike, ExternalLink, MessageCircle, 
  Clock, DollarSign, Search, ShieldCheck, Compass, Layers, 
  RotateCcw, CheckCircle2, ChevronRight, Share2, Phone,
  LocateFixed, Route, Sparkles, AlertCircle, ArrowUpRight,
  User, Check, Copy, Play, Pause, ListOrdered, ChevronDown,
  ChevronUp, Eye
} from 'lucide-react';
import { RestaurantOrder, DeliveryDriver, DeliveryZone, GeocodeResult, RouteInfo, RouteStep } from "../../types";
import { useAppStore } from "../../hooks/StoreContext";
import { 
  DEFAULT_RESTAURANT_COORDS, 
  getOSRMRoute, 
  searchAddressNominatim, 
  reverseGeocodeNominatim,
  getGoogleMapsNavigationUrl,
  getWazeNavigationUrl,
  buildWhatsAppDispatchMessage
} from "../../lib/routingService";
import { cn } from "../../lib/utils";

interface Props {
  orders: RestaurantOrder[];
  drivers: DeliveryDriver[];
  zones: DeliveryZone[];
  onSelectOrder?: (order: RestaurantOrder) => void;
}

const RESTAURANT_COORDS = DEFAULT_RESTAURANT_COORDS;

export default function DeliveryMapView({ orders, drivers, zones, onSelectOrder }: Props) {
  const { settings, updateOrderRoute, updateDriverGpsLocation } = useAppStore();
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineLayerRef = useRef<L.LayerGroup | null>(null);
  const simIntervalRef = useRef<any>(null);

  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(orders[0] || null);
  const [addressSearch, setAddressSearch] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Datos calculados de la ruta activa trazada en la web
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [calculatedFee, setCalculatedFee] = useState<number>(6.00);

  // Indicaciones paso a paso (HUD Web)
  const [showSteps, setShowSteps] = useState(false);

  // Simulación de recorrido en vivo en la web
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);

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

      // Tile Layer OpenStreetMap con alta resolución
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Zonas de cobertura concéntricas
      L.circle(RESTAURANT_COORDS, {
        radius: 3000,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.07,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(map).bindPopup('<b>Zona 1 (0 - 3 km)</b><br>Tarifa: S/ 5.00 · ~20 min');

      L.circle(RESTAURANT_COORDS, {
        radius: 6000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(map).bindPopup('<b>Zona 2 (3 - 6 km)</b><br>Tarifa: S/ 8.00 · ~30 min');

      const routeGroup = L.layerGroup().addTo(map);
      routePolylineLayerRef.current = routeGroup;

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Invalidate size para asegurar renderizado perfecto
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      // Evento de clic en el mapa para geocodificar y trazar ruta web al instante
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLng = Number(e.latlng.lng.toFixed(6));
        const coords: [number, number] = [clickedLat, clickedLng];

        setDestinationCoords(coords);
        setIsCalculatingRoute(true);

        const foundAddress = await reverseGeocodeNominatim(clickedLat, clickedLng);
        const resolvedAddress = foundAddress || `Ubicación (${clickedLat}, ${clickedLng})`;
        setDestinationAddress(resolvedAddress);
        setAddressSearch(resolvedAddress);

        try {
          const route = await getOSRMRoute(RESTAURANT_COORDS, coords);
          setActiveRoute(route);

          const fee = route.distanceKm <= 3 ? 5.00 : route.distanceKm <= 6 ? 8.00 : 12.00;
          setCalculatedFee(fee);

          if (selectedOrder) {
            updateOrderRoute(selectedOrder.id, route, resolvedAddress, coords);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsCalculatingRoute(false);
        }
      });
    }
  }, [selectedOrder, updateOrderRoute]);

  // Manejar búsqueda de direcciones en vivo con autocompletado
  const handleAddressSearch = useCallback(async (query: string) => {
    setAddressSearch(query);
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAddressNominatim(`${query.trim()}, Lima, Peru`);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Seleccionar resultado de búsqueda
  const handleSelectSearchResult = async (item: GeocodeResult) => {
    setSearchResults([]);
    setAddressSearch(item.displayName);
    const coords: [number, number] = [item.lat, item.lng];
    setDestinationCoords(coords);
    setDestinationAddress(item.displayName);

    setIsCalculatingRoute(true);
    try {
      const route = await getOSRMRoute(RESTAURANT_COORDS, coords);
      setActiveRoute(route);

      const fee = route.distanceKm <= 3 ? 5.00 : route.distanceKm <= 6 ? 8.00 : 12.00;
      setCalculatedFee(fee);

      if (selectedOrder) {
        updateOrderRoute(selectedOrder.id, route, item.displayName, coords);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Cargar ruta y trazarla en el mapa automáticamente al cambiar el pedido
  useEffect(() => {
    if (!selectedOrder) return;

    let targetCoords: [number, number] = [
      selectedOrder.deliveryLat || RESTAURANT_COORDS[0] + 0.008,
      selectedOrder.deliveryLng || RESTAURANT_COORDS[1] + 0.005
    ];

    setDestinationCoords(targetCoords);
    setDestinationAddress(selectedOrder.deliveryAddress || 'Av. Próceres de la Independencia 1420');
    setAddressSearch(selectedOrder.deliveryAddress || '');

    const calculate = async () => {
      setIsCalculatingRoute(true);
      try {
        const route = await getOSRMRoute(RESTAURANT_COORDS, targetCoords);
        setActiveRoute(route);
        const fee = route.distanceKm <= 3 ? 5.00 : route.distanceKm <= 6 ? 8.00 : 12.00;
        setCalculatedFee(fee);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCalculatingRoute(false);
      }
    };

    calculate();
  }, [selectedOrder?.id]);

  // Dibujar y actualizar marcadores y la RUTA TRAZADA EN LA WEB
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routePolylineLayerRef.current) return;

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routePolylineLayerRef.current;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // 1. Marcador Base Central (Restaurante)
    const restaurantIcon = L.divIcon({
      className: 'custom-rest-icon',
      html: `
        <div style="background-color: #0f172a; color: #f59e0b; border: 3.5px solid #f59e0b; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(0,0,0,0.45);">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    L.marker(RESTAURANT_COORDS, { icon: restaurantIcon })
      .addTo(markersLayer)
      .bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #0f172a; font-size: 13px;">${settings.companyName.toUpperCase()}</strong><br>
          <span style="font-size: 11px; color: #64748b;">Base Central de Salida</span>
        </div>
      `);

    // 2. Marcadores de Pedidos Activos
    orders.forEach((ord, index) => {
      const lat = ord.deliveryLat || (RESTAURANT_COORDS[0] + (index % 2 === 0 ? 0.007 : -0.006) * (index + 1));
      const lng = ord.deliveryLng || (RESTAURANT_COORDS[1] + (index % 2 === 0 ? 0.006 : -0.005) * (index + 1));
      const coords: [number, number] = [lat, lng];
      const isSelected = selectedOrder?.id === ord.id;
      const statusColor = ord.status === 'sent' ? '#f59e0b' : ord.status === 'served' ? '#3b82f6' : '#10b981';

      const orderIcon = L.divIcon({
        className: 'custom-order-icon',
        html: `
          <div style="background-color: ${statusColor}; color: #ffffff; border: 2.5px solid #ffffff; border-radius: 12px; padding: 4px 8px; font-weight: 900; font-size: 11px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: transform 0.2s;">
            <span>${ord.tableNumber}</span>
          </div>
        `,
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      });

      const marker = L.marker(coords, { icon: orderIcon }).addTo(markersLayer);
      marker.on('click', () => {
        setSelectedOrder(ord);
        if (onSelectOrder) onSelectOrder(ord);
      });
    });

    // 3. Marcadores de Motorizados
    drivers.forEach((drv, index) => {
      const lat = drv.currentLat || (RESTAURANT_COORDS[0] + 0.004 * (index + 1));
      const lng = drv.currentLng || (RESTAURANT_COORDS[1] + 0.004 * (index + 1));
      const drvCoords: [number, number] = [lat, lng];
      const isOnline = drv.isOnline || drv.status === 'en_ruta';

      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `
          <div style="background-color: ${isOnline ? '#0f172a' : '#475569'}; color: ${isOnline ? '#38bdf8' : '#94a3b8'}; border: 2.5px solid ${isOnline ? '#38bdf8' : '#cbd5e1'}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); position: relative;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            ${isOnline ? '<span style="position: absolute; top: -2px; right: -2px; width: 11px; height: 11px; background-color: #22c55e; border-radius: 50%; border: 2px solid white;"></span>' : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      L.marker(drvCoords, { icon: driverIcon })
        .addTo(markersLayer)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <div style="font-weight: 900; color: #0f172a; font-size: 12px;">${drv.name}</div>
            <div style="font-size: 10px; color: #64748b;">${drv.plateNumber || 'M-4589'} · ${drv.vehicleType}</div>
            ${drv.username ? `<div style="font-size: 10px; color: #3b82f6; font-weight: bold;">Usuario: @${drv.username}</div>` : ''}
          </div>
        `);
    });

    // 4. TRAZADO DE LA RUTA VIAL EN LA WEB (POLILÍNEA GLOW DE ALTA VISIBILIDAD)
    if (activeRoute && activeRoute.geometry.length > 0) {
      // Sombra exterior ancha
      L.polyline(activeRoute.geometry, {
        color: '#d97706',
        weight: 8,
        opacity: 0.35,
      }).addTo(routeLayer);

      // Línea vial principal iluminada
      L.polyline(activeRoute.geometry, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.95,
        dashArray: '8, 6',
      }).addTo(routeLayer);

      // Pin de Destino con corona de pulso
      if (destinationCoords) {
        const destIcon = L.divIcon({
          className: 'custom-dest-pin',
          html: `
            <div style="background-color: #ef4444; color: white; border: 3px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(239,68,68,0.5);">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        L.marker(destinationCoords, { icon: destIcon }).addTo(routeLayer);
      }

      // Auto-centrar la cámara en el mapa para encuadrar la ruta entera
      try {
        const bounds = L.polyline(activeRoute.geometry).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch (err) {
        // bounds error safeguard
      }
    }

  }, [orders, drivers, selectedOrder, activeRoute, destinationCoords, settings.companyName, onSelectOrder]);

  // Simulación animada del motorizado avanzando sobre la ruta trazada
  const toggleSimulation = () => {
    if (isSimulating) {
      clearInterval(simIntervalRef.current);
      setIsSimulating(false);
    } else {
      if (!activeRoute || activeRoute.geometry.length < 2) return;
      setIsSimulating(true);
      let idx = 0;

      simIntervalRef.current = setInterval(() => {
        idx++;
        if (idx >= activeRoute.geometry.length) {
          idx = 0;
        }
        setSimIndex(idx);
        const currentCoord = activeRoute.geometry[idx];
        const activeDriver = drivers.find(d => d.name === selectedOrder?.driverName) || drivers[0];
        if (activeDriver && currentCoord) {
          updateDriverGpsLocation(activeDriver.id, currentCoord[0], currentCoord[1], true);
        }
      }, 800);
    }
  };

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  // Manejar apertura de Google Maps y Waze
  const handleOpenGoogleMaps = () => {
    const dest = destinationCoords || destinationAddress;
    const url = getGoogleMapsNavigationUrl(dest, RESTAURANT_COORDS);
    window.open(url, '_blank');
  };

  const handleOpenWaze = () => {
    const dest = destinationCoords || destinationAddress;
    const url = getWazeNavigationUrl(dest);
    window.open(url, '_blank');
  };

  // Enviar mensaje por WhatsApp con links GPS y Web
  const handleShareWhatsApp = () => {
    const targetDriver = drivers.find(d => d.name === selectedOrder?.driverName) || drivers[0];
    const phone = (targetDriver?.phone || "51987654321").replace(/\D/g, '');
    
    const itemsList = selectedOrder?.items.map(i => `• ${i.quantity}x ${i.productName}`).join('%0A') || '1x Pedido';
    const msg = buildWhatsAppDispatchMessage({
      companyName: settings.companyName,
      orderId: selectedOrder?.id,
      orderNumber: selectedOrder?.tableNumber || 'D-01',
      customerName: selectedOrder?.dinerName || 'Cliente',
      customerPhone: selectedOrder?.customerPhone,
      deliveryAddress: destinationAddress || selectedOrder?.deliveryAddress || 'Lima',
      coords: destinationCoords || undefined,
      totalAmount: selectedOrder?.total || 0,
      currency: settings.currency,
      itemsSummary: itemsList,
      driverName: targetDriver?.name,
      distanceKm: activeRoute?.distanceKm,
      durationMins: activeRoute?.durationMinutes,
    });

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[760px] max-h-[84vh]">
      
      {/* ── MAPA INTERACTIVO CON RUTA YA TRAZADA EN LA WEB ── */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col relative">
        
        {/* Barra superior de Búsqueda y Herramientas */}
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col sm:flex-row gap-2">
          
          <div className="relative flex-1">
            <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/80 px-3.5 py-2.5">
              <Search className="w-4 h-4 text-amber-500 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Buscar dirección para trazar ruta (ej. Av. Gran Chimú 1400)..."
                value={addressSearch}
                onChange={(e) => handleAddressSearch(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-stone-900 outline-none placeholder-stone-400"
              />
              {isSearching && <span className="text-[10px] font-bold text-amber-600 animate-pulse">Buscando...</span>}
            </div>

            {/* Dropdown de Autocompletado */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 animate-in fade-in">
                <div className="p-2 text-[10px] font-black uppercase text-stone-400 tracking-wider bg-stone-50 border-b border-stone-100">
                  Direcciones encontradas en Lima
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-stone-100">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left p-3 hover:bg-amber-50 transition flex items-start gap-2.5 text-xs text-stone-800 font-semibold"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item.displayName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de Control en el Mapa */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={toggleSimulation}
              className={cn(
                "px-3.5 py-2.5 backdrop-blur-md rounded-2xl text-xs font-black shadow-xl border flex items-center gap-1.5 transition",
                isSimulating 
                  ? "bg-amber-500 text-white border-amber-600 animate-pulse" 
                  : "bg-white/95 text-stone-800 hover:bg-stone-50 border-stone-200/80"
              )}
              title="Simular en vivo el movimiento del motorizado sobre la ruta trazada"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isSimulating ? 'Pausar Simulación' : 'Simular Ruta Web'}</span>
            </button>

            <button
              onClick={() => {
                if (mapInstanceRef.current && activeRoute) {
                  const bounds = L.polyline(activeRoute.geometry).getBounds();
                  mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
              }}
              className="px-3.5 py-2.5 bg-white/95 backdrop-blur-md hover:bg-stone-50 text-stone-800 rounded-2xl text-xs font-black shadow-xl border border-stone-200/80 flex items-center gap-1.5 transition"
              title="Re-centrar mapa en la ruta trazada"
            >
              <Compass className="w-4 h-4 text-amber-500" />
              <span>Ver Ruta Completa</span>
            </button>
          </div>
        </div>

        {/* HUD Flotante: Banner de Ruta Web Trazada */}
        <div className="absolute top-20 left-4 z-[400] bg-stone-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl shadow-xl border border-stone-800 flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs">
            <Route className="w-4 h-4 text-stone-900" />
          </div>
          <div>
            <div className="text-[11px] font-black text-amber-400">Ruta Vial Trazada en la Web</div>
            <div className="text-[10px] text-stone-300 font-semibold">
              {activeRoute?.distanceKm ? `${activeRoute.distanceKm} km · ~${activeRoute.durationMinutes} min de viaje` : 'Calculando...'}
            </div>
          </div>
        </div>

        {/* Contenedor del Mapa Leaflet */}
        <div ref={mapContainerRef} className="flex-1 w-full h-full min-h-[450px] z-[1]" />

        {/* Pie de mapa y leyenda */}
        <div className="p-3.5 bg-white border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-stone-700">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs"></span>
              Ruta Carretera
            </span>
            <span className="flex items-center gap-1.5 font-bold text-stone-700">
              <span className="w-3 h-3 rounded-full bg-sky-500 shadow-xs"></span>
              Chofer en Vivo
            </span>
            <span className="flex items-center gap-1.5 font-bold text-stone-700">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs"></span>
              Destino Cliente
            </span>
          </div>

          <div className="text-stone-500 text-[11px] font-semibold flex items-center gap-2">
            <span>Haz clic en cualquier calle del mapa para re-trazar la ruta.</span>
          </div>
        </div>

      </div>

      {/* ── PANEL DERECHO: DETALLES DE LA RUTA Y ACCIONES WEB ── */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar space-y-4">
        
        {/* Tarjeta de Métricas de la Ruta Trazada */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-4 border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-amber-600" />
              Ruta Trazada & Tarifa
            </span>
            {isCalculatingRoute && <span className="text-[10px] text-amber-700 font-bold animate-pulse">Trazando...</span>}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-2 rounded-xl border border-amber-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-stone-400 block">Distancia</span>
              <span className="font-mono font-black text-sm text-stone-900">
                {activeRoute?.distanceKm ? `${activeRoute.distanceKm} km` : '3.4 km'}
              </span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-amber-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-stone-400 block">Tiempo Est.</span>
              <span className="font-mono font-black text-sm text-stone-900">
                {activeRoute?.durationMinutes ? `~${activeRoute.durationMinutes} min` : '~16 min'}
              </span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-amber-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-stone-400 block">Tarifa Sugerida</span>
              <span className="font-mono font-black text-sm text-emerald-700">
                {settings.currency} {calculatedFee.toFixed(2)}
              </span>
            </div>
          </div>

          {activeRoute?.summary && (
            <p className="text-[11px] text-stone-600 font-semibold flex items-center gap-1 bg-white/70 p-2 rounded-lg border border-amber-100">
              <Compass className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="truncate">Vía principal: {activeRoute.summary}</span>
            </p>
          )}

          {/* Botón para ver pasos giro a giro */}
          {activeRoute?.steps && activeRoute.steps.length > 0 && (
            <div>
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="w-full text-left text-[11px] font-bold text-amber-900 hover:text-amber-800 flex items-center justify-between pt-1"
              >
                <span className="flex items-center gap-1">
                  <ListOrdered className="w-3 h-3 text-amber-600" />
                  {showSteps ? 'Ocultar indicaciones' : `Ver ${activeRoute.steps.length} giros de la ruta`}
                </span>
                {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showSteps && (
                <div className="mt-2 space-y-1 max-h-36 overflow-y-auto custom-scrollbar bg-white p-2.5 rounded-xl border border-amber-200/60 text-[11px] text-stone-700">
                  {activeRoute.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 py-0.5 border-b border-stone-50 last:border-0">
                      <span className="font-mono font-black text-amber-600 text-[10px] shrink-0 mt-0.5">{idx + 1}.</span>
                      <span className="leading-tight">{step.instruction} ({step.distanceMeters}m)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalles del Pedido Seleccionado */}
        {selectedOrder ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between border-b border-stone-100 pb-2">
              <div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Pedido en Despacho</span>
                <h3 className="font-black text-base text-stone-900">{selectedOrder.tableNumber}</h3>
                <p className="text-xs font-bold text-stone-700">{selectedOrder.dinerName || 'Cliente General'}</p>
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                selectedOrder.status === 'sent' ? "bg-amber-100 text-amber-800" :
                selectedOrder.status === 'served' ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
              )}>
                {selectedOrder.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-stone-700 font-semibold bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{destinationAddress || selectedOrder.deliveryAddress || 'Dirección de entrega'}</span>
              </div>

              <div className="flex items-center justify-between text-stone-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chofer: <strong>{selectedOrder.driverName || 'Sin asignar'}</strong></span>
                </span>
                {selectedOrder.driverUserId && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                    Usuario Vinculado
                  </span>
                )}
              </div>
            </div>

            {/* Acciones de Navegación GPS y Rastreo Web */}
            <div className="space-y-2 pt-1">
              
              {/* Botón Principal: Rastreo Web en Vivo */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?track=${selectedOrder.id}`;
                  window.open(url, '_blank');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                title="Abrir página web de seguimiento en vivo de esta ruta"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-200" />
                Abrir Rastreo Web en Vivo
              </button>

              <button
                onClick={handleOpenGoogleMaps}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                Navegar con Google Maps GPS
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleOpenWaze}
                  className="py-2 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Ruta Waze
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp GPS
                </button>
              </div>

              {/* Botón Copiar Link */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?track=${selectedOrder.id}`;
                  navigator.clipboard.writeText(url);
                  alert('¡Enlace web de la ruta copiado al portapapeles!');
                }}
                className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 border border-stone-200 transition"
              >
                <Copy className="w-3 h-3 text-stone-500" />
                Copiar Enlace Web para el Cliente
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-stone-400 text-xs font-bold border border-dashed rounded-2xl">
            Selecciona un pedido para visualizar su ruta trazada.
          </div>
        )}

        {/* Lista Rápida de Pedidos */}
        <div className="border-t border-stone-100 pt-3 space-y-1.5">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
            Pedidos para Entrega ({orders.length})
          </span>
          <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
            {orders.map((ord) => (
              <button
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className={cn(
                  "w-full text-left p-2 rounded-xl transition flex items-center justify-between text-xs font-bold",
                  selectedOrder?.id === ord.id
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-800"
                )}
              >
                <span className="truncate">{ord.tableNumber} · {ord.dinerName || 'Cliente'}</span>
                <span className="font-mono text-[11px]">{settings.currency} {ord.total.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
