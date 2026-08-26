import { PrinterConfig, DiagnosticResult, SendPrintResult } from './connections/PrinterConnection';
import { createPrinterConnection } from './connections';
import { 
  buildTestTicketEscPos, 
  buildKitchenTicketEscPos, 
  buildReceiptTicketEscPos,
  ComandaItem, 
  KitchenTicketPayload,
  ReceiptTicketPayload
} from './escposBuilder';
import { listWindowsPrinters } from './windowsRawPrinter';

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

export interface RouteAndPrintOptions {
  onlyUnsent?: boolean;
  targetStation?: string;
  batchNumber?: number;
}

export class PrintService {
  /**
   * Ejecuta diagnóstico TCP / USB y protocolo ESC/POS en tiempo real
   */
  public async checkPrinter(config: PrinterConfig, timeoutMs: number = 3000): Promise<DiagnosticResult> {
    const conn = createPrinterConnection(config);
    return await conn.checkDiagnostic(timeoutMs);
  }

  /**
   * Envía un ticket de prueba estilizado a la impresora indicada
   */
  public async printTest(config: PrinterConfig, companyName: string = 'Mi Cafetín'): Promise<SendPrintResult> {
    const conn = createPrinterConnection(config);

    const buffer = buildTestTicketEscPos({
      printerName: config.name,
      ipAddress: config.ipAddress || (config.connectionType === 'usb' ? 'USB' : '192.168.1.100'),
      port: config.port || 9100,
      station: config.station || 'GENERAL',
      paperWidth: config.paperWidth || '80mm',
      companyName,
    });

    return await conn.send(buffer, 4000);
  }

  /**
   * Envía un buffer ESC/POS en crudo a la impresora indicada
   */
  public async sendRawBuffer(config: PrinterConfig, buffer: Buffer): Promise<SendPrintResult> {
    const conn = createPrinterConnection(config);
    return await conn.send(buffer);
  }

  /**
   * Imprime un ticket individual (comanda o boleta de cliente) a una ticketera específica o USB
   */
  public async printSingleTicket(
    order: any,
    targetPrinter: PrinterConfig | undefined,
    allPrinters: PrinterConfig[],
    settings: any = {},
    ticketType: 'comanda_cocina' | 'boleta_cliente' | 'boleta_venta' = 'comanda_cocina',
    extraDetails: any = {}
  ): Promise<SendPrintResult> {
    let selectedPrinter = targetPrinter;

    // 1. Si no hay una seleccionada, buscar impresora USB en la lista
    if (!selectedPrinter || !selectedPrinter.name) {
      selectedPrinter = allPrinters.find(p => p.isActive !== false && p.connectionType === 'usb');
    }

    // 2. Si no, buscar la primera activa disponible
    if (!selectedPrinter || !selectedPrinter.name) {
      selectedPrinter = allPrinters.find(p => p.isActive !== false && (p.ipAddress || p.connectionType === 'usb'));
    }

    // 3. Fallback automático: Detectar si Windows tiene instalada la ticketera USB (ej: POS-58-Series)
    if (!selectedPrinter || !selectedPrinter.name) {
      const sysPrinters = await listWindowsPrinters();
      const detected = sysPrinters.find(p => 
        p.name.toLowerCase().includes('pos') || 
        p.name.toLowerCase().includes('58') || 
        p.name.toLowerCase().includes('80') || 
        p.name.toLowerCase().includes('bienex')
      ) || sysPrinters[0];

      if (detected) {
        selectedPrinter = {
          id: 'auto-usb',
          name: detected.name,
          connectionType: 'usb',
          ipAddress: detected.name,
          paperWidth: detected.name.includes('58') ? '58mm' : '80mm',
          station: 'CAJA',
          isActive: true
        };
      }
    }

    if (!selectedPrinter) {
      return {
        success: false,
        printerName: 'Ninguna',
        ip: '',
        port: 0,
        message: 'No se encontró ninguna ticketera USB o de red configurada.',
        error: 'NO_PRINTER'
      };
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    const orderNo = order.dailyOrderNumber || order.orderNumber || (order.id ? order.id.slice(-4) : '0001');
    const paper = selectedPrinter.paperWidth || (extraDetails.paperWidth || '80mm');

    const isParadero = settings?.businessType === 'cafetin' || 
                       (settings?.companyName && settings.companyName.toLowerCase().includes('paradero'));
    const compName = isParadero ? "PARADERO 104" : "LAS LOMAS GRILL";
    const compRuc = "10437453701";
    const compAddress = isParadero 
      ? "Jr. Los Tordos 1009, San Juan de Lurigancho 15427, Perú" 
      : "Jr, Templo del Sol 589 urb, San Juan de Lurigancho 15427, Perú";
    const compPhone = isParadero ? "932208729" : "995881303/953034562";

    let buffer: Buffer;
    if (ticketType === 'comanda_cocina') {
      buffer = buildKitchenTicketEscPos({
        header: {
          companyName: compName,
          ruc: compRuc,
        },
        station: extraDetails.stationName || selectedPrinter.station || 'COCINA',
        orderNumber: orderNo,
        tableNumber: order.tableNumber || '01',
        orderType: order.type || 'salón',
        waiterName: order.waiterName || 'Mesero',
        dinerName: order.dinerName || extraDetails.customerName,
        batchNumber: extraDetails.batchNumber || 1,
        date: formattedDate,
        items: (order.items || []).map((i: any) => ({
          quantity: i.quantity,
          productName: i.productName,
          notes: i.notes,
          station: i.station
        })),
        paperWidth: paper,
      });
    } else {
      buffer = buildReceiptTicketEscPos({
        header: {
          companyName: compName,
          ruc: compRuc,
          address: compAddress,
          phone: compPhone,
        },
        orderNumber: orderNo,
        tableNumber: order.tableNumber || '01',
        orderType: order.type || 'salón',
        waiterName: order.waiterName || 'Caja',
        dinerName: order.dinerName || extraDetails.customerName,
        customerName: extraDetails.customerName,
        customerDocType: extraDetails.customerDocType || 'DNI',
        customerDocNumber: extraDetails.customerDocNumber,
        invoiceSeries: extraDetails.invoiceSeries || 'B001',
        invoiceNumber: extraDetails.invoiceNumber || orderNo,
        paymentMethod: extraDetails.paymentMethod || 'Efectivo',
        amountPaid: extraDetails.amountPaid,
        changeDue: extraDetails.changeDue,
        date: formattedDate,
        items: (order.items || []).map((i: any) => ({
          quantity: i.quantity,
          productName: i.productName,
          price: i.price || 0,
          notes: i.notes,
        })),
        total: order.total || 0,
        paperWidth: paper,
      });
    }

    const conn = createPrinterConnection(selectedPrinter);
    return await conn.send(buffer, 4000);
  }

  /**
   * Rutea automáticamente los platos de un pedido a las ticketeras correspondientes
   */
  public async routeAndPrintOrder(
    order: {
      id: string;
      tableNumber: string;
      type?: 'salón' | 'delivery' | 'para_llevar' | 'venta_libre';
      waiterName?: string;
      dinerName?: string;
      createdAt?: string;
      items: {
        id?: string;
        productName: string;
        quantity: number;
        notes?: string;
        station?: string;
        category?: string;
        sentToKitchen?: boolean;
        batchNumber?: number;
      }[];
    },
    printers: PrinterConfig[],
    settings: {
      companyName?: string;
      slogan?: string;
      ruc?: string;
    } = {},
    options: RouteAndPrintOptions = {}
  ): Promise<RouteAndPrintResponse> {
    // 1. Obtener impresoras activas (TCP con IP o USB)
    let activePrinters = printers.filter(p => p.isActive !== false && (p.ipAddress || p.connectionType === 'usb'));
    
    // Auto-fallback: si no hay ninguna activa en la lista, detectar ticketera USB de Windows
    if (activePrinters.length === 0) {
      const sysPrinters = await listWindowsPrinters();
      const detected = sysPrinters.find(p => 
        p.name.toLowerCase().includes('pos') || 
        p.name.toLowerCase().includes('58') || 
        p.name.toLowerCase().includes('80') || 
        p.name.toLowerCase().includes('bienex')
      ) || sysPrinters[0];

      if (detected) {
        activePrinters = [{
          id: 'auto-usb',
          name: detected.name,
          connectionType: 'usb',
          ipAddress: detected.name,
          paperWidth: detected.name.includes('58') ? '58mm' : '80mm',
          station: 'Cocina & General',
          isActive: true
        }];
      }
    }

    if (activePrinters.length === 0) {
      return {
        success: false,
        totalPrintersTargeted: 0,
        successfulPrints: 0,
        failedPrints: 0,
        details: [
          {
            printerName: 'Ninguna',
            station: 'General',
            ip: '',
            port: 0,
            itemCount: 0,
            items: [],
            success: false,
            message: 'No hay ticketeras configuradas ni detectadas en tu laptop / red.',
          },
        ],
      };
    }

    // Filtrar items según opción onlyUnsent si aplica y no deja vacía la orden
    let candidateItems = options.onlyUnsent
      ? order.items.filter(i => !i.sentToKitchen)
      : order.items;

    if (candidateItems.length === 0 && order.items.length > 0) {
      candidateItems = order.items;
    }

    if (candidateItems.length === 0) {
      return {
        success: true,
        totalPrintersTargeted: 0,
        successfulPrints: 0,
        failedPrints: 0,
        details: [],
      };
    }

    // Agrupar items por impresora
    const printerBuckets = new Map<PrinterConfig, ComandaItem[]>();
    activePrinters.forEach(p => printerBuckets.set(p, []));

    const assignedItemIds = new Set<string>();

    // 1. Asignación por categorías explícitas de la impresora
    candidateItems.forEach((item, index) => {
      const itemKey = item.id || `${item.productName}_${index}`;
      const itemCategory = item.category || '';
      
      let matched = false;
      for (const printer of activePrinters) {
        const cats = printer.categories || [];
        if (cats.length > 0 && itemCategory && cats.some(c => c.toLowerCase() === itemCategory.toLowerCase())) {
          printerBuckets.get(printer)!.push({
            quantity: item.quantity,
            productName: item.productName,
            notes: item.notes,
            station: item.station || printer.station,
          });
          matched = true;
          assignedItemIds.add(itemKey);
          break;
        }
      }

      // 2. Si no coincidió por categoría, asignar por nombre de estación
      if (!matched && item.station) {
        for (const printer of activePrinters) {
          if (printer.station && printer.station.toLowerCase().includes(item.station.toLowerCase())) {
            printerBuckets.get(printer)!.push({
              quantity: item.quantity,
              productName: item.productName,
              notes: item.notes,
              station: item.station,
            });
            matched = true;
            assignedItemIds.add(itemKey);
            break;
          }
        }
      }

      // 3. Fallback: Si no tiene estación o categoría coincidente, va a la primera impresora
      if (!matched) {
        const defaultPrinter = activePrinters.find(p => (p.station || '').toLowerCase().includes('cocina')) || activePrinters[0];
        if (defaultPrinter) {
          printerBuckets.get(defaultPrinter)!.push({
            quantity: item.quantity,
            productName: item.productName,
            notes: item.notes,
            station: item.station || 'Cocina',
          });
          assignedItemIds.add(itemKey);
        }
      }
    });

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-PE')} ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    const orderNo = order.id ? order.id.replace(/\D/g, '').slice(-6) || '000001' : '000001';
    const batch = options.batchNumber || 1;

    // Disparar envíos en paralelo para cada impresora con items asignados
    const printPromises: Promise<StationPrintResult>[] = [];

    for (const [printer, items] of printerBuckets.entries()) {
      if (items.length === 0) continue;

      const promise = (async (): Promise<StationPrintResult> => {
        const payload: KitchenTicketPayload = {
          header: {
            companyName: settings.companyName || 'Mi Cafetín',
            slogan: settings.slogan,
            ruc: settings.ruc,
          },
          station: printer.station || 'COCINA',
          printerName: printer.name,
          orderNumber: orderNo,
          tableNumber: order.tableNumber,
          orderType: order.type || 'salón',
          waiterName: order.waiterName,
          dinerName: order.dinerName,
          batchNumber: batch,
          date: formattedDate,
          items,
          paperWidth: printer.paperWidth || '80mm',
        };

        const buffer = buildKitchenTicketEscPos(payload);
        const conn = createPrinterConnection(printer);
        const res = await conn.send(buffer, 4000);

        return {
          printerId: printer.id,
          printerName: printer.name,
          station: printer.station || 'General',
          ip: printer.ipAddress || (printer.connectionType === 'usb' ? 'USB' : ''),
          port: printer.port || 0,
          itemCount: items.length,
          items: items.map(i => `${i.quantity}x ${i.productName}`),
          success: res.success,
          message: res.message,
          error: res.error,
        };
      })();

      printPromises.push(promise);
    }

    const details = await Promise.all(printPromises);
    const successfulPrints = details.filter(d => d.success).length;
    const failedPrints = details.filter(d => !d.success).length;

    return {
      success: successfulPrints > 0,
      totalPrintersTargeted: details.length,
      successfulPrints,
      failedPrints,
      details,
    };
  }
}

export const printService = new PrintService();
