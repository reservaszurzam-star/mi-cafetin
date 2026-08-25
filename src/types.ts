export type Settings = {
  theme: "light" | "dark";
  companyName: string;
  slogan?: string;
  companyRuc?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  currency: string;
  lowStockThreshold: number;
  overdueDaysThreshold: number;
  kitchenDelayThresholdMins?: number;
  deliveryDelayThresholdMins?: number;
  soundAlertsEnabled?: boolean;
  autoSendToKitchen?: boolean; // false = Guardar en borrador sin enviar
  enablePreCountPrint?: boolean;
  posTerminalId?: string; // ej. POS-CAJA-01
  showPaymentQR?: boolean;
  printBankDetailsOnTicket?: boolean;
  defaultDeliveryCost?: number;
  whatsappOrdersPhone?: string; // Número WhatsApp 1 (Principal) al que se envían los pedidos
  whatsappOrdersPhone2?: string; // Número WhatsApp 2 (Secundario/Alternativo) al que se envían los pedidos
  whatsappMessageGreeting?: string; // Encabezado / saludo del pedido
  whatsappCustomFooter?: string; // Pie de página o despedida
  whatsappIncludeAddress?: boolean; // Si incluir dirección en delivery
  whatsappIncludePayment?: boolean; // Si incluir método de pago
  whatsappIncludeNotes?: boolean; // Si incluir notas especiales de los platos
  dailyMenuPrice?: number; // Precio base del menú ejecutivo (ej. 16.00)
  dailyMenuEnabled?: boolean; // Si el menú del día está activo para clientes
  dailyMenuStartTime?: string; // Horario inicio (ej. "12:00")
  dailyMenuEndTime?: string; // Horario fin (ej. "16:30")
  dailyMenuTitle?: string; // Título promocional (ej. "Almuerzo Criollo & Brasas")
  dailyMenuSubtitle?: string; // Subtítulo (ej. "Entrada + Fondo + Bebida")
  dailyMenuExtraStarterPrice?: number; // Precio de entrada extra (ej. 5.00)
  dailyMenuExtraDrinkPrice?: number; // Precio de bebida extra (ej. 3.00)
  dailyMenuDefaultDessertPrice?: number; // Precio sugerido de postres (ej. 3.50)
  paymentDetails?: {
    yape?: string;
    yapeHolder?: string;
    yapeActive?: boolean;
    yapeImage?: string;
    plin?: string;
    plinHolder?: string;
    plinActive?: boolean;
    plinImage?: string;
    bankName?: string;
    bankAccount?: string;
    bankCci?: string;
    bankHolder?: string;
    bankActive?: boolean;
    transferencia?: string;
    posProvider?: string;
    posTerminalCode?: string;
    posCommissionRate?: number;
    posActive?: boolean;
    cashActive?: boolean;
  };
};

export type OrderStation = 
  | "Horno & Pollos"
  | "Cocina & Parrilla"
  | "Barra & Bebidas"
  | "Estación Postres"
  | "Caja & Facturación";

export type StationPrinter = {
  id: string;
  name: string;
  station: OrderStation | string;
  categories: string[]; // Categorías de platos asociadas a esta impresora
  connectionType?: "network" | "usb" | "bluetooth";
  ipAddress?: string;
  status: "online" | "offline";
  autoPrint?: boolean;
  paperWidth?: "58mm" | "80mm";
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  docType?: "DNI" | "RUC";
  docNumber?: string;
  address?: string;
  email?: string;
  points?: number;
  creditLimit?: number;
  birthday?: string;
  notes?: string;
  tier?: "Bronce" | "Plata" | "Oro" | "VIP";
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
  orderType?: "salón" | "delivery" | "para_llevar" | "venta_libre";
  waiterName?: string;
  cashierName?: string;
  posTerminalId?: string;
};

export type OrderStatus = "draft" | "sent" | "partially_sent" | "served" | "delivered" | "paid" | "cancelled";

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
  prepared?: boolean; // Estado individual del plato en KDS
  preparedAt?: string;
};

export type RestaurantOrder = {
  id: string;
  type: "salón" | "delivery" | "para_llevar" | "venta_libre";
  floor: 1 | 2 | 3 | 4 | 0;
  tableNumber: string; // ej: "Mesa 101", "Cliente: Carlos", "Delivery #05", "Venta Libre #01"
  customTableName?: string; // Nombre personalizado de la mesa/cuenta
  dinerName?: string;
  customerId?: string;
  customerUserId?: string; // ID de usuario cliente (Supabase Auth)
  customerPhone?: string; // Teléfono para delivery
  deliveryAddress?: string; // Dirección de entrega para delivery
  deliveryLat?: number; // Latitud destino
  deliveryLng?: number; // Longitud destino
  routeDistanceKm?: number; // Distancia calculada por carretera en km
  routeDurationMins?: number; // Tiempo estimado en minutos
  routeGeometry?: [number, number][]; // Coordenadas de la ruta GeoJSON
  routeSummary?: string; // Resumen de vías principales de la ruta
  deliveryCost?: number;
  deliveryPlatform?: "directo" | "pedidosya" | "rappi";
  driverId?: string;
  driverName?: string; // Motorizado asignado
  driverUserId?: string; // ID del usuario Repartidor asignado (Supabase Auth)
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  waiterName?: string;
  posTerminalId?: string;
  preCountPrinted?: boolean; // Pre-cuenta de verificación impresa
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

// ── Menú del Día ──
export type DailyMenuCourse = 'entrada' | 'fondo' | 'bebida' | 'postre';

export type DailyMenuItem = {
  id: string;
  name: string;
  course: DailyMenuCourse;
  description?: string;
  available: boolean;
  extraPrice?: number;
  imageUrl?: string;
  popular?: boolean;
};

export type DailyMenuSelection = {
  starter?: DailyMenuItem;
  main?: DailyMenuItem;
  drink?: DailyMenuItem;
  dessert?: DailyMenuItem;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryType?: 'delivery' | 'salon' | 'para_llevar';
  paymentMethod?: PaymentMethod;
};

// ── Promociones & Ofertas ──
export type PromotionType = 'Happy Hour' | 'Porcentaje' | '2x1' | 'Cupón';
export type PromotionStatus = 'Activo' | 'Pausado' | 'Programado';

export interface Promotion {
  id: string;
  title: string;
  type: PromotionType;
  discountValue?: number;
  description: string;
  status: PromotionStatus;
  usageCount: number;
  startDate?: string;
  endDate?: string;
  tenant_id?: string;
}

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

export type PreOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
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
  preOrderItems?: PreOrderItem[];
  deposit?: number;
};

// ── Roles y Usuarios ──
export type RoleType = "Owner" | "Administrador" | "Cajero" | "Mozo" | "Cocinero" | "Repartidor";

export type AppModuleKey =
  | 'dashboard'
  | 'pos'
  | 'billing'
  | 'cash_register'
  | 'delivery'
  | 'reservations'
  | 'kds'
  | 'products'
  | 'daily_menu'
  | 'dish_ranking'
  | 'promotions'
  | 'inventory'
  | 'suppliers'
  | 'recipes'
  | 'reports'
  | 'expenses'
  | 'sunat'
  | 'users'
  | 'role_permissions'
  | 'staff'
  | 'customers'
  | 'printers'
  | 'audit_log'
  | 'notifications'
  | 'settings';

export type RolePermissionConfig = Record<RoleType, AppModuleKey[]>;

export type User = {
  id: string;
  name: string;
  username: string;
  pin: string;
  role: RoleType;
  phone?: string;
  email?: string;
  active: boolean;
  avatarUrl?: string;
  createdAt: string;
  supabaseId?: string; // UID de Supabase Auth
};

// ── Motorizados y Zonas de Reparto ──
export type DeliveryDriver = {
  id: string;
  name: string;
  phone: string;
  plateNumber?: string;
  vehicleType: "Moto" | "Bicicleta" | "Auto";
  status: "disponible" | "en_ruta" | "inactivo";
  activeOrdersCount: number;
  userId?: string; // Vinculación con un usuario del sistema (User.id)
  username?: string;
  userEmail?: string;
  currentLat?: number; // Última latitud GPS reportada
  currentLng?: number; // Última longitud GPS reportada
  lastGpsUpdate?: string; // Timestamp de última señal GPS
  isOnline?: boolean; // Conectado en tiempo real
};

export type DeliveryZone = {
  id: string;
  name: string;
  cost: number;
  estimatedMinutes: number;
};

// ── Ruteo y Geocodificación ──
export type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
  road?: string;
  suburb?: string;
  city?: string;
  country?: string;
};

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string;
};

export type RouteInfo = {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][]; // [lat, lng][] array
  summary: string;
  steps?: RouteStep[];
};

export type DeliveryTrackingPoint = {
  id: string;
  orderId?: string;
  driverId: string;
  driverUserId?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: string;
};

// ── Configuración Supabase ──
export type SupabaseSyncConfig = {
  url: string;
  anonKey: string;
  enabled: boolean;
  lastSync?: string;
  syncOrders: boolean;
  syncDrivers: boolean;
  syncTracking: boolean;
};

// ── Facturación Electrónica SUNAT ──
export type SunatInvoice = {
  id: string;
  type: "Boleta" | "Factura" | "Nota de Crédito" | "Nota de Venta";
  series: string;
  number: string;
  date: string;
  customerName: string;
  customerDocType: "DNI" | "RUC" | "Sin Documento" | "CE" | "Pasaporte";
  customerDocNumber: string;
  customerAddress?: string;
  subtotal: number;
  igv: number;
  total: number;
  status: "Aceptado" | "Pendiente" | "Rechazado" | "Anulado";
  hash: string;
  qrCode?: string;
  xmlUrl?: string;
  cdrUrl?: string;
  cdrResponseCode?: string;
  cdrDescription?: string;
  orderId?: string;
  paymentMethod: PaymentMethod;
  items?: OrderItem[];
  tenant_id?: string;
};

// ── Pantallas de Cocina KDS (Multi-Monitor) ──
export type KitchenScreen = {
  id: string;
  name: string; // ej: "Pantalla Horno & Brasas", "Pantalla Cocina & Chaufa", "Pantalla Barra", "Pantalla Despacho Master"
  station: string; // ej: "Horno & Pollos", "Cocina & Parrilla", "Barra & Bebidas", "Estación Postres", "Todas"
  categories: string[]; // Categorías asignadas a esta pantalla (si vacío, aplica a toda la estación)
  color: "amber" | "orange" | "blue" | "emerald" | "purple" | "rose" | "indigo" | "stone";
  soundEnabled: boolean; // Alerta de sonido al entrar comanda
  alertMinutes: number; // Umbral de alerta amarilla (minutos)
  dangerMinutes: number; // Umbral de peligro rojo (minutos)
  autoRefreshSeconds: number;
  allowedFloors?: number[]; // [1, 2], o vacío para todos los pisos
  isActive: boolean;
};

