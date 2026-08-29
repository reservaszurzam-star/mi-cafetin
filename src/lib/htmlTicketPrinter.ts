import { RestaurantOrder, Settings } from '../types';

export interface VisualTicketOptions {
  ticketType?: 'comanda_cocina' | 'boleta_cliente' | 'boleta_venta';
  stationName?: string;
  batchNumber?: number;
  customerName?: string;
  customerDocType?: string;
  customerDocNumber?: string;
  invoiceSeries?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  amountPaid?: number;
  changeDue?: number;
  paperWidth?: '80mm' | '58mm';
  showQR?: boolean;
}

/**
 * Genera el documento HTML idéntico al componente ThermalTicket con el logo oficial
 */
export function generateTicketHtml(
  order: RestaurantOrder,
  settings: Partial<Settings> = {},
  options: VisualTicketOptions = {}
): string {
  const paper = options.paperWidth || '80mm';
  const is58 = paper === '58mm';
  const widthMm = is58 ? '58mm' : '80mm';
  const type = options.ticketType || 'comanda_cocina';

  const isParadero = settings.companyName 
    ? settings.companyName.toLowerCase().includes('paradero') 
    : false;
  const logoSrc = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';
  const fullLogoUrl = typeof window !== 'undefined' ? `${window.location.origin}${logoSrc}` : logoSrc;

  const displayCompanyName = settings.companyName || (isParadero ? "PARADERO 104" : "LAS LOMAS GRILL");
  const businessRuc = settings.companyRuc || "10437453701";
  const businessAddress = settings.address || (isParadero 
    ? "Jr. Los Tordos 1009, San Juan de Lurigancho 15427, Perú" 
    : "Jr, Templo del Sol 589 urb, San Juan de Lurigancho 15427, Perú");
  const businessPhone = settings.phone || (isParadero ? "932208729" : "995881303/953034562");

  const now = new Date(order.createdAt || Date.now());
  const formattedDate = !isNaN(now.getTime()) 
    ? now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : new Date().toLocaleDateString('es-PE');
  const formattedTime = !isNaN(now.getTime())
    ? now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : new Date().toLocaleTimeString('es-PE');

  const orderNo = (order as any).dailyOrderNumber || (order as any).orderNumber || (order.id ? String(order.id).replace(/\D/g, '').slice(-4) || '0001' : '0001');
  const isDelivery = order.type === 'delivery';
  const station = (options.stationName || 'GENERAL').toUpperCase();
  const batch = options.batchNumber || 1;

  // Filtrado de items
  const items = Array.isArray(order.items) ? order.items : [];
  const filteredItems = (type === 'comanda_cocina' && options.stationName && options.stationName !== 'General' && options.stationName !== 'Todas' && options.stationName !== 'auto')
    ? items.filter(i => (i.station || 'Cocina & Parrilla').toLowerCase().includes(options.stationName!.toLowerCase()))
    : items;

  const totalAmount = Number(order.total ?? filteredItems.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0));
  const opGravada = totalAmount / 1.105;
  const igv = totalAmount - opGravada;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket - ${displayCompanyName}</title>
  <style>
    @page {
      size: ${widthMm} auto;
      margin: 0mm !important;
    }
    @media print {
      html, body {
        width: 100% !important;
        max-width: ${widthMm} !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
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
      }
      img.ticket-logo {
        max-height: ${is58 ? '78px' : '96px'} !important;
        max-width: ${is58 ? '52mm' : '72mm'} !important;
        display: block !important;
        margin: 0 auto 3px auto !important;
        object-fit: contain !important;
        filter: contrast(135%) grayscale(100%) !important;
        -webkit-filter: contrast(135%) grayscale(100%) !important;
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
      padding: 2mm 2mm;
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
      margin: 4px 0;
    }
    .divider-double {
      border-top: 1.5px double #000;
      margin: 4px 0;
    }
    .title-box {
      border: 1.5px solid #000;
      padding: 3px 2px;
      margin: 4px 0;
      text-align: center;
      font-size: ${is58 ? '11px' : '13px'};
      font-weight: 900;
      color: #000;
      background: #fff;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .mesa-header {
      font-size: ${is58 ? '13px' : '15px'};
      font-weight: 900;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: ${is58 ? '9.5px' : '10.5px'};
      line-height: 1.3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
      font-size: ${is58 ? '9.5px' : '11px'};
    }
    th, td {
      padding: 3px 0;
      vertical-align: top;
    }
    th {
      font-weight: 900;
      border-bottom: 1px solid #000;
    }
    tr.item-row {
      border-bottom: 1px dashed #000;
    }
    .item-qty {
      font-size: ${is58 ? '11px' : '13px'};
      font-weight: 900;
      width: 18%;
    }
    .item-name {
      font-size: ${is58 ? '10px' : '11.5px'};
      font-weight: 900;
      text-transform: uppercase;
    }
    .item-note {
      font-size: ${is58 ? '8.5px' : '9.5px'};
      font-weight: bold;
      border: 1px solid #000;
      padding: 1px 3px;
      margin-top: 2px;
      display: inline-block;
      border-radius: 2px;
    }
    .footer-msg {
      text-align: center;
      font-size: ${is58 ? '9px' : '10.5px'};
      font-weight: 900;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    
    <!-- 1. Encabezado con Logo Oficial -->
    <div class="text-center" style="margin-bottom: 4px;">
      <div style="padding: 2px 0 4px 0; display: flex; justify-content: center;">
        <img 
          src="${fullLogoUrl}" 
          alt="${displayCompanyName}" 
          class="ticket-logo"
          style="max-height: ${is58 ? '85px' : '105px'}; max-width: ${is58 ? '52mm' : '72mm'}; margin: 0 auto; display: block; object-fit: contain;" 
        />
      </div>
      <div style="font-size: ${is58 ? '13px' : '15px'}; font-weight: 900; letter-spacing: 0.02em; text-transform: uppercase; line-height: 1.15;">
        ${displayCompanyName}
      </div>
      <div style="font-size: ${is58 ? '9.5px' : '10.5px'}; margin-top: 2px; font-weight: 700;">
        RUC: ${businessRuc}
      </div>
      <div style="font-size: ${is58 ? '9px' : '10px'}; margin-top: 1px; font-weight: 600;">
        ${businessAddress}
      </div>
      <div style="font-size: ${is58 ? '9px' : '10px'}; margin-top: 1px; font-weight: 700;">
        TEL: ${businessPhone}
      </div>
    </div>

    <div class="divider"></div>

    ${type === 'comanda_cocina' ? `
      <!-- ═══ MODO COMANDA DE COCINA (IDÉNTICO A LA FOTO) ═══ -->
      <div class="title-box">
        ★ COMANDA: ${station} ★
      </div>

      <div style="margin: 3px 0; font-weight: 700;">
        <div class="mesa-header">
          MESA: ${order.tableNumber || 'S/N'} ${isDelivery ? '(DELIVERY)' : ''}
        </div>
        <div class="meta-row">
          <span><strong>N° ORDEN:</strong> #${orderNo}</span>
          <span><strong>TANDA:</strong> #${batch}</span>
        </div>
        <div class="meta-row">
          <span><strong>HORA:</strong> ${formattedTime}</span>
          <span><strong>FECHA:</strong> ${formattedDate}</span>
        </div>
        <div class="meta-row">
          <span><strong>MESERO:</strong> ${order.waiterName || 'Mesero'}</span>
        </div>
        ${order.dinerName || options.customerName ? `
          <div class="meta-row">
            <span><strong>CLIENTE:</strong> ${(order.dinerName || options.customerName || '').toUpperCase()}</span>
          </div>
        ` : ''}
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="text-align: left; width: 18%;">CANT</th>
            <th style="text-align: left;">PRODUCTO / NOTA</th>
          </tr>
        </thead>
        <tbody>
          ${filteredItems.map(item => `
            <tr class="item-row">
              <td class="item-qty">${item.quantity}x</td>
              <td>
                <div class="item-name">${item.productName}</div>
                ${item.notes ? `<div class="item-note">⚠️ NOTA: ${item.notes}</div>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider-double"></div>

      <div class="footer-msg">
        *** DESPACHAR DE INMEDIATO ***
      </div>
    ` : `
      <!-- ═══ MODO BOLETA / FACTURA / CLIENTE ═══ -->
      <div class="title-box">
        ${options.customerDocType === 'RUC' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA'}
        <div style="font-size: ${is58 ? '11.5px' : '13px'}; font-weight: 900; margin-top: 1px;">
          ${options.invoiceSeries || 'B001'} - ${options.invoiceNumber || orderNo}
        </div>
      </div>

      <div style="margin: 3px 0; font-weight: 600; font-size: ${is58 ? '9.5px' : '10.5px'};">
        <div class="meta-row">
          <span><strong>FECHA:</strong> ${formattedDate}</span>
          <span><strong>HORA:</strong> ${formattedTime}</span>
        </div>
        <div class="meta-row">
          <span><strong>MESA:</strong> ${order.tableNumber || '1'} ${isDelivery ? '(DELIVERY)' : ''}</span>
          <span><strong>ORDEN:</strong> #${orderNo}</span>
        </div>
        <div><strong>ATENDIDO:</strong> ${order.waiterName || 'Cajero Principal'}</div>
        ${options.customerDocNumber ? `<div><strong>${options.customerDocType || 'DNI'}:</strong> ${options.customerDocNumber}</div>` : ''}
        ${options.customerName || order.dinerName ? `<div><strong>CLIENTE:</strong> ${(options.customerName || order.dinerName || '').toUpperCase()}</div>` : ''}
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="text-align: left; width: 14%;">CANT</th>
            <th style="text-align: left;">DESCRIPCIÓN</th>
            <th style="text-align: right; width: 25%;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${filteredItems.map(item => `
            <tr style="border-bottom: 1px dotted #ccc;">
              <td style="font-weight: 900;">${item.quantity}</td>
              <td>
                <div style="font-weight: 800; text-transform: uppercase;">${item.productName}</div>
                ${item.notes ? `<div style="font-size: 8.5px; font-weight: bold;">* ${item.notes}</div>` : ''}
              </td>
              <td style="text-align: right; font-weight: 900;">${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <div style="text-align: right; font-weight: 700; font-size: ${is58 ? '9.5px' : '10.5px'};">
        <div class="meta-row"><span>OP. GRAVADA:</span><span>S/ ${opGravada.toFixed(2)}</span></div>
        <div class="meta-row"><span>I.G.V. (10.5%):</span><span>S/ ${igv.toFixed(2)}</span></div>
      </div>

      <div class="divider-double"></div>

      <div style="display: flex; justify-content: space-between; font-size: ${is58 ? '12.5px' : '14px'}; font-weight: 900; padding: 2px 0;">
        <span>TOTAL A PAGAR:</span>
        <span>S/ ${totalAmount.toFixed(2)}</span>
      </div>

      <div class="divider"></div>

      <div style="font-size: ${is58 ? '9.5px' : '10.5px'}; font-weight: 700;">
        <div class="meta-row"><span>FORMA DE PAGO:</span><strong class="uppercase">${options.paymentMethod || 'Efectivo'}</strong></div>
        ${options.amountPaid ? `<div class="meta-row"><span>IMPORTE RECIBIDO:</span><span>S/ ${Number(options.amountPaid).toFixed(2)}</span></div>` : ''}
        ${options.changeDue ? `<div class="meta-row" style="font-weight: 900;"><span>VUELTO:</span><span>S/ ${Number(options.changeDue).toFixed(2)}</span></div>` : ''}
      </div>

      <div class="divider"></div>

      <div class="footer-msg">
        <div>¡GRACIAS POR SU PREFERENCIA!</div>
        <div style="font-size: ${is58 ? '8px' : '9px'}; font-weight: 600; color: #444; margin-top: 1px;">
          Representación impresa de Boleta Electrónica.<br/>
          Consulte su documento en www.sunat.gob.pe
        </div>
      </div>
    `}

  </div>

  <script>
    window.onload = function() {
      window.focus();
      setTimeout(function() {
        window.print();
        window.close();
      }, 350);
    };
  </script>
</body>
</html>`;
}

/**
 * Dispara la impresión visual de alta resolución en la ticketera (con logo, marcos y estilos exactos)
 */
export function printVisualTicket(
  order: RestaurantOrder,
  settings: Partial<Settings> = {},
  options: VisualTicketOptions = {}
): boolean {
  try {
    const html = generateTicketHtml(order, settings, options);
    
    // Opción 1: Abrir ventana de impresión nativa
    const printWindow = window.open('', '_blank', 'width=450,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return true;
    }

    // Opción 2 Fallback: Iframe invisible
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 400);
      return true;
    }

    return false;
  } catch (err) {
    console.error("Error al imprimir ticket visual:", err);
    return false;
  }
}