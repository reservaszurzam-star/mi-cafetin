/**
 * Centralized formatting utilities for currency, dates, phones, and WhatsApp URLs.
 */

/**
 * Formats a numeric amount into standard Peruvian Soles currency string (or custom currency).
 * @example formatMoney(25.5) => "S/ 25.50"
 */
export function formatMoney(amount: number, currency: string = "S/"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currency} 0.00`;
  }
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Formats an ISO date string into a friendly Peruvian formatted date.
 * @example formatDate("2026-08-22T06:00:00Z") => "22/08/2026"
 */
export function formatDate(isoDateString?: string): string {
  if (!isoDateString) return "-";
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return isoDateString;
  }
}

/**
 * Formats an ISO date string into friendly time.
 * @example formatTime("2026-08-22T06:30:00Z") => "06:30 AM"
 */
export function formatTime(isoDateString?: string): string {
  if (!isoDateString) return "-";
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDateString;
  }
}

/**
 * Formats full datetime string.
 * @example formatDateTime("2026-08-22T06:30:00Z") => "22/08/2026, 06:30 AM"
 */
export function formatDateTime(isoDateString?: string): string {
  if (!isoDateString) return "-";
  return `${formatDate(isoDateString)}, ${formatTime(isoDateString)}`;
}

/**
 * Cleans and normalizes phone numbers for WhatsApp API.
 * Adds 51 country code if missing from a 9-digit Peruvian cell.
 */
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9 && cleaned.startsWith("9")) {
    return `51${cleaned}`;
  }
  return cleaned;
}

/**
 * Generates standard wa.me link with encoded text message.
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
