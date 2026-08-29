/**
 * bluetoothPrinter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio universal de conexión e impresión térmica vía Bluetooth (BLE & Serial)
 * para ticketeras ESC/POS (58mm / 80mm).
 * 
 * Compatible con:
 *  - Ticketeras Bluetooth portátiles (POS-58, MTP-II, PT-210, Goojprt, Zjiang, etc.)
 *  - Web Bluetooth API (GATT ESC/POS standard services)
 *  - Web Serial API (Puertos COM virtuales Bluetooth en Windows / Mac)
 *  - RawBT / Android Bluetooth Print Intent (Universal para Android)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { RestaurantOrder, Settings } from '../types';

// UUIDs de servicios GATT comúnmente utilizados por ticketeras Bluetooth ESC/POS
const BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Estándar ESC/POS
  '000018f1-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb', // POS-58 / POS-80 genéricos
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC BLE Serial (MTP-II / Goojprt)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 / Goojprt / PT-210
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Zebra / Rongta
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb', // Device Info
  '0000fee7-0000-1000-8000-00805f9b34fb',
  '0000feff-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  type: 'ble' | 'serial';
  connected: boolean;
  paperWidth: '58mm' | '80mm';
}

class BluetoothPrinterManager {
  private bleDevice: any = null;
  private bleServer: any = null;
  private bleCharacteristic: any = null;
  private serialPort: any = null;
  private currentDeviceInfo: BluetoothDeviceInfo | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem('cafetin_bluetooth_printer');
      if (saved) {
        this.currentDeviceInfo = JSON.parse(saved);
      }
    } catch {}
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && ('bluetooth' in navigator || 'serial' in navigator);
  }

  public getConnectedDeviceInfo(): BluetoothDeviceInfo | null {
    return this.currentDeviceInfo;
  }

  public async pairBleDevice(paperWidth: '58mm' | '80mm' = '58mm'): Promise<BluetoothDeviceInfo> {
    const nav = navigator as any;
    const isHttps = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1));

    if (!nav.bluetooth) {
      if (isIOS) {
        throw new Error("En iPhone/iPad, Safari no incluye Bluetooth web por restricciones de Apple. Para imprimir vía Bluetooth en iOS, abre el sistema con la app gratuita 'Bluefy - Web BLE Browser' de la App Store.");
      }
      if (!isHttps) {
        throw new Error(`Google Chrome en móviles bloquea el Bluetooth si la URL no es HTTPS. Si estás en red local, activa: chrome://flags/#unsafely-treat-insecure-origin-as-secure y añade tu dirección actual.`);
      }
      throw new Error("Tu navegador o dispositivo no tiene habilitado Web Bluetooth. Asegúrate de usar Google Chrome y tener el Bluetooth y Ubicación (GPS) encendidos.");
    }

    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINTER_SERVICES,
      });

      this.bleDevice = device;

      device.addEventListener('gattserverdisconnected', () => {
        if (this.currentDeviceInfo) {
          this.currentDeviceInfo.connected = false;
        }
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("No se pudo establecer conexión GATT con la ticketera.");
      this.bleServer = server;

      let writeChar: any = null;

      // 1. Probar listar todos los servicios
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const chars = await service.getCharacteristics();
            for (const char of chars) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeChar = char;
                break;
              }
            }
            if (writeChar) break;
          } catch {}
        }
      } catch {}

      // 2. Si no encontró, probar los UUIDs conocidos uno por uno
      if (!writeChar) {
        for (const uuid of BLE_PRINTER_SERVICES) {
          try {
            const service = await server.getPrimaryService(uuid);
            if (service) {
              const chars = await service.getCharacteristics();
              for (const char of chars) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                  writeChar = char;
                  break;
                }
              }
              if (writeChar) break;
            }
          } catch {}
        }
      }

      if (!writeChar) {
        throw new Error("No se encontró canal de escritura ESC/POS en el dispositivo Bluetooth seleccionado.");
      }

      this.bleCharacteristic = writeChar;

      const info: BluetoothDeviceInfo = {
        id: device.id || `bt-${Date.now()}`,
        name: device.name || "Ticketera Bluetooth",
        type: 'ble',
        connected: true,
        paperWidth,
      };

      this.currentDeviceInfo = info;
      localStorage.setItem('cafetin_bluetooth_printer', JSON.stringify(info));
      return info;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        throw new Error("Búsqueda cancelada. No se seleccionó ningún dispositivo.");
      }
      throw new Error(err.message || "Error al conectar con la ticketera Bluetooth.");
    }
  }

  public async pairSerialDevice(paperWidth: '58mm' | '80mm' = '58mm'): Promise<BluetoothDeviceInfo> {
    if (!('serial' in navigator)) {
      throw new Error("Web Serial API no está disponible en este navegador.");
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      this.serialPort = port;

      const info: BluetoothDeviceInfo = {
        id: `com-bt-${Date.now()}`,
        name: "Ticketera Serial / Bluetooth COM",
        type: 'serial',
        connected: true,
        paperWidth,
      };

      this.currentDeviceInfo = info;
      localStorage.setItem('cafetin_bluetooth_printer', JSON.stringify(info));
      return info;
    } catch (err: any) {
      throw new Error(err.message || "Error al conectar al puerto serial de la ticketera.");
    }
  }

  public async sendRaw(data: Uint8Array): Promise<boolean> {
    if (this.bleCharacteristic) {
      if (!this.bleServer || !this.bleServer.connected) {
        if (this.bleDevice?.gatt) {
          this.bleServer = await this.bleDevice.gatt.connect();
        }
      }

      const CHUNK_SIZE = 100;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (this.bleCharacteristic.properties.writeWithoutResponse) {
          await this.bleCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.bleCharacteristic.writeValue(chunk);
        }
        await new Promise(r => setTimeout(r, 20));
      }
      return true;
    }

    if (this.serialPort && this.serialPort.writable) {
      const writer = this.serialPort.writable.getWriter();
      await writer.write(data);
      writer.releaseLock();
      return true;
    }

    throw new Error("No hay ninguna ticketera Bluetooth conectada actualmente. Vincula la impresora primero.");
  }

  public buildTestTicketBytes(companyName: string = "Mi Cafetín", slogan: string = "Restaurante & Bar", paperWidth: '58mm' | '80mm' = '58mm'): Uint8Array {
    const builder = new ClientEscPosBuilder(paperWidth);

    builder
      .init()
      .alignCenter()
      .bold(true)
      .textDoubleBoth()
      .text(companyName.toUpperCase())
      .newLine()
      .textNormal()
      .text(slogan)
      .newLine()
      .text("================================")
      .newLine()
      .bold(true)
      .text("★ PRUEBA BLUETOOTH EXITOSA ★")
      .newLine()
      .bold(false)
      .text(`Fecha: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`)
      .newLine()
      .text(`Ticketera: ${this.currentDeviceInfo?.name || 'BT Printer'}`)
      .newLine()
      .text(`Ancho: ${paperWidth}`)
      .newLine()
      .text("================================")
      .newLine()
      .alignLeft()
      .text("1x Cafe Americano       S/ 6.00")
      .newLine()
      .text("1x 1/4 Pollo a la Brasa S/ 22.00")
      .newLine()
      .text("--------------------------------")
      .newLine()
      .alignRight()
      .bold(true)
      .text("TOTAL: S/ 28.00")
      .newLine()
      .bold(false)
      .newLine()
      .alignCenter()
      .text("¡Conexion Bluetooth lista para emitir comandas y boletas!")
      .newLine()
      .feed(4)
      .cut();

    return builder.getBytes();
  }

  public buildOrderTicketBytes(
    order: RestaurantOrder,
    settings?: Partial<Settings>,
    options?: {
      ticketType?: 'comanda_cocina' | 'boleta_cliente' | 'boleta_venta';
      customerName?: string;
      customerDocType?: string;
      customerDocNumber?: string;
      invoiceSeries?: string;
      invoiceNumber?: string;
      paymentMethod?: string;
      amountPaid?: number;
      changeDue?: number;
      stationName?: string;
      batchNumber?: number;
      paperWidth?: '58mm' | '80mm';
    }
  ): Uint8Array {
    const width = options?.paperWidth || this.currentDeviceInfo?.paperWidth || '58mm';
    const builder = new ClientEscPosBuilder(width);
    const type = options?.ticketType || 'boleta_venta';
    
    const isParadero = settings?.companyName 
      ? settings.companyName.toLowerCase().includes('paradero') 
      : true;
    const company = settings?.companyName || (isParadero ? "PARADERO 104" : "LAS LOMAS GRILL");
    const ruc = settings?.companyRuc || "10437453701";
    const address = settings?.address || (isParadero 
      ? "Jr. Los Tordos 1009, San Juan de Lurigancho 15427, Perú" 
      : "Jr, Templo del Sol 589 urb, San Juan de Lurigancho 15427, Perú");
    const phone = settings?.phone || (isParadero ? "932208729" : "995881303/953034562");

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-PE');
    const formattedTime = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const orderNo = (order as any).dailyOrderNumber || (order as any).orderNumber || (order.id ? order.id.replace(/\D/g, '').slice(-4) || '0001' : '0001');
    const dividerChar = width === '80mm' ? "------------------------------------------------" : "--------------------------------";
    const doubleDivider = width === '80mm' ? "================================================" : "================================";

    builder.init().alignCenter();

    // ═══ MODO 1: COMANDA DE COCINA (TÉRMICO) ═══
    if (type === 'comanda_cocina') {
      builder
        .bold(true)
        .textDoubleBoth()
        .text(company.toUpperCase())
        .newLine()
        .textNormal()
        .bold(false)
        .text(`RUC: ${ruc}`)
        .newLine()
        .text(address)
        .newLine()
        .text(`TEL: ${phone}`)
        .newLine()
        .text(dividerChar)
        .newLine()
        .bold(true)
        .textDoubleHeight()
        .text(`★ COMANDA: ${(options?.stationName || 'COCINA').toUpperCase()} ★`)
        .newLine()
        .textNormal()
        .bold(false)
        .text(doubleDivider)
        .newLine()
        .alignLeft()
        .bold(true)
        .textDoubleHeight()
        .text(`MESA: ${order.tableNumber || 'S/N'} ${order.type === 'delivery' ? '(DELIVERY)' : ''}`)
        .newLine()
        .textNormal()
        .bold(false)
        .text(`N° ORDEN: #${orderNo} | TANDA: #${options?.batchNumber || 1}`)
        .newLine()
        .text(`HORA: ${formattedTime} | FECHA: ${formattedDate}`)
        .newLine()
        .text(`MESERO: ${order.waiterName || 'Mesero'}`)
        .newLine();

      if (order.dinerName || options?.customerName) {
        builder.text(`CLIENTE: ${(order.dinerName || options?.customerName || '').toUpperCase()}`).newLine();
      }

      builder
        .text(dividerChar)
        .newLine()
        .bold(true)
        .text(width === '80mm' ? "CANT  PRODUCTO / NOTA" : "CANT PRODUCTO / NOTA")
        .newLine()
        .bold(false)
        .text(dividerChar)
        .newLine();

      (order.items || []).forEach(item => {
        builder
          .bold(true)
          .textDoubleHeight()
          .text(`${item.quantity}x ${item.productName.toUpperCase()}`)
          .newLine()
          .textNormal()
          .bold(false);

        if (item.notes && item.notes.trim()) {
          builder
            .bold(true)
            .text(`   ⚠️ NOTA: ${item.notes.toUpperCase()}`)
            .newLine()
            .bold(false);
        }
        builder.text(dividerChar).newLine();
      });

      builder
        .alignCenter()
        .bold(true)
        .text("*** DESPACHAR DE INMEDIATO ***")
        .newLine()
        .feed(3)
        .cut();

    } else {
      // ═══ MODO 2: BOLETA / FACTURA / PRE-CUENTA CLIENTE ═══
      const docTitle = options?.customerDocType === 'RUC' 
        ? "FACTURA ELECTRÓNICA" 
        : type === 'boleta_cliente' ? "PRE-CUENTA DE CONSUMO" : "BOLETA ELECTRÓNICA";
      const seriesNum = `${options?.invoiceSeries || 'B001'} - ${options?.invoiceNumber || orderNo}`;

      builder
        .bold(true)
        .textDoubleBoth()
        .text(company.toUpperCase())
        .newLine()
        .textNormal()
        .bold(false)
        .text(`RUC: ${ruc}`)
        .newLine()
        .text(address)
        .newLine()
        .text(`TEL: ${phone}`)
        .newLine()
        .text(dividerChar)
        .newLine()
        .bold(true)
        .textDoubleHeight()
        .text(docTitle)
        .newLine()
        .textNormal()
        .text(seriesNum)
        .newLine()
        .bold(false)
        .text(dividerChar)
        .newLine()
        .alignLeft()
        .text(`FECHA: ${formattedDate} | HORA: ${formattedTime}`)
        .newLine()
        .text(`MESA: ${order.tableNumber || '1'} ${order.type === 'delivery' ? '(DELIVERY)' : ''}`)
        .newLine()
        .text(`ORDEN: #${orderNo} | ATENDIÓ: ${order.waiterName || 'Caja'}`)
        .newLine();

      if (options?.customerDocNumber) {
        builder.text(`${options.customerDocType || 'DOC'}: ${options.customerDocNumber}`).newLine();
      }
      if (options?.customerName || order.dinerName) {
        builder.text(`CLIENTE: ${(options?.customerName || order.dinerName || '').toUpperCase()}`).newLine();
      }

      builder
        .text(dividerChar)
        .newLine()
        .bold(true)
        .text(width === '80mm' ? "CANT  DESCRIPCIÓN                    TOTAL" : "CANT DESCRIPCIÓN         TOTAL")
        .newLine()
        .bold(false)
        .text(dividerChar)
        .newLine();

      const total = Number(order.total || 0);
      const opGravada = total / 1.105;
      const igv = total - opGravada;

      (order.items || []).forEach(item => {
        const qtyStr = `${item.quantity}x`.padEnd(4);
        const priceTotal = (item.price * item.quantity).toFixed(2);
        const nameMaxLen = width === '80mm' ? 30 : 18;
        const shortName = item.productName.slice(0, nameMaxLen).padEnd(nameMaxLen);
        builder.text(`${qtyStr} ${shortName} ${priceTotal}`).newLine();
        if (item.notes) {
          builder.text(`   * ${item.notes}`).newLine();
        }
      });

      builder
        .text(dividerChar)
        .newLine()
        .alignRight()
        .text(`OP. GRAVADA: S/ ${opGravada.toFixed(2)}`)
        .newLine()
        .text(`I.G.V. (10.5%): S/ ${igv.toFixed(2)}`)
        .newLine()
        .text(doubleDivider)
        .newLine()
        .bold(true)
        .textDoubleHeight()
        .text(`TOTAL A PAGAR: S/ ${total.toFixed(2)}`)
        .newLine()
        .textNormal()
        .bold(false)
        .text(`FORMA DE PAGO: ${(options?.paymentMethod || 'Efectivo').toUpperCase()}`)
        .newLine();

      if (options?.amountPaid !== undefined && options.amountPaid > 0) {
        builder.text(`IMPORTE RECIBIDO: S/ ${Number(options.amountPaid).toFixed(2)}`).newLine();
      }
      if (options?.changeDue !== undefined && options.changeDue > 0) {
        builder.bold(true).text(`VUELTO: S/ ${Number(options.changeDue).toFixed(2)}`).newLine().bold(false);
      }

      builder
        .text(dividerChar)
        .newLine()
        .alignCenter()
        .text("¡GRACIAS POR SU PREFERENCIA!")
        .newLine()
        .text("Representación impresa de Boleta Electrónica.")
        .newLine()
        .text("Consulte su documento en www.sunat.gob.pe")
        .newLine()
        .feed(4)
        .cut();
    }

    return builder.getBytes();
  }

  public async printTestTicket(companyName: string = "Mi Cafetín", slogan: string = "Restaurante & Bar"): Promise<boolean> {
    const width = this.currentDeviceInfo?.paperWidth || '58mm';
    const bytes = this.buildTestTicketBytes(companyName, slogan, width);
    return await this.sendRaw(bytes);
  }

  public async printOrderTicket(
    order: RestaurantOrder,
    settings?: Partial<Settings>,
    options?: {
      ticketType?: 'comanda_cocina' | 'boleta_cliente' | 'boleta_venta';
      customerName?: string;
      customerDocNumber?: string;
      paymentMethod?: string;
      paperWidth?: '58mm' | '80mm';
    }
  ): Promise<boolean> {
    const bytes = this.buildOrderTicketBytes(order, settings, options);
    return await this.sendRaw(bytes);
  }

  public printViaRawBT(
    order: RestaurantOrder,
    settings?: Partial<Settings>,
    options?: {
      ticketType?: 'comanda_cocina' | 'boleta_cliente' | 'boleta_venta';
      customerName?: string;
      customerDocNumber?: string;
      paymentMethod?: string;
      paperWidth?: '58mm' | '80mm';
    }
  ): boolean {
    const bytes = this.buildOrderTicketBytes(order, settings, options);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    window.location.href = "rawbt:base64," + base64;
    return true;
  }

  public printTestViaRawBT(companyName: string = "Mi Cafetín", slogan: string = "Restaurante & Bar"): boolean {
    const width = this.currentDeviceInfo?.paperWidth || '58mm';
    const bytes = this.buildTestTicketBytes(companyName, slogan, width);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    window.location.href = "rawbt:base64," + base64;
    return true;
  }

  public disconnect(): void {
    if (this.bleDevice?.gatt?.connected) {
      this.bleDevice.gatt.disconnect();
    }
    if (this.serialPort) {
      try { this.serialPort.close(); } catch {}
    }
    this.bleDevice = null;
    this.bleServer = null;
    this.bleCharacteristic = null;
    this.serialPort = null;
    if (this.currentDeviceInfo) {
      this.currentDeviceInfo.connected = false;
    }
  }
}

class ClientEscPosBuilder {
  private buffer: number[] = [];
  private width: '58mm' | '80mm';

  constructor(width: '58mm' | '80mm' = '58mm') {
    this.width = width;
  }

  public init(): this {
    this.buffer.push(0x1B, 0x40); // ESC @
    this.buffer.push(0x1B, 0x74, 19); // CP858
    return this;
  }

  public alignLeft(): this {
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  public alignCenter(): this {
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  public alignRight(): this {
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  public bold(on: boolean): this {
    this.buffer.push(0x1B, 0x45, on ? 0x01 : 0x00);
    return this;
  }

  public textNormal(): this {
    this.buffer.push(0x1D, 0x21, 0x00);
    return this;
  }

  public textDoubleHeight(): this {
    this.buffer.push(0x1D, 0x21, 0x01);
    return this;
  }

  public textDoubleBoth(): this {
    this.buffer.push(0x1D, 0x21, 0x11);
    return this;
  }

  public text(str: string): this {
    const cleanStr = str
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
      .replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U')
      .replace(/ñ/g, 'n').replace(/Ñ/g, 'N');

    for (let i = 0; i < cleanStr.length; i++) {
      this.buffer.push(cleanStr.charCodeAt(i));
    }
    return this;
  }

  public newLine(): this {
    this.buffer.push(0x0A);
    return this;
  }

  public feed(lines: number = 3): this {
    this.buffer.push(0x1B, 0x64, lines);
    return this;
  }

  public cut(): this {
    this.buffer.push(0x1D, 0x56, 0x42, 0x03);
    return this;
  }

  public getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export const bluetoothPrinter = new BluetoothPrinterManager();