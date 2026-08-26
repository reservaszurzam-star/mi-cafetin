import React, { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { 
  Printer, X, CheckCircle2, DollarSign, Calendar, Clock, 
  Store, Phone, MapPin, Tag, Utensils, AlertTriangle, 
  CreditCard, User, Layers, RefreshCw, Zap, Check
} from "lucide-react";
import { RestaurantOrder, Settings } from "../../types";
import { useAppStore } from "../../hooks/StoreContext";
import { formatMoney } from "../../lib/formatters";
import { routeAndPrintOrderApi, printSingleTicketDirectApi } from "../../lib/printerService";

export type TicketType = "comanda_cocina" | "boleta_cliente" | "boleta_venta";

interface ThermalTicketProps {
  order: RestaurantOrder;
  settings?: Settings;
  ticketType?: TicketType;
  stationName?: string; // Para comandas filtradas por estación
  batchNumber?: number;
  paymentMethod?: string;
  amountPaid?: number;
  changeDue?: number;
  customerName?: string;
  customerDocType?: string;
  customerDocNumber?: string;
  invoiceSeries?: string;
  invoiceNumber?: string;
  hash?: string;
  showQR?: boolean;
  onClose: () => void;
  onConfirmPrint?: () => void;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  order,
  settings: propSettings,
  ticketType = "boleta_cliente",
  stationName = "General",
  batchNumber = 1,
  paymentMethod = "Efectivo",
  amountPaid,
  changeDue,
  customerName,
  customerDocType = "DNI",
  customerDocNumber,
  invoiceSeries = "B001",
  invoiceNumber = "00001048",
  hash,
  showQR: propShowQR,
  onClose,
  onConfirmPrint,
}) => {
  const store = useAppStore();
  const settings = propSettings || store?.settings || {} as Settings;
  const printers = store?.printers || [];
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Configurador de Vista y Ancho
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [showQR, setShowQR] = useState(propShowQR !== undefined ? propShowQR : true);

  // Impresión Directa ESC/POS Hardware (USB / TCP)
  const [directPrinting, setDirectPrinting] = useState(false);
  const [directFeedback, setDirectFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleDirectPrintEscPos = async () => {
    if (!order) return;
    setDirectPrinting(true);
    setDirectFeedback(null);
    try {
      const res = await printSingleTicketDirectApi({
        order,
        printers,
        settings,
        ticketType,
        details: {
          stationName,
          batchNumber,
          paymentMethod,
          amountPaid,
          changeDue,
          customerName,
          customerDocType,
          customerDocNumber,
          invoiceSeries,
          invoiceNumber,
          paperWidth,
        },
      });
      if (res.success) {
        setDirectFeedback({
          success: true,
          message: `¡Impreso directamente en ${res.printerName || 'Ticketera USB'} (${res.bytesWritten || 0} bytes)!`
        });
        if (onConfirmPrint) onConfirmPrint();
      } else {
        setDirectFeedback({
          success: false,
          message: res.message || "No se pudo comunicar con la ticketera USB"
        });
      }
    } catch (err: any) {
      setDirectFeedback({
        success: false,
        message: `Error: ${err.message}`
      });
    } finally {
      setDirectPrinting(false);
    }
  };

  const isParadero = settings.businessType === 'cafetin' || (settings.companyName && settings.companyName.toLowerCase().includes('paradero'));
  const logoSrc = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';

  const safeStationName = typeof stationName === 'string' && stationName.trim() ? stationName : "General";

  const isDelivery = order?.type === 'delivery';
  const displayOrderNo = order?.dailyOrderNumber || order?.orderNumber || (order?.id ? String(order.id).slice(-4) : '0001');

  // Filtrado de items si es comanda por estación
  const items = Array.isArray(order?.items) ? order.items : [];
  const filteredItems = (ticketType === 'comanda_cocina' && safeStationName !== 'General' && safeStationName !== 'auto')
    ? items.filter(item => (item?.station || 'Cocina & Parrilla').toLowerCase().includes(safeStationName.toLowerCase()))
    : items;

  const totalAmount = Number(order?.total ?? filteredItems.reduce((s, i) => s + ((Number(i?.price) || 0) * (Number(i?.quantity) || 1)), 0));
  const opGravada = (totalAmount || 0) / 1.105;
  const igv = (totalAmount || 0) - opGravada;

  const dateObj = new Date(order?.createdAt || Date.now());
  const formattedDate = !isNaN(dateObj.getTime()) 
    ? dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : new Date().toLocaleDateString('es-PE');
  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : new Date().toLocaleTimeString('es-PE');

  const displayCompanyName = settings?.companyName || (isParadero ? "PARADERO 104" : "LAS LOMAS GRILL");
  const businessSubtitle = isParadero ? "SANGUCHERÍA & JUGUERÍA" : "POLLERÍA & PARRILLAS";
  const businessRuc = (settings?.companyRuc && settings.companyRuc !== "20601234567" && settings.companyRuc !== "20123456789" && !settings.companyRuc.startsWith("2060")) 
    ? settings.companyRuc 
    : "10437453701";
  const businessAddress = (settings?.companyAddress && !settings.companyAddress.includes("Av. Principal") && !settings.companyAddress.includes("Av. Las Lomas 234") && !settings.companyAddress.includes("Av. Próceres"))
    ? settings.companyAddress
    : (isParadero 
        ? "Jr. Los Tordos 1009, San Juan de Lurigancho 15427, Perú" 
        : "Jr. Templo del Sol 589 urb, San Juan de Lurigancho 15427, Perú");
  const businessPhone = (settings?.companyPhone && !settings.companyPhone.includes("987 654 321") && !settings.companyPhone.includes("987654321"))
    ? settings.companyPhone
    : (isParadero 
        ? "995881303" 
        : "995881303 / 953034562");

  // Tipo de comprobante SUNAT: 01=Factura, 03=Boleta
  const tipoComprobante = customerDocType === 'RUC' ? '01' : '03';
  const tipoDocAdquirente = customerDocType === 'RUC' ? '6' : (customerDocType === 'DNI' ? '1' : '-');
  const effectiveHash = hash || 'a8f9c2e1b4d093fe';

  // Cadena QR Fiscal Oficial SUNAT (Formato Anexo 7)
  const qrFiscalData = `${businessRuc}|${tipoComprobante}|${invoiceSeries || 'B001'}|${invoiceNumber || '00001048'}|${igv.toFixed(2)}|${totalAmount.toFixed(2)}|${formattedDate}|${tipoDocAdquirente}|${customerDocNumber || '00000000'}|${effectiveHash}|`;

  // Disparador de Impresión Nativa Térmica
  const handlePrint = () => {
    if (!componentRef.current) return;

    const scrollHeightPx = componentRef.current.scrollHeight || 500;
    const calculatedHeightMm = Math.max(80, Math.ceil(scrollHeightPx * 0.264583) + 10);

    const is58 = paperWidth === '58mm';
    const widthMm = is58 ? '58mm' : '80mm';

    const printWindow = window.open('', '_blank', 'width=480,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title> </title>
          <style>
            @page {
              size: auto;
              margin: 0mm !important;
            }
            @media print {
              html, body {
                width: 100% !important;
                max-width: ${widthMm} !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
                background: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                margin: 0 !important;
              }
              .ticket-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 2mm 2.5mm !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              img.ticket-logo {
                max-height: ${is58 ? '78px' : '96px'} !important;
                max-width: ${is58 ? '52mm' : '72mm'} !important;
                width: auto !important;
                height: auto !important;
                display: block !important;
                margin: 0 auto 3px auto !important;
                object-fit: contain !important;
                filter: contrast(135%) grayscale(100%) !important;
                -webkit-filter: contrast(135%) grayscale(100%) !important;
              }
              table, tbody, tr, td, th {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: ${is58 ? '9.5px' : '11px'};
              font-weight: 600;
              line-height: 1.2;
              color: #000;
              background: #fff;
              width: 100%;
              max-width: ${widthMm};
              margin: 0 auto;
              padding: 1mm 1mm;
            }
            .ticket-container {
              width: 100%;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .divider {
              border-top: 1px dashed #000;
              margin: 3px 0;
            }
            .divider-double {
              border-top: 1.5px double #000;
              margin: 3px 0;
            }
            .title-box {
              border: 1.5px solid #000;
              padding: 2.5px 1px;
              margin: 3px 0;
              text-align: center;
              font-size: ${is58 ? '10px' : '11.5px'};
              font-weight: 900;
              color: #000;
              background: #fff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 3px 0;
            }
            th, td {
              padding: 2px 0;
              vertical-align: top;
            }
            .qr-wrapper {
              text-align: center;
              margin: 8px auto;
            }
            .qr-wrapper svg {
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            ${componentRef.current.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      
      {/* ── MODAL CONTAINER ── */}
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-stone-200 shadow-2xl flex flex-col md:flex-row gap-6 p-5 sm:p-6 my-auto max-h-[95vh] overflow-hidden">
        
        {/* ── PANEL IZQUIERDO DE CONFIGURACIÓN & ACCIONES ── */}
        <div className="md:w-80 flex flex-col justify-between space-y-4 shrink-0 overflow-y-auto pr-1">
          
          <div className="space-y-4">
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-sm leading-tight">
                    {ticketType === 'comanda_cocina' ? 'Comanda Térmica' : 'Boleta de Venta'}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-bold">Mesa {order.tableNumber} · Orden #{displayOrderNo}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Ancho de Papel */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
              <label className="text-[11px] font-black text-stone-600 uppercase tracking-wider block">
                Formato de Ticket Térmico:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border ${
                    paperWidth === '80mm'
                      ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  80 mm (Estándar)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border ${
                    paperWidth === '58mm'
                      ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  58 mm (Angosto)
                </button>
              </div>
            </div>

            {/* Opciones Adicionales */}
            {(ticketType === 'boleta_cliente' || ticketType === 'boleta_venta') && (
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-2">
                <label className="flex items-center justify-between text-xs font-bold text-stone-700 cursor-pointer">
                  <span>Código QR Fiscal SUNAT</span>
                  <input
                    type="checkbox"
                    checked={showQR}
                    onChange={(e) => setShowQR(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>
              </div>
            )}

            {/* Resumen Rápido */}
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-1.5 text-xs text-amber-950 font-bold">
              <div className="flex justify-between">
                <span className="text-amber-800">Total a Imprimir:</span>
                <span className="text-sm font-black text-amber-950">{formatMoney(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">Platos/Items:</span>
                <span>{filteredItems.length} producto(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-800">Tipografía:</span>
                <span className="text-emerald-700 font-black">Grande & Alta Legibilidad</span>
              </div>
            </div>
          </div>

          {/* Feedback de Impresión Directa */}
          {directFeedback && (
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              directFeedback.success ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              {directFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span className="flex-1">{directFeedback.message}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleDirectPrintEscPos}
              disabled={directPrinting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black rounded-2xl text-xs transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${directPrinting ? 'animate-spin' : ''}`} />
              <span>{directPrinting ? 'Enviando a Ticketera...' : '⚡ Imprimir Directo en Ticketera (ESC/POS)'}</span>
            </button>

            <button
              onClick={() => {
                handlePrint();
                if (onConfirmPrint) onConfirmPrint();
              }}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span>Imprimir por Diálogo de Windows / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 bg-transparent hover:bg-stone-100 text-stone-500 hover:text-stone-800 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>

        </div>

        {/* ── PANEL DERECHO: PREVISUALIZADOR TÉRMICO REAL (80mm / 58mm) ── */}
        <div className="flex-1 overflow-y-auto bg-stone-200/70 p-4 sm:p-6 rounded-3xl border border-stone-300 flex justify-center items-start custom-scrollbar">
          
          {/* TICKET PAPEL CONTINUO */}
          <div
            ref={componentRef}
            className="ticket-paper shadow-2xl transition-all duration-300"
            style={{
              width: paperWidth === '58mm' ? '56mm' : '78mm',
              maxWidth: paperWidth === '58mm' ? '56mm' : '78mm',
              backgroundColor: '#ffffff',
              padding: paperWidth === '58mm' ? '4mm 2.5mm' : '5mm 3.5mm',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: paperWidth === '58mm' ? '12.5px' : '14px',
              color: '#000000',
              lineHeight: '1.3',
              boxSizing: 'border-box',
              border: '1px solid #d1d5db',
              borderRadius: '2px',
            }}
          >
            
            {/* ═══ CABECERA FISCAL COMERCIAL CON LOGO ═══ */}
            <div style={{ textAlign: 'center', marginBottom: '3px' }}>
              <div style={{ padding: '2px 0 4px 0', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={logoSrc}
                  alt={displayCompanyName}
                  className="ticket-logo"
                  style={{
                    maxHeight: paperWidth === '58mm' ? '85px' : '105px',
                    maxWidth: paperWidth === '58mm' ? '52mm' : '72mm',
                    width: 'auto',
                    height: 'auto',
                    margin: '0 auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    const fallback = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';
                    if (e.currentTarget.src !== window.location.origin + fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                />
              </div>
              <div style={{ fontSize: paperWidth === '58mm' ? '13px' : '15px', fontWeight: '900', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: '1.15' }}>
                {displayCompanyName}
              </div>
              <div style={{ fontSize: paperWidth === '58mm' ? '10px' : '11px', fontWeight: '800', marginTop: '1px', textTransform: 'uppercase' }}>
                {businessSubtitle}
              </div>
              <div style={{ fontSize: paperWidth === '58mm' ? '9.5px' : '10.5px', marginTop: '1px', fontWeight: '700' }}>
                RUC: {businessRuc}
              </div>
              <div style={{ fontSize: paperWidth === '58mm' ? '9px' : '10px', marginTop: '1px', color: '#000', fontWeight: '600' }}>
                {businessAddress}
              </div>
              <div style={{ fontSize: paperWidth === '58mm' ? '9px' : '10px', marginTop: '1px', fontWeight: '700' }}>
                TEL: {businessPhone}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

            {/* ═══ MODO 1: BOLETA / FACTURA / PRE-CUENTA CLIENTE ═══ */}
            {(ticketType === 'boleta_cliente' || ticketType === 'boleta_venta') && (
              <>
                <div style={{ 
                  border: '1px solid #000', 
                  padding: '3px 1px', 
                  textAlign: 'center', 
                  fontWeight: '900', 
                  fontSize: paperWidth === '58mm' ? '10.5px' : '12px',
                  margin: '3px 0',
                  textTransform: 'uppercase'
                }}>
                  {customerDocType === 'RUC' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA'}
                  <div style={{ fontSize: paperWidth === '58mm' ? '11.5px' : '13px', fontWeight: '900', marginTop: '1px' }}>
                    {invoiceSeries} - {invoiceNumber}
                  </div>
                </div>

                <div style={{ fontSize: paperWidth === '58mm' ? '9.5px' : '10.5px', margin: '3px 0', lineHeight: '1.25', fontWeight: '600' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>FECHA:</strong> {formattedDate}</span>
                    <span><strong>HORA:</strong> {formattedTime}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>MESA:</strong> {order.tableNumber} {isDelivery ? '(DELIVERY)' : ''}</span>
                    <span><strong>ORDEN:</strong> #{displayOrderNo}</span>
                  </div>
                  <div><strong>ATENDIDO:</strong> {order.waiterName || "Cajero Principal"}</div>
                  
                  {customerDocNumber ? (
                    <div><strong>{customerDocType}:</strong> {customerDocNumber}</div>
                  ) : (
                    <div><strong>DOC. CLIENTE:</strong> SIN DOCUMENTO</div>
                  )}

                  {(customerName || order.dinerName) && (
                    <div><strong>CLIENTE:</strong> {(customerName || order.dinerName || '').toUpperCase()}</div>
                  )}

                  {isDelivery && order.deliveryAddress && (
                    <div><strong>DIRECCIÓN:</strong> {order.deliveryAddress}</div>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

                {/* Tabla de Productos Térmica */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', width: '14%', padding: '2px 0', fontWeight: '900' }}>CANT</th>
                      <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: '900' }}>DESCRIPCIÓN</th>
                      <th style={{ textAlign: 'right', width: '25%', padding: '2px 0', fontWeight: '900' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id + idx} style={{ borderBottom: '1px dotted #ccc' }}>
                        <td style={{ verticalAlign: 'top', padding: '2.5px 0', fontWeight: '900', fontSize: paperWidth === '58mm' ? '10.5px' : '11.5px' }}>
                          {item.quantity}
                        </td>
                        <td style={{ verticalAlign: 'top', padding: '2.5px 0' }}>
                          <div style={{ fontWeight: '800', textTransform: 'uppercase', lineHeight: '1.2', fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
                            {item.productName}
                          </div>
                          {item.quantity > 1 && (
                            <div style={{ fontSize: paperWidth === '58mm' ? '8.5px' : '9.5px', color: '#333', fontWeight: '700' }}>
                              {item.quantity} x S/ {item.price.toFixed(2)}
                            </div>
                          )}
                          {item.notes && (
                            <div style={{ fontSize: paperWidth === '58mm' ? '8.5px' : '9.5px', fontWeight: 'bold', color: '#111' }}>
                              * {item.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: '900', padding: '2.5px 0', fontSize: paperWidth === '58mm' ? '10px' : '11px', whiteSpace: 'nowrap' }}>
                          {(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

                {/* Discriminación de Impuestos & Totales */}
                <div style={{ fontSize: paperWidth === '58mm' ? '9.5px' : '10.5px', textAlign: 'right', lineHeight: '1.25', fontWeight: '700' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                    <span>OP. GRAVADA:</span>
                    <span>S/ {opGravada.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                    <span>I.G.V. (10.5%):</span>
                    <span>S/ {igv.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1.5px double #000', margin: '3px 0' }} />

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  fontSize: paperWidth === '58mm' ? '12.5px' : '14px', 
                  fontWeight: '900',
                  padding: '2px 0',
                  letterSpacing: '0.02em'
                }}>
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {totalAmount.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

                {/* Medios de Pago & Vuelto */}
                <div style={{ fontSize: paperWidth === '58mm' ? '9.5px' : '10.5px', margin: '2px 0', lineHeight: '1.25', fontWeight: '700' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>FORMA DE PAGO:</span>
                    <strong style={{ textTransform: 'uppercase', fontWeight: '900' }}>{paymentMethod}</strong>
                  </div>
                  {amountPaid !== undefined && amountPaid > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>IMPORTE RECIBIDO:</span>
                      <span>S/ {amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                  {changeDue !== undefined && changeDue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: paperWidth === '58mm' ? '10.5px' : '11.5px' }}>
                      <span>VUELTO:</span>
                      <span>S/ {changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

                {/* Código QR Fiscal SUNAT */}
                {showQR && (
                  <div className="qr-wrapper" style={{ textAlign: 'center', margin: '4px 0' }}>
                    <div style={{ display: 'inline-block', padding: '2px', background: '#fff' }}>
                      <QRCode
                        value={qrFiscalData}
                        size={paperWidth === '58mm' ? 75 : 95}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#333', marginTop: '1px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      Hash: {effectiveHash}
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'center', fontSize: paperWidth === '58mm' ? '9px' : '10px', marginTop: '3px', lineHeight: '1.2' }}>
                  <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>¡GRACIAS POR SU PREFERENCIA!</div>
                  <div style={{ marginTop: '1px', fontSize: paperWidth === '58mm' ? '8px' : '9px', color: '#444', fontWeight: '600' }}>
                    Representación impresa de Boleta Electrónica.
                  </div>
                  <div style={{ fontSize: paperWidth === '58mm' ? '8px' : '9px', color: '#444', fontWeight: '600' }}>
                    Consulte su documento en www.sunat.gob.pe
                  </div>
                </div>
              </>
            )}

            {/* ═══ MODO 2: COMANDA DE COCINA (TÉRMICO) ═══ */}
            {ticketType === 'comanda_cocina' && (
              <>
                <div style={{ 
                  border: '1.5px solid #000',
                  color: '#000',
                  background: '#fff',
                  padding: '3px 2px', 
                  textAlign: 'center', 
                  fontWeight: '900', 
                  fontSize: paperWidth === '58mm' ? '11px' : '13px',
                  margin: '3px 0',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  ★ COMANDA: {(stationName || 'GENERAL').toUpperCase()} ★
                </div>

                <div style={{ fontSize: paperWidth === '58mm' ? '9.5px' : '10.5px', margin: '3px 0', lineHeight: '1.25', fontWeight: '700' }}>
                  <div style={{ fontSize: paperWidth === '58mm' ? '13px' : '15px', fontWeight: '900', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '2px' }}>
                    MESA: {order.tableNumber} {isDelivery ? '(DELIVERY)' : ''}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>N° ORDEN:</strong> #{displayOrderNo}</span>
                    <span><strong>TANDA:</strong> #{batchNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>HORA:</strong> {formattedTime}</span>
                    <span><strong>FECHA:</strong> {formattedDate}</span>
                  </div>
                  <div><strong>MESERO:</strong> {order.waiterName || "Mesero"}</div>
                </div>

                <div style={{ borderTop: '1.5px dashed #000', margin: '3px 0' }} />

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: paperWidth === '58mm' ? '9.5px' : '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', width: '18%', padding: '2px 0', fontWeight: '900' }}>CANT</th>
                      <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: '900' }}>PRODUCTO / NOTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id + idx} style={{ borderBottom: '1px dashed #000' }}>
                        <td style={{ verticalAlign: 'top', padding: '3px 0', fontSize: paperWidth === '58mm' ? '11px' : '13px', fontWeight: '900' }}>
                          {item.quantity}x
                        </td>
                        <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                          <div style={{ fontSize: paperWidth === '58mm' ? '10px' : '11.5px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2' }}>
                            {item.productName}
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: paperWidth === '58mm' ? '8.5px' : '9.5px', fontWeight: 'bold', border: '1px solid #000', color: '#000', background: '#fff', padding: '1px 3px', marginTop: '2px', display: 'inline-block', borderRadius: '2px' }}>
                              ⚠️ NOTA: {item.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '1.5px dashed #000', margin: '3px 0' }} />

                <div style={{ textAlign: 'center', fontSize: paperWidth === '58mm' ? '9px' : '10.5px', fontWeight: '900', marginTop: '3px' }}>
                  *** DESPACHAR DE INMEDIATO ***
                </div>
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
