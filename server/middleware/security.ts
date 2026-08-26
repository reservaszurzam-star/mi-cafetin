/**
 * Middleware de seguridad para validar conexiones TCP a impresoras
 * Previene el uso indebido del servidor como proxy TCP abierto o SSRF.
 */

// Rangos de red privada permitidos (RFC 1918 + Loopback)
const PRIVATE_IP_REGEX = /^(?:127\.0\.0\.1|localhost|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;

export const ALLOWED_TCP_PORTS = [9100, 9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110];

export function isValidPrinterIp(ip?: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const cleanIp = ip.trim();
  return PRIVATE_IP_REGEX.test(cleanIp);
}

export function isValidPrinterPort(port?: number): boolean {
  if (port === undefined || port === null) return true; // Default 9100
  return typeof port === 'number' && port >= 1024 && port <= 65535;
}

export function validatePrinterConfigSecurity(config: { ipAddress?: string; port?: number }): { valid: boolean; error?: string } {
  const ip = (config.ipAddress || '').trim();
  if (!ip) {
    return { valid: false, error: 'Dirección IP obligatoria' };
  }

  if (!isValidPrinterIp(ip)) {
    return { 
      valid: false, 
      error: `Dirección IP "${ip}" no permitida por seguridad. Solo se permiten IPs de red local privada (192.168.x.x, 10.x.x.x, 172.16-31.x.x o 127.0.0.1).` 
    };
  }

  const port = config.port || 9100;
  if (!isValidPrinterPort(port)) {
    return { valid: false, error: `Puerto TCP ${port} no válido.` };
  }

  return { valid: true };
}
