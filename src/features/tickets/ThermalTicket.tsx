import React, { useState, useRef } from 'react';
import { 
  Printer, X, Scissors, CheckCircle2, QrCode, 
  FileText, ChefHat, Receipt, ArrowDown, Sparkles
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { OrderItem, RestaurantOrder, PaymentMethod } from "../../types";
import { useAppStore } from "../../hooks/StoreContext";
import { formatMoney } from '../../lib/formatters';

export type TicketType = 'boleta_cliente' | 'boleta_venta' | 'comanda_cocina' | 'reporte_ventas';

interface ThermalTicketProps {
  order: RestaurantOrder;
  itemsToPrint?: OrderItem[];
  ticketType?: TicketType;
  ticketNumber?: string;
  batchNumber?: number;
  stationName?: string;
  invoiceSeries?: string;
  invoiceNumber?: string;
  customerDocType?: "DNI" | "RUC" | "Sin Documento";
  customerDocNumber?: string;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  changeDue?: number;
  showQR?: boolean;
  paperWidth?: '80mm' | '58mm';
  salesReportData?: {
    date: string;
    time: string;
    orders: { id: string; table: string; waiter: string; guests: number; total: number }[];
    totalSales: number;
    totalOrders: number;
    totalGuests: number;
  };
  onClose?: () => void;
}

export function ThermalTicket({
  order,
  itemsToPrint,
  ticketType = "boleta_cliente",
  ticketNumber = "000185",
  batchNumber = 1,
  stationName = "COCINA",
  invoiceSeries = "B001",
  invoiceNumber = "00000185",
  customerDocType = "DNI",
  customerDocNumber,
  customerName,
  paymentMethod = "Efectivo",
  amountPaid,
  changeDue,
  showQR = true,
  paperWidth: initialPaperWidth = '80mm',
  salesReportData,
  onClose,
}: ThermalTicketProps) {
  const { settings } = useAppStore();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(initialPaperWidth);
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>("Todas");

  const componentRef = useRef<HTMLDivElement>(null);

  const isParadero = settings.companyName.toLowerCase().includes('paradero') || (settings.logoUrl && settings.logoUrl.includes('104')) || (settings.logoUrl && settings.logoUrl.includes('paradero'));
  const logoSrc = isParadero ? "/assets/logos/logo-104.png" : "/assets/logos/logo-lomas.png";
  const displayCompanyName = isParadero ? "PARADERO 104" : (settings.companyName || "LAS LOMAS GRILL");
  const businessSubtitle = isParadero ? "BARRA CEVICHERA & MARISCOS" : "RESTAURANTE & GRILL";
  const businessRuc = isParadero ? "20608934512" : "20601234567";
  const businessAddress = isParadero ? "Av. Próceres de la Independencia 1040, SJL - Lima" : "Av. Mangomarca 850, SJL - Lima";
  const businessPhone = "WhatsApp / Pedidos: 987-654-321";

  // Items filtering
  const allItems = itemsToPrint || order.items || [];
  const filteredItems = selectedStationFilter === "Todas"
    ? allItems
    : allItems.filter(i => (i.station || "").toLowerCase().includes(selectedStationFilter.toLowerCase()));

  const now = new Date(order.createdAt || Date.now());
  const formattedDate = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const displayOrderNo = order.id ? order.id.replace(/\D/g, '').slice(-6) || ticketNumber : ticketNumber;
  const isDelivery = order.type === 'delivery' || order.tableNumber.startsWith('D-');

  // Cálculos tributarios
  const totalAmount = filteredItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const opGravada = Number((totalAmount / 1.18).toFixed(2));
  const igv = Number((totalAmount - opGravada).toFixed(2));

  // Cadena QR Fiscal SUNAT
  const qrFiscalData = `${businessRuc}|${customerDocType === 'RUC' ? '01' : '03'}|${invoiceSeries}|${invoiceNumber}|${igv}|${totalAmount}|${formattedDate}|${customerDocType || '1'}|${customerDocNumber || '00000000'}|a8f9c2e1`;

  // Disparador de Impresión Nativa Térmica
  const handlePrint = () => {
    if (!componentRef.current) return;

    const scrollHeightPx = componentRef.current.scrollHeight || 500;
    const calculatedHeightMm = Math.max(100, Math.ceil(scrollHeightPx * 0.264583) + 12);

    const is58 = paperWidth === '58mm';
    const widthMm = is58 ? '58mm' : '80mm';

    const printWindow = window.open('', '_blank', 'width=450,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${ticketType}_${displayOrderNo}</title>
          <style>
            @page {
              size: ${widthMm} ${calculatedHeightMm}mm;
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
              .ticket-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 2mm 3mm !important;
                box-sizing: border-box !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
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
              font-size: ${is58 ? '11px' : '12.5px'};
              line-height: 1.25;
              color: #000;
              background: #fff;
              width: 100%;
              max-width: ${widthMm};
              margin: 0 auto;
              padding: 4mm 3mm;
            }
            .ticket-container {
              width: 100%;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .divider {
              border-top: 1px dashed #000;
              margin: 4px 0;
            }
            .divider-double {
              border-top: 2px dashed #000;
              margin: 6px 0;
            }
            .title-box {
              border: 1.5px solid #000;
              padding: 4px 2px;
              margin: 4px 0;
              text-align: center;
              font-size: ${is58 ? '12px' : '13.5px'};
              font-weight: 900;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
            }
            th, td {
              padding: 3px 0;
              vertical-align: top;
            }
            .qr-wrapper {
              text-align: center;
              margin: 6px auto;
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
              }, 250);
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
                  <h3 className="font-black text-base text-stone-900 leading-tight">Impresión Térmica</h3>
                  <p className="text-[11px] font-bold text-stone-400">Ajuste de Ancho 100%</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Ancho de Papel Térmico */}
            <div>
              <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                Ancho de Papel Térmico
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center ${
                    paperWidth === '80mm'
                      ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>80 mm</span>
                  <span className="text-[10px] opacity-80">Estándar (Epson / Bixolon)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer flex flex-col items-center ${
                    paperWidth === '58mm'
                      ? 'bg-amber-500 text-stone-950 border-amber-300 font-black shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>58 mm</span>
                  <span className="text-[10px] opacity-80">Portátil / Mini POS</span>
                </button>
              </div>
            </div>

            {/* Filtro de Estación para Comandas */}
            {ticketType === 'comanda_cocina' && (
              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                  Filtrar por Estación
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Todas", "Cocina", "Horno", "Barra", "Parrilla"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStationFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedStationFilter === st
                          ? 'bg-stone-900 text-amber-400 font-black'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Datos Resumen */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Mesa / Destino:</span>
                <span className="font-black text-stone-900">{order.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Total Comprobante:</span>
                <span className="font-black text-stone-900">S/ {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Medio de Pago:</span>
                <span className="font-bold text-amber-700">{paymentMethod}</span>
              </div>
            </div>

          </div>

          {/* Botones de Acción */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <button
              onClick={handlePrint}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-98"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimir Ticket Térmico</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
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
              fontSize: paperWidth === '58mm' ? '10.5px' : '12px',
              color: '#000000',
              lineHeight: '1.25',
              boxSizing: 'border-box',
              border: '1px solid #d1d5db',
              borderRadius: '2px',
            }}
          >
            
            {/* ═══ CABECERA FISCAL COMERCIAL CON LOGO ═══ */}
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <img
                src={logoSrc}
                alt={displayCompanyName}
                style={{
                  maxHeight: paperWidth === '58mm' ? '44px' : '54px',
                  maxWidth: paperWidth === '58mm' ? '48mm' : '65mm',
                  margin: '0 auto 4px auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div style={{ fontSize: paperWidth === '58mm' ? '14px' : '16px', fontWeight: '900', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {displayCompanyName}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '700', marginTop: '1px', textTransform: 'uppercase' }}>
                {businessSubtitle}
              </div>
              <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: '600' }}>
                RUC: {businessRuc}
              </div>
              <div style={{ fontSize: '9.5px', marginTop: '1px', color: '#222' }}>
                {businessAddress}
              </div>
              <div style={{ fontSize: '9.5px', marginTop: '1px', fontWeight: '600' }}>
                {businessPhone}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

            {/* ═══ MODO 1: BOLETA / FACTURA / PRE-CUENTA CLIENTE ═══ */}
            {(ticketType === 'boleta_cliente' || ticketType === 'boleta_venta') && (
              <>
                <div style={{ 
                  border: '1.5px solid #000', 
                  padding: '4px 2px', 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  fontSize: paperWidth === '58mm' ? '11px' : '12.5px',
                  margin: '4px 0',
                  textTransform: 'uppercase'
                }}>
                  {customerDocType === 'RUC' ? 'FACTURA DE VENTA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
                  <div style={{ fontSize: paperWidth === '58mm' ? '12px' : '14px', fontWeight: '900', marginTop: '1px' }}>
                    {invoiceSeries} - {invoiceNumber}
                  </div>
                </div>

                <div style={{ fontSize: '10px', margin: '4px 0', lineHeight: '1.3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>FECHA:</strong> {formattedDate}</span>
                    <span><strong>HORA:</strong> {formattedTime}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>MESA:</strong> {order.tableNumber} {isDelivery ? '(DELIVERY)' : ''}</span>
                    <span><strong>ORDEN:</strong> #{displayOrderNo}</span>
                  </div>
                  <div><strong>ATENDIDO POR:</strong> {order.waiterName || "Cajero Principal"}</div>
                  
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

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

                {/* Tabla de Productos Térmica */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #000' }}>
                      <th style={{ textAlign: 'left', width: '12%', padding: '2px 0', fontWeight: '900' }}>CT</th>
                      <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: '900' }}>DESCRIPCIÓN</th>
                      <th style={{ textAlign: 'right', width: '22%', padding: '2px 0', fontWeight: '900' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id + idx} style={{ borderBottom: '1px dotted #ccc' }}>
                        <td style={{ verticalAlign: 'top', padding: '3px 0', fontWeight: '900', fontSize: '11px' }}>
                          {item.quantity}
                        </td>
                        <td style={{ verticalAlign: 'top', padding: '3px 0' }}>
                          <div style={{ fontWeight: '700', textTransform: 'uppercase', lineHeight: '1.2' }}>
                            {item.productName}
                          </div>
                          {item.quantity > 1 && (
                            <div style={{ fontSize: '9px', color: '#555' }}>
                              {item.quantity} x S/ {item.price.toFixed(2)}
                            </div>
                          )}
                          {item.notes && (
                            <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#333' }}>
                              * {item.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: '900', padding: '3px 0', fontSize: '11px', whiteSpace: 'nowrap' }}>
                          {(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

                {/* Discriminación de Impuestos & Totales */}
                <div style={{ fontSize: '10.5px', textAlign: 'right', lineHeight: '1.3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                    <span>OP. GRAVADA:</span>
                    <span>S/ {opGravada.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                    <span>I.G.V. (18%):</span>
                    <span>S/ {igv.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #000', margin: '4px 0' }} />

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  fontSize: paperWidth === '58mm' ? '13px' : '15px', 
                  fontWeight: '900',
                  padding: '2px 0'
                }}>
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {totalAmount.toFixed(2)}</span>
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

                {/* Medios de Pago & Vuelto */}
                <div style={{ fontSize: '10px', margin: '3px 0', lineHeight: '1.3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>FORMA DE PAGO:</span>
                    <strong style={{ textTransform: 'uppercase' }}>{paymentMethod}</strong>
                  </div>
                  {amountPaid !== undefined && amountPaid > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>IMPORTE RECIBIDO:</span>
                      <span>S/ {amountPaid.toFixed(2)}</span>
                    </div>
                  )}
                  {changeDue !== undefined && changeDue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900' }}>
                      <span>VUELTO:</span>
                      <span>S/ {changeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

                {/* Código QR Fiscal SUNAT */}
                {showQR && (
                  <div className="qr-wrapper" style={{ textAlign: 'center', margin: '6px 0' }}>
                    <div style={{ display: 'inline-block', padding: '2px', background: '#fff' }}>
                      <QRCode
                        value={qrFiscalData}
                        size={paperWidth === '58mm' ? 85 : 105}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#555', marginTop: '2px', fontFamily: 'monospace' }}>
                      Hash: a8f9c2e1b4d093fe
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'center', fontSize: '9.5px', marginTop: '4px', lineHeight: '1.25' }}>
                  <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>¡GRACIAS POR SU PREFERENCIA!</div>
                  <div style={{ marginTop: '2px', fontSize: '8px', color: '#555' }}>
                    Representación impresa de la Boleta de Venta Electrónica.
                  </div>
                  <div style={{ fontSize: '8px', color: '#555' }}>
                    Consulte su documento en www.sunat.gob.pe
                  </div>
                </div>
              </>
            )}

            {/* ═══ MODO 2: COMANDA DE COCINA (TÉRMICO) ═══ */}
            {ticketType === 'comanda_cocina' && (
              <>
                <div style={{ 
                  background: '#000',
                  color: '#fff',
                  padding: '5px 3px', 
                  textAlign: 'center', 
                  fontWeight: '900', 
                  fontSize: paperWidth === '58mm' ? '13px' : '15px',
                  margin: '3px 0',
                  letterSpacing: '0.05em'
                }}>
                  ★ COMANDA: {stationName.toUpperCase()} ★
                </div>

                <div style={{ fontSize: '11px', margin: '4px 0', lineHeight: '1.3' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '2px' }}>
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

                <div style={{ borderTop: '2px dashed #000', margin: '4px 0' }} />

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #000' }}>
                      <th style={{ textAlign: 'left', width: '15%', padding: '2px 0', fontWeight: '900' }}>CANT</th>
                      <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: '900' }}>PRODUCTO / NOTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id + idx} style={{ borderBottom: '1px dashed #000' }}>
                        <td style={{ verticalAlign: 'top', padding: '4px 0', fontSize: '16px', fontWeight: '900' }}>
                          {item.quantity}
                        </td>
                        <td style={{ verticalAlign: 'top', padding: '4px 0' }}>
                          <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2' }}>
                            {item.productName}
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: '10.5px', fontWeight: 'bold', background: '#000', color: '#fff', padding: '2px 4px', marginTop: '2px', display: 'inline-block', borderRadius: '2px' }}>
                              ⚠️ NOTA: {item.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '2px dashed #000', margin: '6px 0' }} />

                <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }}>
                  *** DESPACHAR DE INMEDIATO ***
                </div>
              </>
            )}

            {/* ═══ MODO 3: REPORTE DE VENTAS (TÉRMICO) ═══ */}
            {ticketType === 'reporte_ventas' && (
              <>
                <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '13px', margin: '4px 0' }}>
                  REPORTE DE VENTAS (TÉRMICO)
                </div>
                <div style={{ fontSize: '10px', textAlign: 'center' }}>
                  FECHA: {salesReportData?.date || formattedDate} | HORA: {salesReportData?.time || formattedTime}
                </div>
                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

                <div style={{ fontSize: '10.5px', lineHeight: '1.3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>TOTAL VENTAS:</span>
                    <strong>S/ {(salesReportData?.totalSales || totalAmount).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ÓRDENES ATENDIDAS:</span>
                    <span>{salesReportData?.totalOrders || 1}</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
                <div style={{ textAlign: 'center', fontSize: '9.5px', fontWeight: 'bold' }}>
                  CIERRE DE CAJA POS
                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
