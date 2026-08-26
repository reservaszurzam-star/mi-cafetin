import net from 'net';
import { 
  PrinterConnection, 
  PrinterConfig, 
  DiagnosticResult, 
  DiagnosticStep, 
  SendPrintResult 
} from './PrinterConnection';
import { ESC_POS_COMMANDS } from '../escposBuilder';

export class TcpPrinterConnection extends PrinterConnection {
  private socket: net.Socket | null = null;

  constructor(config: PrinterConfig) {
    super(config);
  }

  private getHost(): string {
    return (this.config.ipAddress || '').trim();
  }

  private getPort(): number {
    return this.config.port || 9100;
  }

  public async connect(timeoutMs: number = 3000): Promise<void> {
    const host = this.getHost();
    const port = this.getPort();

    if (!host) {
      throw new Error('Dirección IP no configurada');
    }

    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      this.socket = socket;

      let isSettled = false;

      socket.setTimeout(timeoutMs);

      const cleanup = () => {
        socket.removeAllListeners();
      };

      socket.on('connect', () => {
        if (!isSettled) {
          isSettled = true;
          resolve();
        }
      });

      socket.on('timeout', () => {
        if (!isSettled) {
          isSettled = true;
          socket.destroy();
          cleanup();
          reject(new Error(`Timeout de conexión (${timeoutMs}ms) a ${host}:${port}`));
        }
      });

      socket.on('error', (err: any) => {
        if (!isSettled) {
          isSettled = true;
          socket.destroy();
          cleanup();
          reject(new Error(`Error de conexión TCP a ${host}:${port}: ${err.message || err.code}`));
        }
      });

      socket.connect(port, host);
    });
  }

  public async send(data: Buffer, timeoutMs: number = 5000): Promise<SendPrintResult> {
    const host = this.getHost();
    const port = this.getPort();
    const printerName = this.config.name || 'Impresora Térmica';

    if (!host) {
      return {
        success: false,
        printerId: this.config.id,
        printerName,
        ip: host,
        port,
        message: 'IP no configurada',
        error: 'IP_MISSING',
      };
    }

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isSettled = false;

      const finish = (result: SendPrintResult) => {
        if (!isSettled) {
          isSettled = true;
          try {
            socket.destroy();
            socket.removeAllListeners();
          } catch {}
          resolve(result);
        }
      };

      socket.setTimeout(timeoutMs);

      socket.on('timeout', () => {
        finish({
          success: false,
          printerId: this.config.id,
          printerName,
          ip: host,
          port,
          message: `Tiempo de espera agotado (${timeoutMs}ms) al enviar datos a la impresora`,
          error: 'TIMEOUT',
        });
      });

      socket.on('error', (err: any) => {
        finish({
          success: false,
          printerId: this.config.id,
          printerName,
          ip: host,
          port,
          message: `Error al conectar con la impresora: ${err.message || err.code}`,
          error: err.code || 'SOCKET_ERROR',
        });
      });

      socket.connect(port, host, () => {
        socket.write(data, (err) => {
          if (err) {
            finish({
              success: false,
              printerId: this.config.id,
              printerName,
              ip: host,
              port,
              message: `Error al escribir datos en el socket: ${err.message}`,
              error: 'WRITE_ERROR',
            });
          } else {
            socket.end(() => {
              finish({
                success: true,
                printerId: this.config.id,
                printerName,
                ip: host,
                port,
                bytesWritten: data.length,
                message: `Impresión enviada correctamente (${data.length} bytes)`,
              });
            });
          }
        });
      });
    });
  }

  public async checkDiagnostic(timeoutMs: number = 3000): Promise<DiagnosticResult> {
    const host = this.getHost();
    const port = this.getPort();
    const steps: DiagnosticStep[] = [];
    const startTime = Date.now();

    // Paso 1: Validación de formato IP
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!host || (!ipRegex.test(host) && host !== 'localhost')) {
      steps.push({
        step: '1. Validación de Dirección IP',
        status: 'error',
        message: `Dirección IP inválida o no especificada: "${host}"`,
      });
      return {
        success: false,
        status: 'error',
        ip: host,
        port,
        connectionType: 'tcp',
        steps,
        message: 'Dirección IP mal configurada',
        timestamp: new Date().toISOString(),
      };
    }

    steps.push({
      step: '1. Dirección IP válida',
      status: 'success',
      message: `IP ${host} configurada correctamente`,
    });

    // Paso 2: Disponibilidad de Puerto TCP y Handshake
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isSettled = false;

      const finishDiagnostic = (result: DiagnosticResult) => {
        if (!isSettled) {
          isSettled = true;
          try {
            socket.destroy();
            socket.removeAllListeners();
          } catch {}
          resolve(result);
        }
      };

      socket.setTimeout(timeoutMs);

      socket.on('timeout', () => {
        steps.push({
          step: `2. Puerto TCP ${port} disponible`,
          status: 'error',
          message: `Tiempo de espera agotado (${timeoutMs}ms). La impresora no responde en ${host}:${port}`,
        });
        steps.push({
          step: '3. Conexión TCP establecida',
          status: 'error',
          message: 'No se pudo establecer el socket TCP',
        });
        finishDiagnostic({
          success: false,
          status: 'offline',
          ip: host,
          port,
          connectionType: 'tcp',
          steps,
          message: 'Impresora apagada o inaccesible en la red',
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('error', (err: any) => {
        let errMsg = err.message || err.code;
        if (err.code === 'ECONNREFUSED') {
          errMsg = `Conexión rechazada en el puerto ${port}. Verifique que la impresora esté encendida con el puerto 9100 habilitado.`;
        } else if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
          errMsg = `Host no alcanzable. Verifique que la impresora esté en la misma subred (${host}).`;
        }

        steps.push({
          step: `2. Puerto TCP ${port} disponible`,
          status: 'error',
          message: errMsg,
        });
        steps.push({
          step: '3. Conexión TCP establecida',
          status: 'error',
          message: 'Socket cerrado por error de red',
        });
        finishDiagnostic({
          success: false,
          status: 'offline',
          ip: host,
          port,
          connectionType: 'tcp',
          steps,
          message: `Fallo de conexión: ${errMsg}`,
          timestamp: new Date().toISOString(),
        });
      });

      socket.connect(port, host, () => {
        const latency = Date.now() - startTime;
        
        steps.push({
          step: `2. Puerto TCP ${port} abierto`,
          status: 'success',
          message: `Puerto ${port} respondiendo con latencia de ${latency}ms`,
          latencyMs: latency,
        });

        steps.push({
          step: '3. Conexión TCP establecida',
          status: 'success',
          message: `Socket TCP activo con ${host}:${port}`,
          latencyMs: latency,
        });

        // Paso 4: Comprobación de comando ESC/POS
        socket.write(ESC_POS_COMMANDS.INIT, (err) => {
          if (err) {
            steps.push({
              step: '4. Protocolo ESC/POS',
              status: 'warning',
              message: `Conexión abierta pero falló el envío ESC/POS: ${err.message}`,
            });
            finishDiagnostic({
              success: true,
              status: 'online',
              ip: host,
              port,
              connectionType: 'tcp',
              latencyMs: latency,
              steps,
              message: 'Conectada (advertencia en comando ESC/POS)',
              timestamp: new Date().toISOString(),
            });
          } else {
            steps.push({
              step: '4. Protocolo ESC/POS listo',
              status: 'success',
              message: 'Comando de inicialización ESC/POS aceptado correctamente',
            });
            finishDiagnostic({
              success: true,
              status: 'online',
              ip: host,
              port,
              connectionType: 'tcp',
              latencyMs: latency,
              steps,
              message: 'Impresora lista y en línea',
              timestamp: new Date().toISOString(),
            });
          }
        });
      });
    });
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
  }
}
