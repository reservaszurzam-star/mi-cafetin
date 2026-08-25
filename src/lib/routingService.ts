import { GeocodeResult, RouteInfo, RouteStep } from '../types';

/**
 * Coordenadas de referencia por defecto (Mangomarca / SJL / Lima Metropolitana)
 */
export const DEFAULT_RESTAURANT_COORDS: [number, number] = [-12.0254, -76.9942];

/**
 * Calcula la distancia en línea recta (fórmula de Haversine) en kilómetros
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Busca direcciones y lugares mediante Nominatim OpenStreetMap API
 */
export async function searchAddressNominatim(
  query: string,
  countryCode: string = 'pe'
): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=${countryCode}&addressdetails=1&limit=5`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
        'User-Agent': 'MiCafetin-DeliveryRouter/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error HTTP ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      road: item.address?.road || item.address?.pedestrian || item.address?.suburb,
      suburb: item.address?.suburb || item.address?.neighbourhood,
      city: item.address?.city || item.address?.town || item.address?.county,
      country: item.address?.country,
    }));
  } catch (err) {
    console.warn('Geocoding Nominatim no disponible, usando búsqueda local', err);
    return [];
  }
}

/**
 * Obtiene la dirección legible a partir de coordenadas (Reverse Geocoding)
 */
export async function reverseGeocodeNominatim(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es-PE,es;q=0.9',
        'User-Agent': 'MiCafetin-DeliveryRouter/1.0',
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    
    // Formatear dirección limpia
    const addr = data.address;
    if (!addr) return data.display_name || null;

    const parts = [
      addr.road || addr.pedestrian,
      addr.house_number ? `#${addr.house_number}` : '',
      addr.suburb || addr.neighbourhood,
      addr.city || addr.town || addr.county,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : data.display_name;
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
    return null;
  }
}

/**
 * Obtiene la ruta vial real mediante OSRM (Open Source Routing Machine) API
 * Devuelve distancia exacta por carretera (km), tiempo estimado (min), y coordenadas para dibujar la polilínea.
 */
export async function getOSRMRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<RouteInfo> {
  const [origLat, origLng] = origin;
  const [destLat, destLng] = destination;

  try {
    // OSRM espera formato: {lon1},{lat1};{lon2},{lat2}
    const url = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM error HTTP ${res.status}`);

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No se encontró ruta vial');
    }

    const route = data.routes[0];
    const distanceMeters = route.distance; // metros
    const durationSeconds = route.duration; // segundos

    const distanceKm = Number((distanceMeters / 1000).toFixed(2));
    // Factor de tráfico urbano en moto/auto + 3 minutos fijos de despacho
    const durationMinutes = Math.max(5, Math.round(durationSeconds / 60) + 3);

    // GeoJSON coordinates en OSRM vienen como [lng, lat], Leaflet necesita [lat, lng]
    const geometry: [number, number][] = (route.geometry?.coordinates || []).map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    const steps: RouteStep[] = (route.legs?.[0]?.steps || []).map((step: any) => ({
      instruction: step.maneuver?.type 
        ? `${step.maneuver.type} ${step.maneuver.modifier || ''} en ${step.name || 'vía principal'}`.trim()
        : step.name || 'Continuar recto',
      distanceMeters: Math.round(step.distance),
      durationSeconds: Math.round(step.duration),
      name: step.name || 'Vía',
    }));

    return {
      distanceKm,
      durationMinutes,
      geometry,
      summary: route.legs?.[0]?.summary || 'Ruta óptima por vías principales',
      steps,
    };
  } catch (err) {
    console.warn('OSRM API fallo o sin conexión. Usando cálculo de respaldo:', err);

    // Fallback matemático inteligente con factor de curvatura vial (1.35x)
    const directKm = calculateHaversineDistance(origLat, origLng, destLat, destLng);
    const roadKm = Number((directKm * 1.35).toFixed(2));
    const estMins = Math.max(8, Math.round(roadKm * 4.5 + 4));

    // Generar línea de ruta interpolada
    const stepsCount = 10;
    const fallbackGeometry: [number, number][] = [];
    for (let i = 0; i <= stepsCount; i++) {
      const ratio = i / stepsCount;
      const lat = origLat + (destLat - origLat) * ratio;
      const lng = origLng + (destLng - origLng) * ratio;
      fallbackGeometry.push([lat, lng]);
    }

    return {
      distanceKm: roadKm,
      durationMinutes: estMins,
      geometry: fallbackGeometry,
      summary: 'Ruta estimada directa',
      steps: [
        {
          instruction: 'Salida desde el local hacia destino del cliente',
          distanceMeters: roadKm * 1000,
          durationSeconds: estMins * 60,
          name: 'Ruta directa',
        },
      ],
    };
  }
}

/**
 * Genera el enlace de navegación para Google Maps
 */
export function getGoogleMapsNavigationUrl(
  destination: [number, number] | string,
  origin?: [number, number] | string
): string {
  let destParam = '';
  if (Array.isArray(destination)) {
    destParam = `${destination[0]},${destination[1]}`;
  } else {
    destParam = encodeURIComponent(destination);
  }

  let originParam = '';
  if (origin) {
    if (Array.isArray(origin)) {
      originParam = `&origin=${origin[0]},${origin[1]}`;
    } else {
      originParam = `&origin=${encodeURIComponent(origin)}`;
    }
  }

  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destParam}&travelmode=driving`;
}

/**
 * Genera el enlace de navegación para Waze
 */
export function getWazeNavigationUrl(
  destination: [number, number] | string
): string {
  if (Array.isArray(destination)) {
    return `https://waze.com/ul?ll=${destination[0]},${destination[1]}&navigate=yes`;
  }
  return `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;
}

/**
 * Genera el mensaje estructurado de WhatsApp para el repartidor con links GPS
 */
export function buildWhatsAppDispatchMessage(data: {
  companyName: string;
  orderId?: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress: string;
  coords?: [number, number];
  totalAmount: number;
  currency: string;
  itemsSummary: string;
  driverName?: string;
  distanceKm?: number;
  durationMins?: number;
}): string {
  const {
    companyName,
    orderId,
    orderNumber,
    customerName,
    customerPhone,
    deliveryAddress,
    coords,
    totalAmount,
    currency,
    itemsSummary,
    distanceKm,
    durationMins,
  } = data;

  const mapsUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(deliveryAddress)}`;

  const wazeUrl = coords
    ? `https://waze.com/ul?ll=${coords[0]},${coords[1]}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(deliveryAddress)}%26navigate=yes`;

  const webTrackUrl = orderId
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}?track=${orderId}`
    : '';

  return (
    `🛵 *DESPACHO DELIVERY - ${companyName.toUpperCase()}* 🔥\n\n` +
    `📋 *Pedido:* ${orderNumber}\n` +
    `👤 *Cliente:* ${customerName}\n` +
    `📞 *Teléfono:* ${customerPhone || 'No registrado'}\n` +
    `📍 *Dirección:* ${deliveryAddress}\n` +
    (distanceKm ? `📏 *Distancia:* ${distanceKm} km (~${durationMins} min)\n` : '') +
    `💵 *Total a Cobrar:* ${currency} ${totalAmount.toFixed(2)}\n\n` +
    `🍗 *Detalle del Pedido:*\n${itemsSummary}\n\n` +
    (webTrackUrl ? `🛰️ *Rastreo Web en Vivo:* ${webTrackUrl}\n\n` : '') +
    `🗺️ *Google Maps:* ${mapsUrl}\n` +
    `🚗 *Waze:* ${wazeUrl}`
  );
}
