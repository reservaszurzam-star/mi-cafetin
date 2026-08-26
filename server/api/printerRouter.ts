import { IncomingMessage, ServerResponse } from 'http';
import { printService } from '../printService/printService';
import { validatePrinterConfigSecurity } from '../middleware/security';
import { listWindowsPrinters } from '../printService/windowsRawPrinter';

// Helper para leer body JSON en middlewares de Node/Connect
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) { // Límite 2MB
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON parse error'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

/**
 * Handler de rutas de impresión para Vite / Express
 */
export async function handlePrinterApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  const method = req.method || 'GET';

  if (!url.startsWith('/api/printers') && !url.startsWith('/api/system/printers') && !url.startsWith('/api/orders/route-and-print')) {
    return false;
  }

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return true;
  }

  try {
    // 0. GET /api/system/printers (Descubrimiento automático de impresoras USB en Windows)
    if (url.startsWith('/api/system/printers') && method === 'GET') {
      const printers = await listWindowsPrinters();
      sendJson(res, 200, { success: true, printers });
      return true;
    }

    // 1. POST /api/printers/diagnostic o POST /api/printers/:id/diagnostic
    if (url.includes('/diagnostic') && method === 'POST') {
      const body = await parseJsonBody(req);
      const isUsb = (body.connectionType || '').toLowerCase() === 'usb';
      const ip = body.ipAddress || body.ip;
      const port = Number(body.port) || 9100;

      if (!isUsb) {
        const secCheck = validatePrinterConfigSecurity({ ipAddress: ip, port });
        if (!secCheck.valid) {
          sendJson(res, 400, {
            success: false,
            status: 'error',
            ip,
            port,
            message: secCheck.error,
            steps: [
              { step: '1. Validación de Seguridad', status: 'error', message: secCheck.error }
            ],
            timestamp: new Date().toISOString()
          });
          return true;
        }
      }

      const result = await printService.checkPrinter({
        id: body.id,
        name: body.name || 'Impresora Térmica',
        ipAddress: ip,
        port,
        connectionType: body.connectionType || 'tcp',
        paperWidth: body.paperWidth || '80mm',
        station: body.station || 'General',
      }, body.timeoutMs || 3000);

      sendJson(res, 200, result);
      return true;
    }

    // 2. POST /api/printers/test o POST /api/printers/:id/test
    if (url.includes('/test') && method === 'POST') {
      const body = await parseJsonBody(req);
      const isUsb = (body.connectionType || '').toLowerCase() === 'usb';
      const ip = body.ipAddress || body.ip;
      const port = Number(body.port) || 9100;

      if (!isUsb) {
        const secCheck = validatePrinterConfigSecurity({ ipAddress: ip, port });
        if (!secCheck.valid) {
          sendJson(res, 400, { success: false, message: secCheck.error });
          return true;
        }
      }

      const result = await printService.printTest({
        id: body.id,
        name: body.name || 'Impresora Térmica Bienex',
        ipAddress: ip,
        port,
        connectionType: body.connectionType || 'tcp',
        paperWidth: body.paperWidth || '80mm',
        station: body.station || 'COCINA',
      }, body.companyName || 'Mi Cafetín');

      sendJson(res, 200, result);
      return true;
    }

    // 3. POST /api/orders/route-and-print (Ruteo y Despacho de Comandas)
    if (url.startsWith('/api/orders/route-and-print') && method === 'POST') {
      const body = await parseJsonBody(req);
      const { order, printers, settings, options } = body;

      if (!order || !Array.isArray(order.items)) {
        sendJson(res, 400, { success: false, message: 'Estructura de pedido inválida' });
        return true;
      }

      if (!Array.isArray(printers) || printers.length === 0) {
        sendJson(res, 400, { success: false, message: 'No se enviaron impresoras para ruteo' });
        return true;
      }

      const result = await printService.routeAndPrintOrder(
        order,
        printers,
        settings || {},
        options || {}
      );

      sendJson(res, 200, result);
      return true;
    }

    // 4. POST /api/printers/print-ticket (Impresión directa individual de Boleta / Factura / Comanda)
    if (url.startsWith('/api/printers/print-ticket') && method === 'POST') {
      const body = await parseJsonBody(req);
      const { order, printer, printers, settings, ticketType, details } = body;

      if (!order) {
        sendJson(res, 400, { success: false, message: 'Datos de pedido faltantes' });
        return true;
      }

      const result = await printService.printSingleTicket(
        order,
        printer,
        printers || [],
        settings || {},
        ticketType || 'comanda_cocina',
        details || {}
      );

      sendJson(res, 200, result);
      return true;
    }

    // 5. POST /api/printers/print-raw
    if (url.startsWith('/api/printers/print-raw') && method === 'POST') {
      const body = await parseJsonBody(req);
      const { printer, bufferBase64 } = body;

      if (!printer || !bufferBase64) {
        sendJson(res, 400, { success: false, message: 'Parámetros printer o bufferBase64 faltantes' });
        return true;
      }

      const isUsb = (printer.connectionType || '').toLowerCase() === 'usb';
      if (!isUsb) {
        const secCheck = validatePrinterConfigSecurity({ ipAddress: printer.ipAddress, port: printer.port });
        if (!secCheck.valid) {
          sendJson(res, 400, { success: false, message: secCheck.error });
          return true;
        }
      }

      const buffer = Buffer.from(bufferBase64, 'base64');
      const result = await printService.sendRawBuffer(printer, buffer);
      sendJson(res, 200, result);
      return true;
    }

    sendJson(res, 404, { success: false, message: 'Endpoint no encontrado' });
    return true;
  } catch (err: any) {
    console.error('Error en API de impresoras:', err);
    sendJson(res, 500, { success: false, message: err.message || 'Error interno del servidor de impresión' });
    return true;
  }
}
