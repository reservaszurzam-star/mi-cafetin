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
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { RestaurantOrder, Settings } from '../types';

// UUIDs de servicios GATT comúnmente utilizados por ticketeras Bluetooth ESC/POS
const BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Estándar ESC/POS
  '0000ff00-0000-1000-8000-00805f9b34fb', // POS-58 / POS-80 genéricos
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC BLE Serial
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 / Goojprt / MTP
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Zebra / Rongta
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000af00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000180a-0000-1000-8000-00805f9b34fb', // Device Info
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
    if (!nav.bluetooth) {
      throw new Error("Tu navegador no soporta Web Bluetooth API. Por favor usa Google Chrome, Edge o un navegador compatible en Android/Windows/Mac.");
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

  public async printTestTicket(companyName: string = "Mi Cafetín", slogan: string = "Restaurante & Bar"): Promise<boolean> {
    const width = this.currentDeviceInfo?.paperWidth || '58mm';
    const builder = new ClientEscPosBuilder(width);

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
      .text(`Ancho: ${width}`)
      .newLine()
      .text("================================")
      .newLine()
      .alignLeft()
      .text("1x Café Americano      S/ 6.00")
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
      .text("¡Conexión Bluetooth lista para emitir comandas y boletas!")
      .newLine()
      .feed(4)
      .cut();

    const bytes = builder.getBytes();
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
    const width = options?.paperWidth || this.currentDeviceInfo?.paperWidth || '58mm';
    const builder = new ClientEscPosBuilder(width);
    const type = options?.ticketType || 'boleta_venta';
    const company = settings?.companyName || "Mi Cafetín";

    builder.init().alignCenter();

    if (type === 'comanda_cocina') {
      builder
        .bold(true)
        .textDoubleBoth()
        .text("--- COMANDA DE COCINA ---")
        .newLine()
        .textNormal()
        .textDoubleHeight()
        .text(`MESA: ${order.tableNumber || 'S/N'}`)
        .newLine()
        .textNormal()
        .text(`Origen: ${(order.type || 'salón').toUpperCase()} | Piso ${order.floor || 1}`)
        .newLine()
        .text(`Mozo: ${order.waiterName || 'Caja'}`)
        .newLine()
        .text(`Hora: ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`)
        .newLine()
        .text("================================")
        .newLine()
        .alignLeft()
        .bold(true);

      (order.items || []).forEach(item => {
        builder
          .textDoubleHeight()
          .text(`[${item.quantity}] ${item.productName}`)
          .newLine()
          .textNormal();
        if (item.notes) {
          builder.text(`   * Nota: ${item.notes}`).newLine();
        }
      });

      builder
        .newLine()
        .alignCenter()
        .text("================================")
        .feed(4)
        .cut();

    } else {
      builder
        .bold(true)
        .textDoubleBoth()
        .text(company.toUpperCase())
        .newLine()
        .textNormal();

      if (settings?.companyRuc) {
        builder.text(`RUC: ${settings.companyRuc}`).newLine();
      }
      if (settings?.address) {
        builder.text(settings.address).newLine();
      }

      builder
        .text("--------------------------------")
        .newLine()
        .bold(true)
        .text(type === 'boleta_cliente' ? "=== PRE-CUENTA DE CONSUMO ===" : "=== BOLETA DE VENTA ===")
        .newLine()
        .bold(false)
        .text(`Mesa: ${order.tableNumber || '1'} | Mozo: ${order.waiterName || 'Caja'}`)
        .newLine()
        .text(`Fecha: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`)
        .newLine();

      if (options?.customerName) {
        builder.text(`Cliente: ${options.customerName}`).newLine();
      }
      if (options?.customerDocNumber) {
        builder.text(`Doc: ${options.customerDocNumber}`).newLine();
      }

      builder
        .text("--------------------------------")
        .newLine()
        .alignLeft()
        .bold(true)
        .text(width === '80mm' ? "CANT  DESCRIPCION                    IMPORTE" : "CANT DESCRIPCION         TOTAL")
        .newLine()
        .bold(false)
        .text("--------------------------------")
        .newLine();

      (order.items || []).forEach(item => {
        const qtyStr = `${item.quantity}x`.padEnd(5);
        const priceTotal = (item.price * item.quantity).toFixed(2);
        const nameMaxLen = width === '80mm' ? 30 : 18;
        const shortName = item.productName.slice(0, nameMaxLen).padEnd(nameMaxLen);
        builder.text(`${qtyStr} ${shortName} S/ ${priceTotal}`).newLine();
      });

      builder
        .text("--------------------------------")
        .newLine()
        .alignRight()
        .bold(true)
        .textDoubleHeight()
        .text(`TOTAL: S/ ${Number(order.total || 0).toFixed(2)}`)
        .newLine()
        .textNormal()
        .bold(false)
        .text(`Metodo: ${options?.paymentMethod || 'Efectivo'}`)
        .newLine()
        .text("--------------------------------")
        .newLine()
        .alignCenter()
        .text("¡Gracias por su preferencia!")
        .newLine()
        .feed(4)
        .cut();
    }

    const bytes = builder.getBytes();
    return await this.sendRaw(bytes);
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