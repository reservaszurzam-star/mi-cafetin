import { 
  PrinterConnection, 
  PrinterConfig, 
  DiagnosticResult, 
  SendPrintResult 
} from './PrinterConnection';

/**
 * Conexión Bluetooth SPP / RFCOMM (Arquitectura extensible para futuro)
 */
export class BluetoothPrinterConnection extends PrinterConnection {
  constructor(config: PrinterConfig) {
    super(config);
  }

  public async connect(): Promise<void> {
    throw new Error('Conexión Bluetooth no habilitada en esta versión. Utilice conexión de red TCP/IP.');
  }

  public async send(data: Buffer): Promise<SendPrintResult> {
    return {
      success: false,
      printerName: this.config.name,
      ip: 'BT',
      port: 0,
      message: 'Módulo Bluetooth en desarrollo. Por favor configure la impresora por TCP/IP.',
      error: 'BLUETOOTH_NOT_IMPLEMENTED',
    };
  }

  public async checkDiagnostic(): Promise<DiagnosticResult> {
    return {
      success: false,
      status: 'error',
      ip: 'BT',
      port: 0,
      connectionType: 'bluetooth',
      steps: [
        {
          step: '1. Dispositivo Bluetooth',
          status: 'warning',
          message: 'Soporte Bluetooth inalámbrico pendiente de vinculación local.',
        },
      ],
      message: 'Conexión Bluetooth disponible próximamente.',
      timestamp: new Date().toISOString(),
    };
  }

  public async disconnect(): Promise<void> {}
}
