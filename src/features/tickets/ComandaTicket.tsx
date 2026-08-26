import React, { useRef } from 'react';
import { RestaurantOrder } from "../../types";
import { useAppStore } from "../../hooks/StoreContext";
import { X, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  order: RestaurantOrder;
  stationName?: string;
  batchNumber?: number;
  onClose: () => void;
}

export default function ComandaTicket({ order, stationName = "COCINA", batchNumber = 1, onClose }: Props) {
  const { settings, products } = useAppStore();
  const componentRef = useRef<HTMLDivElement>(null);

  const isParadero = settings.companyName.toLowerCase().includes('paradero') || (settings.logoUrl && settings.logoUrl.includes('104')) || (settings.logoUrl && settings.logoUrl.includes('paradero'));
  const logoSrc = settings.logoUrl && settings.logoUrl !== '/icono.png' && settings.logoUrl !== '/logo-web.png' && !settings.logoUrl.includes('/assets/logos/')
    ? settings.logoUrl
    : (isParadero ? "/Logo/logo-paradero-104.png" : "/Logo/logo-lomas-grill.png");
  const displayCompanyName = isParadero ? "PARADERO 104" : (settings.companyName || "LAS LOMAS GRILL");
  const businessSubtitle = isParadero ? (settings.slogan || "BARRA CEVICHERA") : (settings.slogan || "RESTAURANTE & GRILL");

  const orderDate = new Date(order.createdAt || Date.now());
  const orderNo = order.id ? order.id.replace(/\D/g, '').slice(-6) : Math.floor(100000 + Math.random() * 900000).toString();
  const isDelivery = order.type === 'delivery' || order.tableNumber.startsWith('D-');

  const handlePrint = () => {
    if (!componentRef.current) return;

    const scrollHeightPx = componentRef.current.scrollHeight || 450;
    const calculatedHeightMm = Math.max(100, Math.ceil(scrollHeightPx * 0.264583) + 16);

    const printWindow = window.open('', '_blank', 'width=480,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Comanda_${order.tableNumber}_${orderNo}</title>
          <style>
            @page {
              size: 80mm ${calculatedHeightMm}mm;
              margin: 0mm !important;
            }
            @media print {
              html, body {
                width: 100% !important;
                max-width: 80mm !important;
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
                padding: 2mm 2.5mm !important;
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
              color: #000 !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 14.5px;
              font-weight: 600;
              line-height: 1.3;
              color: #000;
              background: #fff;
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 3mm 2mm;
            }
            .ticket-container {
              width: 100%;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .font-black { font-weight: 900; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .divider {
              border-top: 2.5px dashed #000;
              margin: 6px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 5px 0;
            }
            th, td {
              padding: 4px 0;
              vertical-align: top;
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

  // Filtrado de items por estación
  const filteredItems = stationName === "COCINA" || stationName === "General"
    ? order.items
    : order.items.filter(item => {
        const prod = products.find(p => p.id === item.productId);
        const itemStation = (item.station || prod?.station || '').toLowerCase();
        return itemStation.includes(stationName.toLowerCase());
      });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* Botones Flotantes Superiores */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <button
          onClick={handlePrint}
          className="h-11 px-6 rounded-2xl font-black bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer text-xs active:scale-95"
        >
          <Printer className="w-4 h-4" /> Imprimir Comanda Térmica (80mm)
        </button>
        <button
          onClick={onClose}
          className="w-11 h-11 bg-white/20 hover:bg-white/30 text-white rounded-2xl flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenedor del Ticket */}
      <div className="bg-stone-200/70 p-6 rounded-3xl border border-stone-300 shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar flex justify-center items-start">
        
        <div
          ref={componentRef}
          className="ticket-paper shadow-2xl bg-white"
          style={{
            width: '78mm',
            maxWidth: '78mm',
            padding: '5mm 3.5mm',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '14px',
            color: '#000',
            lineHeight: '1.3',
            boxSizing: 'border-box',
            border: '1px solid #d1d5db',
          }}
        >
          
          {/* Header con Logo */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <div style={{ padding: '2px 0 4px 0', display: 'flex', justifyContent: 'center' }}>
              <img
                src={logoSrc}
                alt={displayCompanyName}
                className="ticket-logo"
                style={{
                  maxHeight: '85px',
                  maxWidth: '72mm',
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
            <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.15' }}>
              {displayCompanyName}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '3px 0' }} />

          {/* Título de la Comanda */}
          <div style={{ 
            border: '1.5px solid #000',
            color: '#000',
            background: '#fff',
            padding: '3px 2px', 
            textAlign: 'center', 
            fontWeight: '900', 
            fontSize: '11.5px',
            margin: '2px 0',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            ★ COMANDA: {(stationName || 'GENERAL').toUpperCase()} ★
          </div>

          {/* Info de Mesa & Orden */}
          <div style={{ fontSize: '10px', margin: '3px 0', lineHeight: '1.25', fontWeight: '700' }}>
            <div style={{ fontSize: '13.5px', fontWeight: '900', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '2px' }}>
              MESA: {order.tableNumber} {isDelivery ? '(DELIVERY)' : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>N° ORDEN:</strong> #{orderNo}</span>
              <span><strong>TANDA:</strong> #{batchNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>HORA:</strong> {format(orderDate, 'HH:mm:ss')}</span>
              <span><strong>FECHA:</strong> {format(orderDate, 'dd/MM/yyyy')}</span>
            </div>
            <div><strong>MESERO:</strong> {order.waiterName || "Mesero"}</div>
            {order.dinerName && (
              <div><strong>CLIENTE:</strong> {order.dinerName}</div>
            )}
          </div>

          <div style={{ borderTop: '1.5px dashed #000', margin: '3px 0' }} />

          {/* Tabla de Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', width: '18%', padding: '2px 0', fontWeight: '900' }}>CANT</th>
                <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: '900' }}>PLATO / NOTA</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={item.id + idx} style={{ borderBottom: '1px dashed #000' }}>
                  <td style={{ verticalAlign: 'top', padding: '2.5px 0', fontSize: '11.5px', fontWeight: '900' }}>
                    {item.quantity}x
                  </td>
                  <td style={{ verticalAlign: 'top', padding: '2.5px 0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2' }}>
                      {item.productName}
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '8.5px', fontWeight: 'bold', border: '1px solid #000', color: '#000', background: '#fff', padding: '1px 3px', marginTop: '2px', display: 'inline-block', borderRadius: '2px' }}>
                        ⚠️ NOTA: {item.notes}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1.5px dashed #000', margin: '6px 0' }} />

          {/* Mensaje de Cierre */}
          <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '900', marginTop: '6px' }}>
            *** DESPACHAR DE INMEDIATO ***
          </div>

        </div>

      </div>

    </div>
  );
}
