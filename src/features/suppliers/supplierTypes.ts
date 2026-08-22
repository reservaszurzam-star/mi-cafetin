export type Supplier = {
  id: string;
  name: string;
  ruc: string;
  contactName: string;
  phone: string;
  email?: string;
  address?: string;
  category: 'Carnes & Aves' | 'Verduras & Frutas' | 'Abarrotes' | 'Bebidas & Licores' | 'Pescados & Mariscos' | 'Descartables & Limpieza';
  paymentTerms: 'Contado' | 'Crédito 7 días' | 'Crédito 15 días' | 'Crédito 30 días';
};

export type PurchaseOrderItem = {
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
};

export type PurchaseOrder = {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  status: 'Pendiente' | 'Recibido' | 'Cancelado';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
};

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Avícola San Fernando S.A.',
    ruc: '20100154371',
    contactName: 'Carlos Mendoza',
    phone: '987654321',
    email: 'ventas@sanfernando.pe',
    address: 'Av. República de Panamá 2461, Lima',
    category: 'Carnes & Aves',
    paymentTerms: 'Crédito 15 días'
  },
  {
    id: 'sup-2',
    name: 'Distribuidora Agrícola del Valle',
    ruc: '20554189201',
    contactName: 'Rosa Flores',
    phone: '912345678',
    email: 'pedidos@agricolavalle.com',
    address: 'Mercado Mayorista de Santa Anita, Pabellón C-12',
    category: 'Verduras & Frutas',
    paymentTerms: 'Contado'
  },
  {
    id: 'sup-3',
    name: 'Comercializadora de Mariscos del Callao',
    ruc: '20601248931',
    contactName: 'Pedro Huamán',
    phone: '945678123',
    email: 'contacto@mariscoscallao.pe',
    address: 'Muelle Pesquero Artesanal del Callao',
    category: 'Pescados & Mariscos',
    paymentTerms: 'Contado'
  },
  {
    id: 'sup-4',
    name: 'Arca Continental Lindley (Coca-Cola / Inca Kola)',
    ruc: '20415932376',
    contactName: 'Atención Clientes',
    phone: '013116000',
    email: 'atencionalcliente@lindley.pe',
    address: 'Av. Javier Prado Este 6210, La Molina',
    category: 'Bebidas & Licores',
    paymentTerms: 'Crédito 30 días'
  }
];

export const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-1',
    orderNumber: 'OC-1041',
    supplierId: 'sup-1',
    supplierName: 'Avícola San Fernando S.A.',
    date: '2026-08-18 09:30',
    status: 'Recibido',
    items: [
      { itemId: 'inv-1', itemName: 'Pollo Crudo Eviscerado', unit: 'und', quantity: 30, unitCost: 16.50, totalCost: 495.00 },
      { itemId: 'inv-2', itemName: 'Menudencia de Pollo', unit: 'kg', quantity: 10, unitCost: 6.00, totalCost: 60.00 }
    ],
    totalAmount: 555.00,
    notes: 'Lote recibido conforme con factura F001-4920.'
  },
  {
    id: 'po-2',
    orderNumber: 'OC-1042',
    supplierId: 'sup-2',
    supplierName: 'Distribuidora Agrícola del Valle',
    date: '2026-08-19 06:15',
    status: 'Pendiente',
    items: [
      { itemId: 'inv-3', itemName: 'Papa Amarilla Seleccionada', unit: 'saco 50kg', quantity: 3, unitCost: 95.00, totalCost: 285.00 },
      { itemId: 'inv-4', itemName: 'Cebolla Roja', unit: 'saco 40kg', quantity: 2, unitCost: 60.00, totalCost: 120.00 },
      { itemId: 'inv-5', itemName: 'Limón Sutil Piurano', unit: 'malla 10kg', quantity: 2, unitCost: 45.00, totalCost: 90.00 }
    ],
    totalAmount: 495.00,
    notes: 'Entrega en local principal antes de las 10:00 AM.'
  }
];
