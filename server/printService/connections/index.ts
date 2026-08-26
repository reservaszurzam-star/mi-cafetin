import { PrinterConnection, PrinterConfig } from './PrinterConnection';
import { TcpPrinterConnection } from './TcpPrinterConnection';
import { UsbPrinterConnection } from './UsbPrinterConnection';
import { BluetoothPrinterConnection } from './BluetoothPrinterConnection';

export * from './PrinterConnection';
export * from './TcpPrinterConnection';
export * from './UsbPrinterConnection';
export * from './BluetoothPrinterConnection';

/**
 * Factoría para instanciar la conexión adecuada según el tipo de hardware
 */
export function createPrinterConnection(config: PrinterConfig): PrinterConnection {
  const type = (config.connectionType || 'tcp').toLowerCase();

  switch (type) {
    case 'usb':
      return new UsbPrinterConnection(config);
    case 'bluetooth':
    case 'bt':
      return new BluetoothPrinterConnection(config);
    case 'tcp':
    case 'network':
    default:
      return new TcpPrinterConnection(config);
  }
}
