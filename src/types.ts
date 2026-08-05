export type Settings = {
  theme: "light" | "dark";
  companyName: string;
  logoUrl?: string;
  currency: string;
  lowStockThreshold: number;
  overdueDaysThreshold: number;
  autoSendToKitchen?: boolean; // false = Guardar en borrador sin enviar
  paymentDetails?: {
    yape?: string;
    yapeImage?: string;
    plin?: string;
    plinImage?: string;
    transferencia?: string;
  };
};

export type OrderStation = 
  | "Horno & Pollos"
  | "Cocina & Parrilla"
  | "Barra & Bebidas"
  | "Estación Postres";

export type StationPrinter = {
  id: string;
  name: string;
  station: OrderStation | string;
  categories: string[]; // Categorías de platos asociadas a esta impresora
  ipAddress?: string;
  status: "online" | "offline";
  autoPrint?: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
};

export type TransactionType = "charge" | "payment";

export type PaymentMethod =
  | "Efectivo"
  | "Yape"
  | "Plin"
  | "Tarjeta"
  | "Transferencia"
  | "A crédito"
  | "Otro";

export type Transaction = {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  paymentMethod?: PaymentMethod;
};

export type MonthlyReport = {
  customerId: string;
  customerName: string;
  totalCharges: number;
  totalPayments: number;
  balance: number;
  transactions: Transaction[];
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod?: PaymentMethod;
};

export type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
  sentToKitchen?: boolean;
  station?: string;
  batchNumber?: number;
};

export type Sale = {
  id: string;
  customerId?: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  tableNumber?: string;
  floor?: number;
  orderType?: "salón" | "delivery" | "para_llevar";
};

export type OrderStatus = "draft" | "sent" | "partially_sent" | "served" | "delivered" | "paid";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
  station: OrderStation | string;
  sentToKitchen: boolean;
  sentAt?: string;
  batchNumber: number; // 1 = Comanda inicial, 2 = Adición 1, 3 = Adición 2...
};

export type RestaurantOrder = {
  id: string;
  type: "salón" | "delivery" | "para_llevar";
  floor: 1 | 2 | 3 | 4;
  tableNumber: string; // ej: "Mesa 101", "Delivery #05", "Para Llevar #02"
  dinerName?: string;
  customerId?: string;
  customerPhone?: string; // Teléfono para delivery
  deliveryAddress?: string; // Dirección de entrega para delivery
  driverName?: string; // Motorizado asignado
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  waiterName?: string;
};

export type ProductCategory =
  | "Combos & Promos"
  | "Pollos a la Brasa"
  | "Parrillas & Mostros"
  | "Entradas & Chaufa"
  | "Guarniciones & Salsas"
  | "Bebidas & Refrescos"
  | "Postres"
  | "Otros";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: ProductCategory | string;
  station?: OrderStation | string;
  stock?: number;
  recipe?: RecipeIngredient[];
};

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  category: string;
};

export type InventoryMovement = {
  id: string;
  itemId: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  reason: string;
  referenceOrderId?: string;
};

export type RecipeIngredient = {
  itemId: string;
  quantity: number;
};

export type Reservation = {
  id: string;
  customerName: string;
  phone?: string;
  date: string;
  time: string;
  tableNumber: string;
  guestCount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
};

