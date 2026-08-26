import { 
  PrinterConnection, 
  PrinterConfig, 
  DiagnosticResult, 
  DiagnosticStep, 
  SendPrintResult 
} from './PrinterConnection';
import { listWindowsPrinters, printRawBytesToWindowsPrinter } from '../windowsRawPrinter';
import { ESC_POS_COMMANDS } from '../escposBuilder';

/**
 * Conexión USB directa mediante Windows Raw Spooler / Win32 API
 */
export class UsbPrinterConnection extends PrinterConnection {
  constructor(config: PrinterConfig) {
    super(config);
  }

  private getPrinterName(): string {
    // Si tiene ipAddress configurada como nombre de impresora USB (ej. "POS-58-Series"), o usa el name
    return (this.config.ipAddress || this.config.name || '').trim();
  }

  public async connect(): Promise<void> {
    const name = this.getPrinterName();
    if (!name) {
      throw new Error('Nombre de impresora USB no configurado');
    }
  }

  public async send(data: Buffer): Promise<SendPrintResult> {
    const printerName = this.getPrinterName();
    const result = await printRawBytesToWindowsPrinter(printerName, data);

    return {
      success: result.success,
      printerId: this.config.id,
      printerName: this.config.name,
      ip: 'USB: ' + printerName,
      port: 0,
      bytesWritten: result.bytesWritten,
      message: result.message,
      error: result.error,
    };
  }

  public async checkDiagnostic(): Promise<DiagnosticResult> {
    const printerName = this.getPrinterName();
    const steps: DiagnosticStep[] = [];
    const startTime = Date.now();

    if (!printerName) {
      steps.push({
        step: '1. Selección de Impresora USB',
        status: 'error',
        message: 'No se ha seleccionado el nombre de la impresora USB de Windows.',
      });
      return {
        success: false,
        status: 'error',
        ip: 'USB',
        port: 0,
        connectionType: 'usb',
        steps,
        message: 'Impresora USB no configurada',
        timestamp: new Date().toISOString(),
      };
    }

    steps.push({
      step: '1. Impresora USB configurada',
      status: 'success',
      message: `Dispositivo seleccionado: "${printerName}"`,
    });

    // 2. Verificar si está en la lista de impresoras de Windows
    const installed = await listWindowsPrinters();
    const found = installed.find(p => 
      p.name.toLowerCase() === printerName.toLowerCase() ||
      p.name.toLowerCase().includes(printerName.toLowerCase()) ||
      printerName.toLowerCase().includes(p.name.toLowerCase())
    );

    if (!found) {
      steps.push({
        step: '2. Detección en Sistema Operativo',
        status: 'warning',
        message: `La impresora "${printerName}" no aparece instalada en Windows. Impresoras detectadas: ${installed.map(p => p.name).join(', ') || 'Ninguna'}`,
      });
      steps.push({
        step: '3. Puerto USB Spooler',
        status: 'error',
        message: 'No se pudo vincular con el spooler de Windows.',
      });

      return {
        success: false,
        status: 'offline',
        ip: 'USB: ' + printerName,
        port: 0,
        connectionType: 'usb',
        steps,
        message: 'Impresora USB no detectada en Windows',
        timestamp: new Date().toISOString(),
      };
    }

    const latency = Date.now() - startTime;

    steps.push({
      step: '2. Detección en Windows OK',
      status: 'success',
      message: `Controlador: ${found.driverName || 'Genérico'} · Puerto: ${found.portName || 'USB'}`,
      latencyMs: latency,
    });

    steps.push({
      step: '3. Conexión USB Spooler activa',
      status: 'success',
      message: `Spooler de impresión de Windows listo para enviar comandos RAW ESC/POS`,
      latencyMs: latency,
    });

    // 4. Envío de handshake inicial ESC/POS
    const initRes = await printRawBytesToWindowsPrinter(found.name, ESC_POS_COMMANDS.INIT);
    if (initRes.success) {
      steps.push({
        step: '4. Protocolo ESC/POS listo',
        status: 'success',
        message: 'Comando de inicialización ESC/POS enviado correctamente al puerto USB',
      });

      return {
        success: true,
        status: 'online',
        ip: 'USB: ' + found.name,
        port: 0,
        connectionType: 'usb',
        latencyMs: latency,
        steps,
        message: 'Impresora USB en línea y lista',
        timestamp: new Date().toISOString(),
      };
    } else {
      steps.push({
        step: '4. Protocolo ESC/POS',
        status: 'warning',
        message: `Impresora detectada pero la cola de impresión reportó: ${initRes.message}`,
      });

      return {
        success: true,
        status: 'online',
        ip: 'USB: ' + found.name,
        port: 0,
        connectionType: 'usb',
        latencyMs: latency,
        steps,
        message: 'Impresora USB vinculada',
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async disconnect(): Promise<void> {}
}
