import {
  Product,
  Customer,
  Transaction,
  Expense,
  Sale,
  StationPrinter,
  RestaurantOrder,
  User,
  DeliveryDriver,
  DeliveryZone,
  SunatInvoice,
  DailyMenuItem,
  RolePermissionConfig,
  Settings,
  KitchenScreen,
} from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// ── CARTA OFICIAL: LAS LOMAS GRILL (Pollos a la Brasa & Parrillas) ──────
// ═══════════════════════════════════════════════════════════════════════════
export const DEFAULT_PRODUCTS_LASLOMAS: Product[] = [
  // ── Combos & Promos ──
  { id: "1", name: "Combo Familiar: 1 Pollo + Papas + Ensalada + Gaseosa 1.5L", price: 72.0, category: "Combos & Promos", station: "Horno & Pollos", stock: 50 },
  { id: "promo-2", name: "Combo Pareja: 1/2 Pollo + Papas + 2 Gaseosas", price: 52.0, category: "Combos & Promos", station: "Horno & Pollos", stock: 30 },
  { id: "promo-3", name: "Combo Ejecutivo: 1/4 Pollo + Papas + Refresco", price: 28.0, category: "Combos & Promos", station: "Horno & Pollos", stock: 40 },
  
  // ── Pollos a la Brasa ──
  { id: "pollo-3", name: "Pollo Entero a la Brasa + Papas + Ensalada", price: 68.0, category: "Pollos a la Brasa", station: "Horno & Pollos", stock: 25 },
  { id: "2", name: "1/2 Pollo a la Brasa + Papas Fritas + Ensalada", price: 38.0, category: "Pollos a la Brasa", station: "Horno & Pollos", stock: 40 },
  { id: "3", name: "1/4 Pollo a la Brasa (Pecho/Pierna) + Papas + Ensalada", price: 22.0, category: "Pollos a la Brasa", station: "Horno & Pollos", stock: 60 },
  
  // ── Parrillas & Mostros ──
  { id: "4", name: "Mostro Especial (1/4 Pollo + Arroz Chaufa + Papas)", price: 26.0, category: "Parrillas & Mostros", station: "Horno & Pollos", stock: 35 },
  { id: "5", name: "Anticuchos de Corazón (2 Palitos) + Papas + Choclo", price: 24.0, category: "Parrillas & Mostros", station: "Cocina & Parrilla", stock: 25 },
  { id: "6", name: "Mollejitas a la Parrilla con Papas Doradas", price: 22.0, category: "Parrillas & Mostros", station: "Cocina & Parrilla", stock: 20 },
  { id: "parr-1", name: "Parrilla Mixta Familiar (Anticucho + Chuleta + Pollo + Chorizo)", price: 55.0, category: "Parrillas & Mostros", station: "Cocina & Parrilla", stock: 15 },
  
  // ── Entradas & Chaufa ──
  { id: "7", name: "Arroz Chaufa de Pollo Familiar al Wok", price: 20.0, category: "Entradas & Chaufa", station: "Cocina & Parrilla", stock: 30 },
  { id: "8", name: "Tequeños Rellenos de Queso con Guacamole (8 un.)", price: 15.0, category: "Entradas & Chaufa", station: "Cocina & Parrilla", stock: 25 },
  { id: "ent-pap", name: "Papa a la Huancaína Tradicional", price: 12.0, category: "Entradas & Chaufa", station: "Cocina & Parrilla", stock: 30 },
  
  // ── Guarniciones & Salsas ──
  { id: "9", name: "Porción de Papas Fritas Amarillas Crocantes", price: 10.0, category: "Guarniciones & Salsas", station: "Horno & Pollos", stock: 80 },
  { id: "10", name: "Ensalada Fresca de la Casa con Vinagreta", price: 8.0, category: "Guarniciones & Salsas", station: "Horno & Pollos", stock: 50 },
  { id: "guar-3", name: "Salsa Huancaína / Ocopa Especial", price: 5.0, category: "Guarniciones & Salsas", station: "Horno & Pollos", stock: 60 },
  
  // ── Bebidas & Refrescos ──
  { id: "beb-1", name: "Jarra de Chicha Morada Casera (1 L)", price: 15.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 50 },
  { id: "beb-2", name: "Jarra de Maracuyá Fruta (1 L)", price: 15.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 50 },
  { id: "beb-3", name: "Limonada Natural con Menta (1 L)", price: 15.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 50 },
  { id: "beb-5", name: "Inka Kola / Coca Cola 1.5L", price: 11.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 60 },
  { id: "beb-6", name: "Gaseosa Personal 500 ml", price: 5.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 80 },
  
  // ── Postres ──
  { id: "11", name: "Picarones Criollos con Miel de Chancaca (4 un.)", price: 12.0, category: "Postres", station: "Estación Postres", stock: 20 },
  { id: "post-2", name: "Mazamorra Morada con Arroz con Leche", price: 8.0, category: "Postres", station: "Estación Postres", stock: 25 },
  { id: "post-3", name: "Crema Volteada Casera", price: 7.0, category: "Postres", station: "Estación Postres", stock: 20 },
];

// ═══════════════════════════════════════════════════════════════════════════
// ── CARTA OFICIAL: PARADERO 104 (Cevichería & Mariscos) ──────────────────
// ═══════════════════════════════════════════════════════════════════════════
export const DEFAULT_PRODUCTS_PARADERO: Product[] = [
  // ── Ceviches ──
  { id: "cv-1", name: "Ceviche de Pescado", price: 27.0, category: "Ceviches", station: "Cocina & Parrilla", stock: 40 },
  { id: "cv-2", name: "Ceviche Mixto", price: 30.0, category: "Ceviches", station: "Cocina & Parrilla", stock: 35 },
  { id: "cv-3", name: "Ceviche de Conchas Negras (12 und.)", price: 35.0, category: "Ceviches", station: "Cocina & Parrilla", stock: 20 },
  { id: "cv-4", name: "Ceviche de Pota / Pescado", price: 22.0, category: "Ceviches", station: "Cocina & Parrilla", stock: 30 },
  { id: "cv-5", name: "Ceviche de Pescado Familiar", price: 65.0, category: "Familiar", station: "Cocina & Parrilla", stock: 15 },
  { id: "cv-6", name: "Ceviche Mixto Familiar", price: 75.0, category: "Familiar", station: "Cocina & Parrilla", stock: 15 },
  
  // ── Tríos Marinos ──
  { id: "trio-1", name: "Trío Marino: Ceviche + Arroz con Mariscos + Chicharrón de Pota", price: 38.0, category: "Tríos", station: "Cocina & Parrilla", stock: 30 },
  { id: "trio-2", name: "Trío Marino: Ceviche + Chaufa de Mariscos + Chicharrón de Pota", price: 38.0, category: "Tríos", station: "Cocina & Parrilla", stock: 30 },
  { id: "trio-3", name: "Trío Marino: Ceviche + Arroz con Mariscos + Chicharrón de Pescado", price: 42.0, category: "Tríos", station: "Cocina & Parrilla", stock: 25 },
  { id: "trio-4", name: "Trío Marino: Ceviche + Chaufa de Mariscos + Chicharrón de Pescado", price: 42.0, category: "Tríos", station: "Cocina & Parrilla", stock: 25 },
  { id: "trio-5", name: "Combina tu Trío Marino (Todo Vale)", price: 45.0, category: "Tríos", station: "Cocina & Parrilla", stock: 20 },
  
  // ── Platos Familiares ──
  { id: "fam-1", name: "Arroz con Mariscos Familiar", price: 60.0, category: "Familiar", station: "Cocina & Parrilla", stock: 20 },
  { id: "fam-2", name: "Chaufa de Mariscos Familiar", price: 55.0, category: "Familiar", station: "Cocina & Parrilla", stock: 20 },
  
  // ── Sopas Marinas ──
  { id: "sop-1", name: "Chilcano Especial", price: 18.0, category: "Sopas", station: "Cocina & Parrilla", stock: 30 },
  { id: "sop-2", name: "Parihuela de Cabrilla", price: 35.0, category: "Sopas", station: "Cocina & Parrilla", stock: 20 },
  { id: "sop-3", name: "Parihuela de Pescado (Filete)", price: 28.0, category: "Sopas", station: "Cocina & Parrilla", stock: 25 },
  { id: "sop-4", name: "Sudado de Cabrilla", price: 35.0, category: "Sopas", station: "Cocina & Parrilla", stock: 20 },
  { id: "sop-5", name: "Sudado de Pescado (Filete)", price: 28.0, category: "Sopas", station: "Cocina & Parrilla", stock: 25 },
  { id: "sop-6", name: "Chupe de Camarones", price: 38.0, category: "Sopas", station: "Cocina & Parrilla", stock: 20 },
  
  // ── Chicharrones & Entradas ──
  { id: "chich-1", name: "Chicharrón de Pescado con Yuca y Tártara", price: 28.0, category: "Chicharrones", station: "Cocina & Parrilla", stock: 30 },
  { id: "chich-2", name: "Chicharrón de Calamar", price: 32.0, category: "Chicharrones", station: "Cocina & Parrilla", stock: 25 },
  { id: "chich-3", name: "Chicharrón Mixto de Mariscos", price: 35.0, category: "Chicharrones", station: "Cocina & Parrilla", stock: 25 },
  { id: "ent-1", name: "Leche de Tigre Clásica", price: 15.0, category: "Entradas & Chaufa", station: "Cocina & Parrilla", stock: 40 },
  { id: "ent-2", name: "Causa de Atún Rellena", price: 13.0, category: "Entradas & Chaufa", station: "Cocina & Parrilla", stock: 25 },
  
  // ── Bebidas & Refrescos ──
  { id: "beb-p1", name: "Jarra de Chicha Morada (1 L)", price: 15.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 50 },
  { id: "beb-p2", name: "Jarra de Maracuyá (1 L)", price: 15.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 50 },
  { id: "beb-p3", name: "Limonada Frozen (1 L)", price: 16.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 50 },
  { id: "beb-p4", name: "Inka Kola / Coca Cola 1.5L", price: 11.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 60 },
  { id: "beb-p5", name: "Cerveza Cusqueña / Pilsen 650 ml", price: 12.0, category: "Bebidas & Refrescos", station: "Barra & Bebidas", stock: 70 },
];

export const DEFAULT_PRODUCTS: Product[] = DEFAULT_PRODUCTS_LASLOMAS;

export const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "cust-1", name: "Carlos Mendoza", phone: "987654321", docType: "DNI", docNumber: "45892147", points: 320, tier: "Oro", creditLimit: 500, birthday: "1988-09-15", email: "carlos.mendoza@gmail.com", notes: "Prefiere mesa en terraza y pollo bien dorado.", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 40).toISOString() },
  { id: "cust-2", name: "Sofía Alarcón", phone: "912345678", docType: "DNI", docNumber: "72341902", points: 180, tier: "Plata", creditLimit: 200, birthday: "1994-04-22", email: "sofia.alarcon@hotmail.com", notes: "Alérgica a mariscos crudos.", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 25).toISOString() },
  { id: "cust-3", name: "Empresa Constructora del Norte S.A.C.", phone: "955443322", docType: "RUC", docNumber: "20601234567", points: 890, tier: "VIP", creditLimit: 2000, email: "facturacion@constructoranorte.pe", notes: "Facturación a 15 días con orden de compra.", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 35).toISOString() },
  { id: "cust-4", name: "Jorge Ramírez (Delivery Frecuente)", phone: "933221100", docType: "DNI", docNumber: "10984562", points: 95, tier: "Bronce", creditLimit: 150, birthday: "1990-11-03", email: "jorge.ramirez@gmail.com", address: "Av. Las Palmeras 450 Dpto 302", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString() },
  { id: "cust-5", name: "Dra. Lucía Benavides", phone: "944556677", docType: "DNI", docNumber: "08923411", points: 520, tier: "VIP", creditLimit: 600, birthday: "1985-08-30", email: "lucia.benavides@clinica.pe", notes: "Cliente VIP, atención preferente.", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 5).toISOString() },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_EXPENSES: Expense[] = [];

export const DEFAULT_SALES: Sale[] = [];

export const DEFAULT_PRINTERS: StationPrinter[] = [
  {
    id: "p1",
    name: "Impresora Horno & Pollos (Área Caliente)",
    station: "Horno & Pollos",
    categories: ["Combos & Promos", "Pollos a la Brasa", "Guarniciones & Salsas"],
    status: "online",
    autoPrint: true
  },
  {
    id: "p2",
    name: "Impresora Cocina & Parrilla (Chaufa / Parrillas)",
    station: "Cocina & Parrilla",
    categories: ["Parrillas & Mostros", "Entradas & Chaufa"],
    status: "online",
    autoPrint: true
  },
  {
    id: "p3",
    name: "Impresora Barra & Bebidas",
    station: "Barra & Bebidas",
    categories: ["Bebidas & Refrescos"],
    status: "online",
    autoPrint: true
  },
  {
    id: "p4",
    name: "Impresora Repostería y Postres",
    station: "Estación Postres",
    categories: ["Postres"],
    status: "online",
    autoPrint: true
  },
];

export const DEFAULT_KITCHEN_SCREENS: KitchenScreen[] = [
  {
    id: "kds-1",
    name: "Pantalla Horno & Brasas",
    station: "Horno & Pollos",
    categories: ["Combos & Promos", "Pollos a la Brasa", "Guarniciones & Salsas"],
    color: "amber",
    soundEnabled: true,
    alertMinutes: 10,
    dangerMinutes: 20,
    autoRefreshSeconds: 5,
    isActive: true,
  },
  {
    id: "kds-2",
    name: "Pantalla Cocina Caliente & Wok",
    station: "Cocina & Parrilla",
    categories: ["Parrillas & Mostros", "Entradas & Chaufa"],
    color: "orange",
    soundEnabled: true,
    alertMinutes: 12,
    dangerMinutes: 22,
    autoRefreshSeconds: 5,
    isActive: true,
  },
  {
    id: "kds-3",
    name: "Pantalla Barra, Bebidas & Refrescos",
    station: "Barra & Bebidas",
    categories: ["Bebidas & Refrescos"],
    color: "blue",
    soundEnabled: true,
    alertMinutes: 5,
    dangerMinutes: 10,
    autoRefreshSeconds: 5,
    isActive: true,
  },
  {
    id: "kds-4",
    name: "Pantalla Postres & Repostería",
    station: "Estación Postres",
    categories: ["Postres"],
    color: "purple",
    soundEnabled: false,
    alertMinutes: 8,
    dangerMinutes: 15,
    autoRefreshSeconds: 5,
    isActive: true,
  },
  {
    id: "kds-master",
    name: "Pantalla Master (Despacho Central)",
    station: "Todas",
    categories: [],
    color: "emerald",
    soundEnabled: true,
    alertMinutes: 10,
    dangerMinutes: 20,
    autoRefreshSeconds: 5,
    isActive: true,
  }
];

export const DEFAULT_INITIAL_ORDERS: RestaurantOrder[] = [];

export const DEFAULT_USERS_PARADERO: User[] = [
  // ── OWNER MULTI-SEDE ──
  { id: "usr-owner", name: "Valentino (Owner)", username: "valentino", pin: "0000", role: "Owner", active: true, email: "valentino@stc.com", phone: "999-999-999", createdAt: new Date().toISOString() },

  // ── ADMINISTRADOR ──
  { id: "usr-par-adm-1", name: "Allison", username: "allison", pin: "1234", role: "Administrador", active: true, email: "allison@stc.com", phone: "987111001", createdAt: new Date().toISOString() },
  { id: "usr-par-adm-2", name: "Denisse", username: "denisse", pin: "1234", role: "Administrador", active: true, email: "denisse@stc.com", phone: "987111002", createdAt: new Date().toISOString() },
  { id: "usr-par-adm-3", name: "Jacky", username: "jacky", pin: "1234", role: "Administrador", active: true, email: "jacky@stc.com", phone: "987111003", createdAt: new Date().toISOString() },

  // ── CAJERA ──
  { id: "usr-par-caj-1", name: "Irina", username: "irina", pin: "1111", role: "Cajero", active: true, email: "irina@stc.com", phone: "987222001", createdAt: new Date().toISOString() },
  { id: "usr-par-caj-2", name: "Gladys", username: "gladys", pin: "1111", role: "Cajero", active: true, email: "gladys@stc.com", phone: "987222002", createdAt: new Date().toISOString() },

  // ── MESERA ──
  { id: "usr-par-moz-1", name: "Jhoseline", username: "jhoseline", pin: "2222", role: "Mozo", active: true, email: "jhoseline@stc.com", phone: "987333001", createdAt: new Date().toISOString() },
  { id: "usr-par-moz-2", name: "Alba", username: "alba", pin: "2222", role: "Mozo", active: true, email: "alba@stc.com", phone: "987333002", createdAt: new Date().toISOString() },
  { id: "usr-par-moz-3", name: "Kiara", username: "kiara", pin: "2222", role: "Mozo", active: true, email: "kiara@stc.com", phone: "987333003", createdAt: new Date().toISOString() },
  { id: "usr-par-moz-4", name: "Luisana", username: "luisana", pin: "2222", role: "Mozo", active: true, email: "luisana@stc.com", phone: "987333004", createdAt: new Date().toISOString() },
  { id: "usr-par-moz-5", name: "Jocelyn", username: "jocelyn", pin: "2222", role: "Mozo", active: true, email: "jocelyn@stc.com", phone: "987333005", createdAt: new Date().toISOString() },
  { id: "usr-par-moz-6", name: "Alexandra", username: "alexandra", pin: "2222", role: "Mozo", active: true, email: "alexandra@stc.com", phone: "987333006", createdAt: new Date().toISOString() },

  // ── DELIVERY ──
  { id: "usr-par-del-1", name: "Repartidor Paradero (A Gestionar)", username: "delivery.paradero", pin: "4444", role: "Repartidor", active: true, phone: "987777888", email: "delivery.paradero@stc.com", createdAt: new Date().toISOString() },

  // ── COCINERO ──
  { id: "usr-par-coc-1", name: "Chef Cevichería", username: "chef.paradero", pin: "3333", role: "Cocinero", active: true, phone: "987555001", email: "chef.paradero@stc.com", createdAt: new Date().toISOString() }
];

export const DEFAULT_USERS_LASLOMAS: User[] = [
  // ── OWNER MULTI-SEDE ──
  { id: "usr-owner", name: "Valentino (Owner)", username: "valentino", pin: "0000", role: "Owner", active: true, email: "valentino@stc.com", phone: "999-999-999", createdAt: new Date().toISOString() },

  // ── ADMINISTRADOR ──
  { id: "usr-lom-adm-1", name: "Denisse", username: "denisse", pin: "1234", role: "Administrador", active: true, email: "denisse@stc.com", phone: "987111002", createdAt: new Date().toISOString() },
  { id: "usr-lom-adm-2", name: "Allison", username: "allison", pin: "1234", role: "Administrador", active: true, email: "allison@stc.com", phone: "987111001", createdAt: new Date().toISOString() },
  { id: "usr-lom-adm-3", name: "Jacky", username: "jacky", pin: "1234", role: "Administrador", active: true, email: "jacky@stc.com", phone: "987111003", createdAt: new Date().toISOString() },

  // ── CAJERA ──
  { id: "usr-lom-caj-1", name: "Karina", username: "karina", pin: "1111", role: "Cajero", active: true, email: "karina@stc.com", phone: "987222003", createdAt: new Date().toISOString() },

  // ── MESERA ──
  { id: "usr-lom-moz-1", name: "Eddy", username: "eddy", pin: "2222", role: "Mozo", active: true, email: "eddy@stc.com", phone: "987333011", createdAt: new Date().toISOString() },
  { id: "usr-lom-moz-2", name: "Jheniffer", username: "jheniffer", pin: "2222", role: "Mozo", active: true, email: "jheniffer@stc.com", phone: "987333012", createdAt: new Date().toISOString() },
  { id: "usr-lom-moz-3", name: "Yameli", username: "yameli", pin: "2222", role: "Mozo", active: true, email: "yameli@stc.com", phone: "987333013", createdAt: new Date().toISOString() },
  { id: "usr-lom-moz-4", name: "Liz", username: "liz", pin: "2222", role: "Mozo", active: true, email: "liz@stc.com", phone: "987333014", createdAt: new Date().toISOString() },
  { id: "usr-lom-moz-5", name: "Veronica", username: "veronica", pin: "2222", role: "Mozo", active: true, email: "veronica@stc.com", phone: "987333015", createdAt: new Date().toISOString() },
  { id: "usr-lom-moz-6", name: "Sonia", username: "sonia", pin: "2222", role: "Mozo", active: true, email: "sonia@stc.com", phone: "987333016", createdAt: new Date().toISOString() },
  { id: "usr-lom-moz-7", name: "Karol", username: "karol", pin: "2222", role: "Mozo", active: true, email: "karol@stc.com", phone: "987333017", createdAt: new Date().toISOString() },

  // ── DELIVERY ──
  { id: "usr-lom-del-1", name: "Jessica", username: "jessica", pin: "4444", role: "Repartidor", active: true, phone: "987445566", email: "jessica@stc.com", createdAt: new Date().toISOString() },

  // ── COCINERO ──
  { id: "usr-lom-coc-1", name: "Maestro Parrillero & Hornero", username: "chef.lomas", pin: "3333", role: "Cocinero", active: true, phone: "987555002", email: "chef.lomas@stc.com", createdAt: new Date().toISOString() }
];

export const DEFAULT_USERS: User[] = DEFAULT_USERS_LASLOMAS;

export const DEFAULT_DRIVERS_PARADERO: DeliveryDriver[] = [
  { id: "drv-par-1", name: "Repartidor Paradero (A Gestionar)", phone: "987777888", plateNumber: "M-1029", vehicleType: "Moto", status: "disponible", activeOrdersCount: 0, userId: "usr-par-del-1", username: "delivery.paradero", userEmail: "delivery.paradero@stc.com", currentLat: -12.0254, currentLng: -76.9942, isOnline: true, lastGpsUpdate: new Date().toISOString() }
];

export const DEFAULT_DRIVERS_LASLOMAS: DeliveryDriver[] = [
  { id: "drv-lom-1", name: "Jessica", phone: "987445566", plateNumber: "M-4589", vehicleType: "Moto", status: "disponible", activeOrdersCount: 0, userId: "usr-lom-del-1", username: "jessica", userEmail: "jessica@stc.com", currentLat: -12.0232, currentLng: -76.9918, isOnline: true, lastGpsUpdate: new Date().toISOString() }
];

export const DEFAULT_DRIVERS: DeliveryDriver[] = DEFAULT_DRIVERS_LASLOMAS;

export const DEFAULT_ZONES: DeliveryZone[] = [
  { id: "zone-1", name: "Zona Centro / Cercado (0 - 3 km)", cost: 5.00, estimatedMinutes: 20 },
  { id: "zone-2", name: "Zona Residencial / Norte (3 - 6 km)", cost: 8.00, estimatedMinutes: 30 },
  { id: "zone-3", name: "Zona Playa / Sur (6 - 10 km)", cost: 12.00, estimatedMinutes: 45 },
  { id: "zone-4", name: "Canal PedidosYa / Rappi", cost: 0.00, estimatedMinutes: 25 }
];

export const DEFAULT_SUNAT_INVOICES: SunatInvoice[] = [];

// ═══════════════════════════════════════════════════════════════════════════
// ── MENÚ DEL DÍA: LAS LOMAS GRILL (Criollo & Brasas) ─────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export const DEFAULT_DAILY_MENU_ITEMS_LASLOMAS: DailyMenuItem[] = [
  // ── ENTRADAS & SOPAS ──
  { id: 'ent-1', name: 'Sopa Criolla Especial con Huevo', course: 'entrada', description: 'Sopa caliente de carne molida, fideos cabello de ángel, leche y tostadas.', available: true, popular: true },
  { id: 'ent-2', name: 'Papa a la Huancaína Tradicional', course: 'entrada', description: 'Papas nativas bañadas en crema de ají amarillo, queso fresco y aceituna.', available: true, popular: true },
  { id: 'ent-3', name: 'Causa Limeña Rellena de Pollo', course: 'entrada', description: 'Masa suave de papa amarilla con limón, palta y pechuga deshilachada.', available: true },
  { id: 'ent-4', name: 'Tequeños Crocantes con Guacamole (4 un.)', course: 'entrada', description: 'Tequeños rellenos de queso andino acompañados de crema de palta.', available: true },
  { id: 'ent-5', name: 'Ensalada Fresca de la Casa', course: 'entrada', description: 'Lechuga orgánica, tomate, pepinillo, choclo y vinagreta clásica.', available: true },
  
  // ── PLATOS DE FONDO ──
  { id: 'fon-1', name: '1/4 Pollo al Horno con Papas & Arroz', course: 'fondo', description: 'Pollo marinado a las finas hierbas con papas doradas crocantes y arroz.', available: true, popular: true, price: 16.00, priceTier: 'Clásico' },
  { id: 'fon-2', name: 'Lomo Saltado Criollo al Wok', course: 'fondo', description: 'Trozos de carne flameados con cebolla, tomate, ají amarillo y papas fritas.', available: true, popular: true, price: 18.00, priceTier: 'Ejecutivo' },
  { id: 'fon-3', name: 'Seco de Res con Frijoles Canario & Arroz', course: 'fondo', description: 'Guiso tierno de res al culantro con porción de frijoles cremosos y arroz blanco.', available: true, price: 16.00, priceTier: 'Clásico' },
  { id: 'fon-4', name: 'Milanesa de Pollo con Tallarines Verdes', course: 'fondo', description: 'Pechuga apanada dorada sobre pasta con crema de albahaca, espinaca y queso.', available: true, price: 18.00, priceTier: 'Ejecutivo' },
  { id: 'fon-6', name: 'Arroz Chaufa Especial con Trozos de Pollo', course: 'fondo', description: 'Arroz salteado al wok con cebolla china, huevo, pimientos y sillao oriental.', available: true, price: 14.00, priceTier: 'Económico' },
  { id: 'fon-7', name: 'Parrilla Mixta Criolla (Chuleta + Pollo + Chorizo)', course: 'fondo', description: 'Cortes seleccionados a la parrilla con papas doradas y ensalada.', available: true, popular: true, price: 22.00, priceTier: 'Especial' },
  
  // ── BEBIDAS ──
  { id: 'beb-1', name: 'Vaso de Chicha Morada Casera (500 ml)', course: 'bebida', description: 'Preparada con maíz morado, piña, manzana, canela y gotas de limón.', available: true, popular: true },
  { id: 'beb-2', name: 'Vaso de Refresco de Maracuyá Fruta', course: 'bebida', description: 'Refrescante jugo natural de maracuyá bien helado.', available: true },
  { id: 'beb-3', name: 'Limonada Natural con Menta & Hielo', course: 'bebida', description: 'Limonada recién exprimida con hojas frescas de menta.', available: true },
  { id: 'beb-4', name: 'Gaseosa Personal (Inka Kola / Coca Cola)', course: 'bebida', description: 'Botella personal de 500 ml fría.', available: true },
  
  // ── POSTRES ──
  { id: 'pos-1', name: 'Mazamorra Morada con Canela', course: 'postre', description: 'Postre tradicional limeño caliente o frío.', available: true, extraPrice: 3.50 },
  { id: 'pos-2', name: 'Crema Volteada Casera', course: 'postre', description: 'Suave flan con caramelo tostado.', available: true, extraPrice: 4.00 },
  { id: 'pos-3', name: 'Gelatina con Flan Bicolor', course: 'postre', description: 'Copa refrescante de gelatina de fresa y flan de vainilla.', available: true, extraPrice: 3.00 },
];

// ═══════════════════════════════════════════════════════════════════════════
// ── MENÚ DEL DÍA: PARADERO 104 (Marino & Cevichería) ─────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export const DEFAULT_DAILY_MENU_ITEMS_PARADERO: DailyMenuItem[] = [
  // ── ENTRADAS ──
  { id: 'ent-p1', name: 'Chilcano Caliente de Pescado', course: 'entrada', description: 'Concentrado marino de pescado fresco con limón y culantro.', available: true, popular: true },
  { id: 'ent-p2', name: 'Causa Rellena de Atún', course: 'entrada', description: 'Papa amarilla prensada con ají amarillo, atún y palta.', available: true, popular: true },
  { id: 'ent-p3', name: 'Choritos a la Chalaca (3 un.)', course: 'entrada', description: 'Choros cocidos con salsa chalaca criolla y limón.', available: true },
  { id: 'ent-p4', name: 'Ceviche Clásico en Copa', course: 'entrada', description: 'Filete de pescado fresco marinado al momento.', available: true },
  
  // ── FONDOS ──
  { id: 'fon-p1', name: 'Pescado Frito con Yuca Dorada & Salsa Criolla', course: 'fondo', description: 'Filete de pescado frito al punto, con yuca crocante y arroz blanco.', available: true, popular: true, price: 16.00, priceTier: 'Clásico' },
  { id: 'fon-p2', name: 'Arroz con Mariscos Criollo', course: 'fondo', description: 'Arroz sazonado al ají amarillo con mixtura de mariscos y queso parmesano.', available: true, popular: true, price: 18.00, priceTier: 'Ejecutivo' },
  { id: 'fon-p3', name: 'Chicharrón de Pescado con Tártara', course: 'fondo', description: 'Trozos crocantes de pescado con salsa tártara y ensalada fresca.', available: true, price: 18.00, priceTier: 'Ejecutivo' },
  { id: 'fon-p4', name: 'Chaufa de Mariscos al Wok', course: 'fondo', description: 'Arroz salteado al fuego vivo con mariscos y cebolla china.', available: true, price: 22.00, priceTier: 'Marino' },
  { id: 'fon-p5', name: 'Sudado de Filete de Pescado', course: 'fondo', description: 'Pescado guisado con tomate, cebolla, chicha de jora y yuca.', available: true, price: 26.00, priceTier: 'Especial' },
  
  // ── BEBIDAS ──
  { id: 'beb-p1', name: 'Vaso de Chicha Morada (500 ml)', course: 'bebida', description: 'Refresco casero preparado con maíz morado y frutas.', available: true, popular: true },
  { id: 'beb-p2', name: 'Vaso de Maracuyá Helado', course: 'bebida', description: 'Refresco natural de maracuyá.', available: true },
  { id: 'beb-p3', name: 'Limonada Frozen', course: 'bebida', description: 'Limonada batida con hielo.', available: true },
  
  // ── POSTRES ──
  { id: 'pos-p1', name: 'Gelatina con Flan Bicolor', course: 'postre', description: 'Copa refrescante.', available: true, extraPrice: 3.00 },
  { id: 'pos-p2', name: 'Crema Volteada Casera', course: 'postre', description: 'Flan con caramelo.', available: true, extraPrice: 4.00 },
];

export const DEFAULT_DAILY_MENU_ITEMS: DailyMenuItem[] = DEFAULT_DAILY_MENU_ITEMS_LASLOMAS;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionConfig = {
  Owner: [
    'dashboard', 'pos', 'billing', 'cash_register', 'delivery', 'reservations',
    'kds', 'products', 'daily_menu', 'dish_ranking', 'promotions', 'inventory', 'suppliers',
    'recipes', 'reports', 'expenses', 'sunat', 'users', 'role_permissions', 'staff', 'customers',
    'printers', 'audit_log', 'notifications', 'settings'
  ],
  Administrador: [
    'dashboard', 'pos', 'billing', 'cash_register', 'delivery', 'reservations',
    'kds', 'products', 'daily_menu', 'dish_ranking', 'promotions', 'inventory', 'suppliers',
    'recipes', 'reports', 'expenses', 'sunat', 'users', 'role_permissions', 'customers',
    'printers', 'audit_log', 'notifications', 'settings'
  ],
  Cajero: [
    'dashboard', 'pos', 'billing', 'cash_register', 'delivery', 'reservations',
    'customers', 'dish_ranking', 'sunat', 'expenses', 'printers', 'notifications'
  ],
  Mozo: [
    'pos', 'reservations', 'notifications'
  ],
  Cocinero: [
    'kds', 'dish_ranking', 'recipes', 'notifications'
  ],
  Repartidor: [
    'delivery', 'notifications'
  ]
};

export const DEFAULT_SETTINGS_LASLOMAS: Settings = {
  theme: "light",
  companyName: "Las Lomas Grill",
  companyRuc: "10437453701",
  slogan: "Sabor a la Leña & Tradición",
  address: "Av. Las Lomas 234, Lima",
  logoUrl: "/Logo/logo-lomas-grill.png",
  phone: "995 881 303 / 953 034 562",
  currency: "S/",
  lowStockThreshold: 5,
  overdueDaysThreshold: 30,
  autoSendToKitchen: false,
  posTerminalId: "POS-LOMAS-01",
  showPaymentQR: true,
  defaultDeliveryCost: 5.00,
  dailyMenuPrice: 16.00,
  dailyMenuPriceTiers: [14, 16, 18, 22],
  dailyMenuTierLabels: ['Económico', 'Clásico', 'Ejecutivo', 'Especial'],
  whatsappOrdersPhone: "51995881303",
  whatsappOrdersPhone2: "51953034562",
  whatsappMessageGreeting: "¡Hola Las Lomas Grill! Quisiera realizar el siguiente pedido delivery:",
  whatsappCustomFooter: "Por favor confirmar el pedido a los números de delivery: 995 881 303 / 953 034 562. ¡Muchas gracias!",
  whatsappIncludeAddress: true,
  whatsappIncludePayment: true,
  whatsappIncludeNotes: true,
  paymentDetails: {
    yape: "995 881 303 / 953 034 562",
    yapeHolder: "Las Lomas Grill",
    yapeActive: true,
    yapeImage: "",
    plin: "995 881 303 / 953 034 562",
    plinHolder: "Las Lomas Grill",
    plinActive: true,
    plinImage: "",
    transferencia: "BCP: 191-98765432-0-01 (CCI: 0021910098765432001)",
    bankActive: true,
  },
};

export const DEFAULT_SETTINGS_PARADERO: Settings = {
  theme: "light",
  companyName: "Paradero 104",
  companyRuc: "10437453701",
  slogan: "Cevichería & Mariscos",
  address: "Av. Próceres 1040, Lima",
  logoUrl: "/Logo/logo-paradero-104.png",
  phone: "987 654 321",
  currency: "S/",
  lowStockThreshold: 5,
  overdueDaysThreshold: 30,
  autoSendToKitchen: false,
  posTerminalId: "POS-PARADERO-01",
  showPaymentQR: true,
  defaultDeliveryCost: 5.00,
  dailyMenuPrice: 18.00,
  dailyMenuPriceTiers: [16, 18, 22, 26],
  dailyMenuTierLabels: ['Clásico', 'Ejecutivo', 'Marino', 'Especial'],
  whatsappOrdersPhone: "51987654321",
  whatsappOrdersPhone2: "51995881303",
  whatsappMessageGreeting: "¡Hola Paradero 104! Quisiera realizar el siguiente pedido:",
  whatsappCustomFooter: "Por favor confirmar el tiempo estimado. ¡Muchas gracias!",
  whatsappIncludeAddress: true,
  whatsappIncludePayment: true,
  whatsappIncludeNotes: true,
  paymentDetails: {
    yape: "987-654-321",
    yapeActive: true,
    yapeImage: "",
    plin: "987-654-321",
    plinActive: true,
    plinImage: "",
    transferencia: "BCP: 191-98765432-0-01 (CCI: 0021910098765432001)",
    bankActive: true,
  },
};

export const DEFAULT_SETTINGS: Settings = DEFAULT_SETTINGS_LASLOMAS;

export const DEFAULT_PROMOTIONS = [
  { id: '1', title: 'Happy Hour Cócteles', type: '2x1' as const, description: 'Todos los jueves y viernes de 6pm a 8pm. Aplica en Pisco Sour y Chilcanos.', status: 'Activo' as const, usageCount: 145 },
  { id: '2', title: 'Descuento Corporativo', type: 'Porcentaje' as const, discountValue: 20, description: '20% de descuento para empresas afiliadas.', status: 'Activo' as const, usageCount: 89 },
  { id: '3', title: 'Cupón FIRST10', type: 'Cupón' as const, discountValue: 10, description: '10% de descuento en la primera compra por Delivery.', status: 'Activo' as const, usageCount: 32 },
  { id: '4', title: 'Día del Pollo', type: 'Porcentaje' as const, discountValue: 15, description: '1/4 de pollo a precio especial todo el día.', status: 'Programado' as const, usageCount: 0 },
  { id: '5', title: 'Almuerzo Ejecutivo', type: 'Porcentaje' as const, discountValue: 10, description: 'Menú a precio rebajado de Lunes a Miércoles.', status: 'Pausado' as const, usageCount: 412 },
];
