import { StationPrinter, RestaurantOrder, Settings } from '../types';

export interface DiagnosticStep {
  step: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  latencyMs?: number;
}

export interface DiagnosticResponse {
  success: boolean;
  status: 'online' | 'offline' | 'error' | 'connecting';
  ip: string;
  port: number;
  connectionType: string;
  latencyMs?: number;
  steps: DiagnosticStep[];
  message: string;
  timestamp: string;
}

export interface PrintTestResponse {
  success: boolean;
  printerId?: string;
  printerName: string;
  ip: string;
  port: number;
  bytesWritten?: number;
  message: string;
  error?: string;
}

export interface SystemPrinterOption {
  name: string;
  driverName?: string;
  portName?: string;
}

export interface StationPrintResult {
  printerId?: string;
  printerName: string;
  station: string;
  ip: string;
  port: number;
  itemCount: number;
  items: string[];
  success: boolean;
  message: string;
  error?: string;
}

export interface RouteAndPrintResponse {
  success: boolean;
  totalPrintersTargeted: number;
  successfulPrints: number;
  failedPrints: number;
  details: StationPrintResult[];
}

/**
 * Obtiene la lista de impresoras instaladas en el sistema operativo local (Windows)
 */
export async function fetchSystemPrintersApi(): Promise<SystemPrinterOption[]> {
  try {
    const res = await fetch('/api/system/printers');
    if (!res.ok) return [];
    const data = await res.json();
    return data.printers || [];
  } catch {
    return [];
  }
}

/**
 * Ejecuta el diagnóstico real TCP y ESC/POS para una impresora
 */
export async function runPrinterDiagnosticApi(printer: Partial<StationPrinter>): Promise<DiagnosticResponse> {
  try {
    const res = await fetch('/api/printers/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: printer.id,
        name: printer.name,
        ipAddress: printer.ipAddress,
        port: printer.port || 9100,
        connectionType: printer.connectionType || 'tcp',
        paperWidth: printer.paperWidth || '80mm',
        station: printer.station,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        status: 'error',
        ip: printer.ipAddress || '',
        port: printer.port || 9100,
        connectionType: printer.connectionType || 'tcp',
        message: errData.message || `Error HTTP ${res.status}`,
        steps: errData.steps || [
          { step: '1. Diagnóstico de Red', status: 'error', message: errData.message || 'Error en servidor de impresión' }
        ],
        timestamp: new Date().toISOString(),
      };
    }

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      status: 'offline',
      ip: printer.ipAddress || '',
      port: printer.port || 9100,
      connectionType: printer.connectionType || 'tcp',
      message: `No se pudo contactar con el backend local: ${err.message}`,
      steps: [
        { step: '1. Comunicación con Backend', status: 'error', message: err.message || 'Fallo de conexión' }
      ],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Envía un ticket de prueba físico ESC/POS a la impresora
 */
export async function printTestTicketApi(printer: StationPrinter, companyName: string = 'Mi Cafetín'): Promise<PrintTestResponse> {
  try {
    const res = await fetch('/api/printers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: printer.id,
        name: printer.name,
        ipAddress: printer.ipAddress,
        port: printer.port || 9100,
        connectionType: printer.connectionType || 'tcp',
        paperWidth: printer.paperWidth || '80mm',
        station: printer.station,
        companyName,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      printerId: printer.id,
      printerName: printer.name,
      ip: printer.ipAddress || '',
      port: printer.port || 9100,
      message: `Error al conectar con el servicio de impresión: ${err.message}`,
      error: 'FETCH_ERROR',
    };
  }
}

/**
 * Imprime un ticket individual (Boleta, Factura, Comanda) directamente a una ticketera física (USB o TCP)
 */
export async function printSingleTicketDirectApi(params: {
  order: RestaurantOrder;
  printer?: StationPrinter;
  printers: StationPrinter[];
  settings?: Partial<Settings>;
  ticketType?: 'comanda_cocina' | 'boleta_cliente' | 'boleta_venta';
  details?: {
    stationName?: string;
    batchNumber?: number;
    paymentMethod?: string;
    amountPaid?: number;
    changeDue?: number;
    customerName?: string;
    customerDocType?: string;
    customerDocNumber?: string;
    invoiceSeries?: string;
    invoiceNumber?: string;
    paperWidth?: '80mm' | '58mm';
  };
}): Promise<PrintTestResponse> {
  try {
    const res = await fetch('/api/printers/print-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      printerName: 'Ticketera',
      ip: '',
      port: 0,
      message: `Error al conectar con la ticketera: ${err.message}`,
      error: 'FETCH_ERROR',
    };
  }
}

/**
 * Rutea automáticamente los platos de un pedido a sus respectivas ticketeras
 */
export async function routeAndPrintOrderApi(
  order: RestaurantOrder,
  printers: StationPrinter[],
  settings?: Partial<Settings>,
  options?: { onlyUnsent?: boolean; targetStation?: string; batchNumber?: number }
): Promise<RouteAndPrintResponse> {
  try {
    const res = await fetch('/api/orders/route-and-print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order,
        printers: printers.map(p => ({
          id: p.id,
          name: p.name,
          station: p.station,
          categories: p.categories,
          ipAddress: p.ipAddress,
          port: p.port || 9100,
          paperWidth: p.paperWidth || '80mm',
          connectionType: p.connectionType || 'tcp',
          isActive: p.isActive !== false,
        })),
        settings: {
          companyName: settings?.companyName,
          slogan: settings?.slogan,
          ruc: settings?.companyRuc,
        },
        options,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      totalPrintersTargeted: 0,
      successfulPrints: 0,
      failedPrints: 1,
      details: [
        {
          printerName: 'Servicio Local',
          station: 'General',
          ip: '',
          port: 9100,
          itemCount: 0,
          items: [],
          success: false,
          message: `Error al enviar comanda al servicio de impresión: ${err.message}`,
          error: 'FETCH_ERROR',
        },
      ],
    };
  }
}
