import React, { useState, useRef } from 'react';
import { Printer, Download, ChefHat, X } from 'lucide-react';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';
import { OrderItem, RestaurantOrder } from '../types';
import { useAppStore } from '../hooks/StoreContext';
import { format } from 'date-fns';

interface ThermalTicketProps {
  order: RestaurantOrder;
  itemsToPrint?: OrderItem[];
  ticketNumber?: string;
  batchNumber?: number;
  stationName?: string;
  onClose?: () => void;
}

export function ThermalTicket({
  order,
  itemsToPrint,
  ticketNumber = "000123",
  batchNumber = 1,
  stationName = "COCINA",
  onClose,
}: ThermalTicketProps) {
  const { settings, products } = useAppStore();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Variables de la comanda
  const items = itemsToPrint || order.items;
  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const companyName = (settings.companyName || 'PARADERO 104').toUpperCase();
  const displayOrderNo = order.id.replace(/\D/g, '').slice(-6) || ticketNumber;
  const logoSrc = "/LOGO COMANDA.png";

  const componentRef = useRef<HTMLDivElement>(null);

  // Lógica principal de impresión
  const handlePrint = () => {
    if (!componentRef.current) return;
    
    // Create a new window for printing to avoid iframe styling issues
    const printWindow = window.open('', '', 'width=400,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Ticket_${order.tableNumber}_${ticketNumber}</title>
            <style>
              body { margin: 0; padding: 0; background: white; }
            </style>
          </head>
          <body>
            ${componentRef.current.innerHTML}
            <script>
              // Wait for images (logo) to load before printing
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadThermalPDF = () => {
    // Si realmente necesitan el PDF, podemos invocar react-to-print o window.print de todas formas.
    // Por simplicidad, uniremos ambas opciones a la impresión nativa HTML que sí soporta guardar como PDF en Chrome.
    handlePrint();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-stone-900 rounded-3xl max-w-2xl w-full p-6 text-white border border-stone-800 shadow-2xl flex flex-col md:flex-row gap-6 my-auto">

        {/* ---- Panel de controles ---- */}
        <div className="flex-1 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-100">Ticket de {stationName}</h3>
                  <p className="text-xs text-stone-400">Térmica 80mm</p>
                </div>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Detalles */}
            <div className="mt-4 bg-stone-950/60 p-4 rounded-2xl border border-stone-800/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">Estación Destino:</span>
                <span className="font-bold text-amber-400 uppercase">{stationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Mesa / Ubicación:</span>
                <span className="font-bold text-white">{order.tableNumber}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <button
              onClick={handlePrint}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Printer className="w-5 h-5" />
              Imprimir en Ticketera
            </button>
            <button
              onClick={handleDownloadThermalPDF}
              disabled={isGeneratingPDF}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Download className="w-5 h-5" />
              {isGeneratingPDF ? 'Generando PDF...' : 'Descargar en PDF'}
            </button>
            {onClose && (
              <button onClick={onClose} className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white font-semibold rounded-xl text-xs transition">
                Cerrar sin Imprimir
              </button>
            )}
          </div>
        </div>

        {/* ---- Vista previa del TICKET (80mm style) ---- */}
        <div className="flex-1 flex justify-center items-start py-2">
          <div
            ref={componentRef}
            className="ticket-wrapper bg-white relative"
          >
            <style type="text/css">
              {`
                .ticket-wrapper {
                    width: 80mm;
                    margin: 0 auto;
                    padding: 5mm;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 12px;
                    color: #000;
                    box-sizing: border-box;
                    background: white;
                }
                .ticket-wrapper * {
                    box-sizing: border-box;
                }
                .ticket-wrapper .center {
                    text-align: center;
                }
                .ticket-wrapper .bold {
                    font-weight: bold;
                }
                .ticket-wrapper .line {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                .ticket-wrapper table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                .ticket-wrapper th {
                    text-align: left;
                    font-size: 11px;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                }
                .ticket-wrapper td {
                    padding: 4px 0;
                    vertical-align: top;
                }
                .ticket-wrapper .right {
                    text-align: right;
                }
                .ticket-wrapper .footer {
                    text-align: center;
                    margin-top: 10px;
                }
                .ticket-wrapper tr {
                    page-break-inside: avoid;
                }
                
                @media print {
                  @page {
                      size: 80mm auto;
                      margin: 0;
                  }
                  html, body {
                      width: 80mm;
                      height: auto;
                      margin: 0 !important;
                      padding: 0 !important;
                      background: white;
                  }
                  .ticket-wrapper {
                      width: 100% !important;
                      margin: 0 !important;
                      page-break-after: avoid;
                      page-break-before: avoid;
                  }
                  * {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                  }
                }
              `}
            </style>

            <div className="center" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <img src={logoSrc} alt="Logo" style={{ width: '60mm', maxWidth: '100%', height: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
            </div>
            
            <div className="center bold" style={{ fontSize: '16px', marginTop: '4px' }}>
              {companyName}
            </div>

            <div className="line"></div>

            <table>
              <tbody>
                <tr>
                  <td><b>Orden:</b></td>
                  <td className="right" style={{ color: 'red', fontWeight: 'bold' }}>{displayOrderNo}</td>
                </tr>
                <tr>
                  <td><b>Mesa:</b></td>
                  <td className="right">{order.tableNumber.toUpperCase()}</td>
                </tr>
                <tr>
                  <td><b>Mesero:</b></td>
                  <td className="right">{order.waiterName || 'SALA'}</td>
                </tr>
                <tr>
                  <td><b>Fecha:</b></td>
                  <td className="right">{formattedDate}</td>
                </tr>
                <tr>
                  <td><b>Hora:</b></td>
                  <td className="right">{formattedTime}</td>
                </tr>
                <tr>
                  <td><b>Personas:</b></td>
                  <td className="right">4</td>
                </tr>
              </tbody>
            </table>

            <div className="line"></div>

            <div className="center bold" style={{ fontSize: '13px' }}>
              ★ COMANDA DE {stationName.toUpperCase()} ★
            </div>

            <div className="line"></div>

            <table>
              <thead>
                <tr>
                  <th width="15%">Cant</th>
                  <th>Producto</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const pName = products?.find(p => p.id === item.productId)?.name || item.productName || 'PRODUCTO';
                  return (
                    <tr key={item.id + idx}>
                      <td><span className="bold">{item.quantity}</span></td>
                      <td>
                        <span className="bold" style={{ textTransform: 'uppercase' }}>{pName}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="line"></div>

            <div className="bold" style={{ fontSize: '11px' }}>OBSERVACIONES</div>
            <div style={{ marginTop: '6px' }}>
              {items.map((item, idx) => {
                if (!item.notes) return null;
                const pName = products?.find(p => p.id === item.productId)?.name || item.productName || 'PRODUCTO';
                return (
                  <div key={`obs-${idx}`} style={{ marginBottom: '4px', fontSize: '11px' }}>
                    • <b>{pName}:</b> {item.notes}
                  </div>
                );
              })}
            </div>

            <div className="line"></div>

            <div className="footer">
              <div className="center" style={{ marginBottom: '4px' }}>
                <ChefHat className="w-5 h-5 inline-block" style={{ verticalAlign: 'middle', marginRight: '4px', color: '#000' }} /> 
                <span className="bold">ENVIAR CUANDO ESTÉ LISTO</span>
              </div>
              <b>¡Gracias por su preferencia!</b>
              <br />
              {companyName} - BARRA CEVICHERA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
