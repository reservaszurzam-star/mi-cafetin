/**
 * Interfaz base y tipos para conexiones a impresoras térmicas
 */

export interface PrinterConfig {
  id?: string;
  name: string;
  connectionType?: 'tcp' | 'network' | 'usb' | 'bluetooth';
  ipAddress?: string;
  port?: number;
  paperWidth?: '80mm' | '58mm';
  station?: string;
  categories?: string[];
  isActive?: boolean;
}

export interface DiagnosticStep {
  step: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  latencyMs?: number;
}

export interface DiagnosticResult {
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

export interface SendPrintResult {
  success: boolean;
  printerId?: string;
  printerName: string;
  ip: string;
  port: number;
  bytesWritten?: number;
  message: string;
  error?: string;
}

export abstract class PrinterConnection {
  protected config: PrinterConfig;

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  abstract connect(timeoutMs?: number): Promise<void>;
  abstract send(data: Buffer, timeoutMs?: number): Promise<SendPrintResult>;
  abstract checkDiagnostic(timeoutMs?: number): Promise<DiagnosticResult>;
  abstract disconnect(): Promise<void>;
}
