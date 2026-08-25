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
    const calculatedHeightMm = Math.max(100, Math.ceil(scrollHeightPx * 0.264583) + 12);

    const printWindow = window.open('', '_blank', 'width=450,height=800');
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
              font-size: 12px;
              line-height: 1.25;
              color: #000;
              background: #fff;
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 4mm 3mm;
            }
            .ticket-container {
              width: 100%;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 4px 0;
            }
            th, td {
              padding: 3px 0;
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Botones de acción */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={onClose}
          className="h-11 px-5 rounded-2xl font-bold bg-white text-stone-800 hover:bg-stone-100 flex items-center gap-2 transition shadow-md cursor-pointer text-xs"
        >
          <X className="w-4 h-4" /> Cancelar
        </button>
        <button
          onClick={handlePrint}
          className="h-11 px-6 rounded-2xl font-black bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer text-xs active:scale-95"
        >
          <Printer className="w-4 h-4" /> Imprimir Comanda Térmica (80mm)
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
            fontSize: '12px',
            color: '#000',
            lineHeight: '1.25',
            boxSizing: 'border-box',
            border: '1px solid #d1d5db',
          }}
        >
          
          {/* Header con Logo */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ padding: '2px 0 6px 0', display: 'flex', justifyContent: 'center' }}>
              <img
                src={logoSrc}
                alt={displayCompanyName}
                style={{
                  maxHeight: '52px',
                  maxWidth: '65mm',
                  margin: '0 auto',
                  display: 'block',
                  objectFit: 'contain',
                  filter: 'contrast(115%) brightness(95%)',
                }}
                onError={(e) => {
                  const fallback = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';
                  if (e.currentTarget.src !== window.location.origin + fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
            </div>
            <div style={{ fontSize: '15px', fontWeight: '900', textTransform: 'uppercase' }}>
              {displayCompanyName}
            </div>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
              {businessSubtitle}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

          {/* Título de la Comanda */}
          <div style={{ 
            background: '#000',
            color: '#fff',
            padding: '5px 3px', 
            textAlign: 'center', 
            fontWeight: '900', 
            fontSize: '14px',
            margin: '3px 0',
            letterSpacing: '0.05em'
          }}>
            ★ COMANDA: {stationName.toUpperCase()} ★
          </div>

          {/* Info de Mesa & Orden */}
          <div style={{ fontSize: '11px', margin: '4px 0', lineHeight: '1.3' }}>
            <div style={{ fontSize: '16px', fontWeight: '900', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '2px' }}>
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

          <div style={{ borderTop: '2px dashed #000', margin: '4px 0' }} />

          {/* Tabla de Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #000' }}>
                <th style={{ textAlign: 'left', width: '15%', padding: '2px 0', fontWeight: '900' }}>CANT</th>
                <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: '900' }}>PLATO / NOTA</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id + idx} style={{ borderBottom: '1px dashed #000' }}>
                  <td style={{ verticalAlign: 'top', padding: '4px 0', fontSize: '16px', fontWeight: '900' }}>
                    {item.quantity}
                  </td>
                  <td style={{ verticalAlign: 'top', padding: '4px 0' }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2' }}>
                      {products.find(p => p.id === item.productId)?.name || item.productName}
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

        </div>

      </div>
    </div>
  );
}
