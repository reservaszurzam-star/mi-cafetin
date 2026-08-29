/**
 * Generador Binario de Comandos ESC/POS para Node.js
 * Compatible con impresoras térmicas Bienex, Epson, Xprinter, etc.
 */

// Comandos ESC/POS estándar
const ESC = 0x1B;
const GS = 0x1D;

export const ESC_POS_COMMANDS = {
  // Inicialización
  INIT: Buffer.from([ESC, 0x40]), // ESC @
  
  // Alineación
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([ESC, 0x61, 0x02]),
  
  // Estilos de texto
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),
  UNDERLINE_ON: Buffer.from([ESC, 0x2D, 0x01]),
  UNDERLINE_OFF: Buffer.from([ESC, 0x2D, 0x00]),
  INVERT_ON: Buffer.from([GS, 0x42, 0x01]),
  INVERT_OFF: Buffer.from([GS, 0x42, 0x00]),
  
  // Tamaño de texto (GS ! n)
  TEXT_NORMAL: Buffer.from([GS, 0x21, 0x00]),
  TEXT_DOUBLE_HEIGHT: Buffer.from([GS, 0x21, 0x01]),
  TEXT_DOUBLE_WIDTH: Buffer.from([GS, 0x21, 0x10]),
  TEXT_DOUBLE_BOTH: Buffer.from([GS, 0x21, 0x11]),
  TEXT_TRIPLE_HEIGHT: Buffer.from([GS, 0x21, 0x02]),
  TEXT_TRIPLE_BOTH: Buffer.from([GS, 0x21, 0x22]),

  // Codepage CP858 / CP437 (para español: ñ, á, é, í, ó, ú, °)
  CODEPAGE_CP858: Buffer.from([ESC, 0x74, 19]), // CP858 (Multilingual con Euro)
  CODEPAGE_CP437: Buffer.from([ESC, 0x74, 0]),  // CP437 (USA Estándar)

  // Espaciado entre líneas
  LINE_SPACING_DEFAULT: Buffer.from([ESC, 0x32]),
  LINE_SPACING_SET: (n: number) => Buffer.from([ESC, 0x33, n]),

  // Avance y corte
  FEED_LINES: (n: number) => Buffer.from([ESC, 0x64, n]),
  CUT_FULL: Buffer.from([GS, 0x56, 0x00]),
  CUT_PARTIAL: Buffer.from([GS, 0x56, 0x01]),
  CUT_FEED: Buffer.from([GS, 0x56, 0x42, 0x03]), // Avance 3 líneas y corte parcial

  // Apertura de cajón de dinero (Pin 2)
  OPEN_DRAWER: Buffer.from([ESC, 0x70, 0x00, 0x19, 0xFA]),
  
  // Beep / Zumbador
  BEEP: Buffer.from([ESC, 0x42, 0x02, 0x02]), // 2 beeps
};

/**
 * Mapeo de caracteres latinos a CP858/CP437 para soporte en español
 */
function encodeSpanishText(text: string): Buffer {
  const charMap: Record<string, number> = {
    'á': 0xA0, 'é': 0x82, 'í': 0xA1, 'ó': 0xA2, 'ú': 0xA3,
    'Á': 0x41, 'É': 0x90, 'Í': 0x49, 'Ó': 0x4F, 'Ú': 0x55,
    'ñ': 0xA4, 'Ñ': 0xA5,
    'ü': 0x81, 'Ü': 0x9A,
    '¿': 0xA8, '¡': 0xAD,
    'º': 0xA7, 'ª': 0xA6,
    '°': 0xF8,
  };

  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (charMap[char] !== undefined) {
      bytes.push(charMap[char]);
    } else {
      const code = char.charCodeAt(0);
      if (code < 128) {
        bytes.push(code);
      } else {
        bytes.push(0x3F); // '?'
      }
    }
  }
  return Buffer.from(bytes);
}

export class EscPosBuilder {
  private chunks: Buffer[] = [];
  private paperWidth: '80mm' | '58mm' = '80mm';
  private maxColumns: number = 48; // 80mm = 48 cols estándar (Font A)

  constructor(paperWidth: '80mm' | '58mm' = '80mm') {
    this.paperWidth = paperWidth;
    this.maxColumns = paperWidth === '58mm' ? 32 : 48;
    this.init();
  }

  public init(): this {
    this.chunks.push(ESC_POS_COMMANDS.INIT);
    this.chunks.push(ESC_POS_COMMANDS.CODEPAGE_CP858);
    this.chunks.push(ESC_POS_COMMANDS.LINE_SPACING_DEFAULT);
    return this;
  }

  public raw(buffer: Buffer): this {
    this.chunks.push(buffer);
    return this;
  }

  public alignLeft(): this {
    this.chunks.push(ESC_POS_COMMANDS.ALIGN_LEFT);
    return this;
  }

  public alignCenter(): this {
    this.chunks.push(ESC_POS_COMMANDS.ALIGN_CENTER);
    return this;
  }

  public alignRight(): this {
    this.chunks.push(ESC_POS_COMMANDS.ALIGN_RIGHT);
    return this;
  }

  public bold(on: boolean = true): this {
    this.chunks.push(on ? ESC_POS_COMMANDS.BOLD_ON : ESC_POS_COMMANDS.BOLD_OFF);
    return this;
  }

  public underline(on: boolean = true): this {
    this.chunks.push(on ? ESC_POS_COMMANDS.UNDERLINE_ON : ESC_POS_COMMANDS.UNDERLINE_OFF);
    return this;
  }

  public invert(on: boolean = true): this {
    this.chunks.push(on ? ESC_POS_COMMANDS.INVERT_ON : ESC_POS_COMMANDS.INVERT_OFF);
    return this;
  }

  public size(size: 'normal' | 'double_height' | 'double_width' | 'double' | 'triple'): this {
    switch (size) {
      case 'double_height':
        this.chunks.push(ESC_POS_COMMANDS.TEXT_DOUBLE_HEIGHT);
        break;
      case 'double_width':
        this.chunks.push(ESC_POS_COMMANDS.TEXT_DOUBLE_WIDTH);
        break;
      case 'double':
        this.chunks.push(ESC_POS_COMMANDS.TEXT_DOUBLE_BOTH);
        break;
      case 'triple':
        this.chunks.push(ESC_POS_COMMANDS.TEXT_TRIPLE_BOTH);
        break;
      default:
        this.chunks.push(ESC_POS_COMMANDS.TEXT_NORMAL);
        break;
    }
    return this;
  }

  public text(str: string): this {
    this.chunks.push(encodeSpanishText(str));
    return this;
  }

  public textLine(str: string = ''): this {
    this.text(str);
    this.chunks.push(Buffer.from('\n'));
    return this;
  }

  public feed(lines: number = 1): this {
    this.chunks.push(ESC_POS_COMMANDS.FEED_LINES(lines));
    return this;
  }

  public divider(char: string = '-'): this {
    const line = char.repeat(this.maxColumns);
    return this.textLine(line);
  }

  public doubleDivider(): this {
    return this.divider('=');
  }

  public dashedDivider(): this {
    return this.divider('-');
  }

  /**
   * Imprime dos columnas alineadas a los extremos (Izquierda y Derecha)
   */
  public twoColumns(left: string, right: string, bold: boolean = false): this {
    if (bold) this.bold(true);
    const spaceCount = this.maxColumns - (left.length + right.length);
    if (spaceCount > 0) {
      const line = left + ' '.repeat(spaceCount) + right;
      this.textLine(line);
    } else {
      this.textLine(left);
      this.alignRight();
      this.textLine(right);
      this.alignLeft();
    }
    if (bold) this.bold(false);
    return this;
  }

  /**
   * Imprime columnas formateadas en tabla (Cant, Descripción, Total opcional)
   */
  public tableRow(qty: string, desc: string, total?: string): this {
    const qtyWidth = this.paperWidth === '58mm' ? 4 : 5;
    const totalWidth = total !== undefined ? (this.paperWidth === '58mm' ? 8 : 10) : 0;
    const descWidth = this.maxColumns - qtyWidth - totalWidth;

    const formattedQty = (qty + ' '.repeat(qtyWidth)).slice(0, qtyWidth);
    const formattedTotal = total !== undefined ? (' '.repeat(totalWidth) + total).slice(-totalWidth) : '';
    
    if (desc.length <= descWidth) {
      const formattedDesc = (desc + ' '.repeat(descWidth)).slice(0, descWidth);
      this.textLine(formattedQty + formattedDesc + formattedTotal);
    } else {
      const firstLineDesc = desc.slice(0, descWidth);
      this.textLine(formattedQty + firstLineDesc + formattedTotal);
      
      let remaining = desc.slice(descWidth);
      while (remaining.length > 0) {
        const nextChunk = remaining.slice(0, descWidth);
        remaining = remaining.slice(descWidth);
        this.textLine(' '.repeat(qtyWidth) + nextChunk);
      }
    }
    return this;
  }

  public beep(): this {
    this.chunks.push(ESC_POS_COMMANDS.BEEP);
    return this;
  }

  public cut(partial: boolean = true): this {
    this.feed(3);
    this.chunks.push(partial ? ESC_POS_COMMANDS.CUT_FEED : ESC_POS_COMMANDS.CUT_FULL);
    return this;
  }

  public openCashDrawer(): this {
    this.chunks.push(ESC_POS_COMMANDS.OPEN_DRAWER);
    return this;
  }

  public build(): Buffer {
    return Buffer.concat(this.chunks);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLAS DE TICKETS ESC/POS
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketHeaderInfo {
  companyName: string;
  slogan?: string;
  ruc?: string;
  address?: string;
  phone?: string;
}

export interface ComandaItem {
  quantity: number;
  productName: string;
  notes?: string;
  station?: string;
}

export interface KitchenTicketPayload {
  header: TicketHeaderInfo;
  station: string;
  printerName?: string;
  orderNumber: string;
  tableNumber: string;
  orderType: 'salón' | 'delivery' | 'para_llevar' | 'venta_libre';
  waiterName?: string;
  dinerName?: string;
  batchNumber: number;
  date: string;
  items: ComandaItem[];
  paperWidth?: '80mm' | '58mm';
}

export interface TestTicketPayload {
  printerName: string;
  ipAddress: string;
  port: number;
  station: string;
  paperWidth?: '80mm' | '58mm';
  companyName: string;
  latencyMs?: number;
}

/**
 * Genera el ticket ESC/POS de prueba de diagnóstico
 */
export function buildTestTicketEscPos(payload: TestTicketPayload): Buffer {
  const paper = payload.paperWidth || '80mm';
  const b = new EscPosBuilder(paper);

  b.alignCenter()
   .bold(true)
   .size('double')
   .textLine(payload.companyName.toUpperCase())
   .size('normal')
   .textLine('DIAGNÓSTICO DE IMPRESIÓN ESC/POS')
   .bold(false)
   .textLine(new Date().toLocaleString('es-PE'))
   .doubleDivider();

  b.alignLeft()
   .bold(true)
   .textLine(`IMPRESORA: ${payload.printerName}`)
   .textLine(`ESTACIÓN : ${payload.station.toUpperCase()}`)
   .textLine(`RED IP   : ${payload.ipAddress}:${payload.port}`)
   .textLine(`PAPEL    : ${paper}`)
   .textLine(`LATENCIA : ${payload.latencyMs !== undefined ? `${payload.latencyMs} ms` : 'OK (Directo)'}`)
   .dashedDivider();

  b.alignCenter()
   .bold(true)
   .size('double_height')
   .textLine('★ CONEXIÓN EXITOSA ★')
   .size('normal')
   .bold(false)
   .feed(1)
   .textLine('El socket TCP 9100 y el protocolo')
   .textLine('ESC/POS responden correctamente.')
   .feed(1)
   .divider('*')
   .textLine('SISTEMA MI CAFETÍN - BIENEX OK')
   .beep()
   .cut(true);

  return b.build();
}

/**
 * Genera el ticket ESC/POS de Comanda de Cocina para una estación
 */
export function buildKitchenTicketEscPos(payload: KitchenTicketPayload): Buffer {
  const paper = payload.paperWidth || '80mm';
  const b = new EscPosBuilder(paper);

  const company = payload.header.companyName || 'PARADERO 104';
  const isParadero = company.toLowerCase().includes('paradero');
  const ruc = payload.header.ruc || '10437453701';
  const address = payload.header.address || (isParadero 
    ? "Jr. Los Tordos 1009, San Juan de Lurigancho 15427, Perú" 
    : "Jr, Templo del Sol 589 urb, San Juan de Lurigancho 15427, Perú");
  const phone = payload.header.phone || (isParadero ? "932208729" : "995881303/953034562");

  // 1. Cabecera Institucional
  b.alignCenter()
   .bold(true)
   .size('double')
   .textLine(company.toUpperCase())
   .size('normal')
   .bold(false)
   .textLine(`RUC: ${ruc}`)
   .textLine(address)
   .textLine(`TEL: ${phone}`);

  if (payload.header.slogan) {
    b.textLine(payload.header.slogan.toUpperCase());
  }

  b.dashedDivider();

  // 2. Banner llamativo de Comanda de Estación
  b.alignCenter()
   .bold(true)
   .size('double')
   .textLine(`★ COMANDA: ${(payload.station || 'COCINA').toUpperCase()} ★`)
   .size('normal')
   .bold(false);

  b.doubleDivider();

  // 3. Información destacada del pedido / mesa
  b.alignLeft()
   .bold(true)
   .size('double_height')
   .textLine(`MESA: ${payload.tableNumber} ${payload.orderType === 'delivery' ? '(DELIVERY)' : ''}`)
   .size('normal')
   .bold(false);

  b.twoColumns(`N° ORDEN: #${payload.orderNumber}`, `TANDA: #${payload.batchNumber}`);
  b.twoColumns(`HORA: ${payload.date.split(' ')[1] || ''}`, `FECHA: ${payload.date.split(' ')[0]}`);
  
  if (payload.waiterName) {
    b.textLine(`MESERO: ${payload.waiterName}`);
  }
  if (payload.dinerName) {
    b.textLine(`CLIENTE: ${payload.dinerName.toUpperCase()}`);
  }

  b.dashedDivider();

  // 4. Encabezado de la lista de platos
  b.bold(true);
  if (paper === '80mm') {
    b.textLine('CANT  PRODUCTO / OBSERVACIÓN');
  } else {
    b.textLine('CANT  PRODUCTO / NOTA');
  }
  b.bold(false);
  b.dashedDivider();

  // 5. Lista de platos
  payload.items.forEach((item) => {
    b.bold(true)
     .size('double_height')
     .textLine(`${item.quantity}x ${item.productName.toUpperCase()}`)
     .size('normal')
     .bold(false);

    if (item.notes && item.notes.trim()) {
      b.bold(true)
       .textLine(`   ⚠️ NOTA: ${item.notes.toUpperCase()}`)
       .bold(false);
    }
    b.dashedDivider();
  });

  // 6. Pie de Comanda
  b.alignCenter()
   .bold(true)
   .textLine('*** DESPACHAR DE INMEDIATO ***')
   .beep()
   .cut(true);

  return b.build();
}

export interface ReceiptTicketPayload {
  header: TicketHeaderInfo;
  orderNumber: string;
  tableNumber: string;
  orderType: 'salón' | 'delivery' | 'para_llevar' | 'venta_libre';
  waiterName?: string;
  dinerName?: string;
  customerName?: string;
  customerDocType?: string;
  customerDocNumber?: string;
  invoiceSeries?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  amountPaid?: number;
  changeDue?: number;
  date: string;
  items: { quantity: number; productName: string; price: number; notes?: string }[];
  total: number;
  paperWidth?: '80mm' | '58mm';
}

/**
 * Genera el ticket ESC/POS de Boleta / Factura / Pre-cuenta para clientes
 */
export function buildReceiptTicketEscPos(payload: ReceiptTicketPayload): Buffer {
  const paper = payload.paperWidth || '80mm';
  const b = new EscPosBuilder(paper);

  const company = payload.header.companyName || 'PARADERO 104';
  const isParadero = company.toLowerCase().includes('paradero');
  const ruc = payload.header.ruc || '10437453701';
  const address = payload.header.address || (isParadero 
    ? "Jr. Los Tordos 1009, San Juan de Lurigancho 15427, Perú" 
    : "Jr, Templo del Sol 589 urb, San Juan de Lurigancho 15427, Perú");
  const phone = payload.header.phone || (isParadero ? "932208729" : "995881303/953034562");

  // 1. Cabecera Institucional
  b.alignCenter()
   .bold(true)
   .size('double')
   .textLine(company.toUpperCase())
   .size('normal')
   .bold(false)
   .textLine(`RUC: ${ruc}`)
   .textLine(address)
   .textLine(`TEL: ${phone}`);

  if (payload.header.slogan) {
    b.textLine(payload.header.slogan.toUpperCase());
  }

  b.dashedDivider();

  // 2. Tipo de Comprobante / Título
  const docTitle = payload.customerDocType === 'RUC' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA';
  const seriesNum = `${payload.invoiceSeries || 'B001'} - ${payload.invoiceNumber || payload.orderNumber}`;

  b.alignCenter()
   .bold(true)
   .size('double_height')
   .textLine(docTitle)
   .textLine(seriesNum)
   .size('normal')
   .bold(false);

  b.dashedDivider();

  // 3. Datos del pedido
  b.alignLeft()
   .bold(true)
   .textLine(`MESA: ${payload.tableNumber} ${payload.orderType === 'delivery' ? '(DELIVERY)' : ''}`)
   .bold(false);

  b.twoColumns(`FECHA: ${payload.date.split(' ')[0]}`, `HORA: ${payload.date.split(' ')[1] || ''}`);
  b.twoColumns(`ORDEN: #${payload.orderNumber}`, `ATENDIÓ: ${payload.waiterName || 'Caja'}`);

  if (payload.customerDocNumber) {
    b.textLine(`${payload.customerDocType || 'DOC'}: ${payload.customerDocNumber}`);
  }
  if (payload.customerName || payload.dinerName) {
    b.textLine(`CLIENTE: ${(payload.customerName || payload.dinerName || '').toUpperCase()}`);
  }

  b.doubleDivider();

  // 4. Tabla de items
  b.bold(true);
  b.tableRow('CANT', 'DESCRIPCIÓN', 'TOTAL');
  b.bold(false);
  b.dashedDivider();

  payload.items.forEach(item => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    b.bold(true)
     .tableRow(`${item.quantity}x`, item.productName.toUpperCase(), itemTotal)
     .bold(false);

    if (item.notes && item.notes.trim()) {
      b.textLine(`   * ${item.notes.toUpperCase()}`);
    }
  });

  b.dashedDivider();

  // 5. Totales e impuestos
  const opGravada = (payload.total / 1.105).toFixed(2);
  const igv = (payload.total - parseFloat(opGravada)).toFixed(2);

  b.twoColumns('OP. GRAVADA:', `S/ ${opGravada}`);
  b.twoColumns('I.G.V. (10.5%):', `S/ ${igv}`);

  b.doubleDivider();

  // 6. Total a pagar GRANDE
  b.alignCenter()
   .bold(true)
   .size('double')
   .textLine(`TOTAL: S/ ${payload.total.toFixed(2)}`)
   .size('normal')
   .bold(false);

  b.dashedDivider();

  // 7. Forma de pago
  if (payload.paymentMethod) {
    b.twoColumns('FORMA DE PAGO:', payload.paymentMethod.toUpperCase(), true);
  }
  if (payload.amountPaid && payload.amountPaid > 0) {
    b.twoColumns('IMPORTE RECIBIDO:', `S/ ${payload.amountPaid.toFixed(2)}`);
  }
  if (payload.changeDue && payload.changeDue > 0) {
    b.twoColumns('VUELTO:', `S/ ${payload.changeDue.toFixed(2)}`, true);
  }

  b.dashedDivider();
  b.alignCenter()
   .bold(true)
   .textLine('¡GRACIAS POR SU PREFERENCIA!')
   .bold(false)
   .textLine('Representación impresa de Boleta Electrónica.')
   .textLine('Consulte su documento en www.sunat.gob.pe')
   .beep()
   .cut(true);

  return b.build();
}
