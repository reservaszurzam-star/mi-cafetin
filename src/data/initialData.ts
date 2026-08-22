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

export const DEFAULT_PRODUCTS: Product[] = [
  // ── Combos & Promos ───────────────────────────────────────────
  {
    id: "1",
    name: "Combo Familiar: 1 Pollo + Papas + Ensalada + Gaseosa 1.5L",
    price: 72.0,
    category: "Combos & Promos",
    station: "Horno & Pollos",
    stock: 50,
  },
  {
    id: "promo-2",
    name: "Combo Pareja: 1/2 Pollo + Papas + 2 Gaseosas",
    price: 52.0,
    category: "Combos & Promos",
    station: "Horno & Pollos",
    stock: 30,
  },
  {
    id: "promo-3",
    name: "Combo Ejecutivo: 1/4 Pollo + Papas + Refresco",
    price: 28.0,
    category: "Combos & Promos",
    station: "Horno & Pollos",
    stock: 40,
  },
  // ── Pollos a la Brasa ─────────────────────────────────────────
  {
    id: "2",
    name: "1/2 Pollo a la Brasa + Papas Fritas + Ensalada",
    price: 38.0,
    category: "Pollos a la Brasa",
    station: "Horno & Pollos",
    stock: 40,
  },
  {
    id: "3",
    name: "1/4 Pollo a la Brasa (Pecho/Pierna) + Papas + Ensalada",
    price: 22.0,
    category: "Pollos a la Brasa",
    station: "Horno & Pollos",
    stock: 60,
  },
  {
    id: "pollo-3",
    name: "Pollo Entero a la Brasa + Papas + Ensalada",
    price: 68.0,
    category: "Pollos a la Brasa",
    station: "Horno & Pollos",
    stock: 15,
  },
  // ── Parrillas & Mostros ───────────────────────────────────────
  {
    id: "4",
    name: "Mostro Especial (1/4 Pollo + Arroz Chaufa + Papas)",
    price: 26.0,
    category: "Parrillas & Mostros",
    station: "Horno & Pollos",
    stock: 35,
  },
  {
    id: "5",
    name: "Anticuchos de Corazón (2 Palitos) + Papas + Choclo",
    price: 24.0,
    category: "Parrillas & Mostros",
    station: "Cocina & Parrilla",
    stock: 25,
  },
  {
    id: "6",
    name: "Mollejitas a la Parrilla con Papas Doradas",
    price: 22.0,
    category: "Parrillas & Mostros",
    station: "Cocina & Parrilla",
    stock: 20,
  },
  // ── Platos de Carta — Cevichería (CARTA REAL) ─────────────────
  {
    id: "cv-1",
    name: "Ceviche de Pescado",
    price: 27.0,
    category: "Entradas & Chaufa",
    station: "Cocina & Parrilla",
    stock: 40,
  },
  {
    id: "cv-2",
    name: "Arroz con Mariscos",
    price: 27.0,
    category: "Entradas & Chaufa",
    station: "Cocina & Parrilla",
    stock: 30,
  },
  {
    id: "cv-3",
    name: "Leche de Tigre",
    price: 15.0,
    category: "Entradas & Chaufa",
    station: "Cocina & Parrilla",
    stock: 35,
  },
  {
    id: "cv-4",
    name: "Causa de Atún",
    price: 13.0,
    category: "Entradas & Chaufa",
    station: "Cocina & Parrilla",
    stock: 25,
  },
  {
    id: "7",
    name: "Arroz Chaufa de Pollo Familiar",
    price: 20.0,
    category: "Entradas & Chaufa",
    station: "Cocina & Parrilla",
    stock: 30,
  },
  {
    id: "8",
    name: "Tequeños Rellenos de Queso / Pollo (8 un.)",
    price: 15.0,
    category: "Entradas & Chaufa",
    station: "Cocina & Parrilla",
    stock: 25,
  },
  // ── Guarniciones & Salsas ─────────────────────────────────────
  {
    id: "9",
    name: "Porción de Papas Fritas Amarillas Crocantes",
    price: 10.0,
    category: "Guarniciones & Salsas",
    station: "Horno & Pollos",
    stock: 80,
  },
  {
    id: "10",
    name: "Ensalada Fresca de la Casa con Vinagreta",
    price: 8.0,
    category: "Guarniciones & Salsas",
    station: "Horno & Pollos",
    stock: 50,
  },
  {
    id: "guar-3",
    name: "Salsa Huancaína / Ocopa (porción)",
    price: 5.0,
    category: "Guarniciones & Salsas",
    station: "Horno & Pollos",
    stock: 60,
  },
  // ── Bebidas & Refrescos (CARTA REAL) ──────────────────────────
  {
    id: "beb-1",
    name: "Jarra de Chicha (1 L)",
    price: 15.0,
    category: "Bebidas & Refrescos",
    station: "Barra & Bebidas",
    stock: 50,
  },
  {
    id: "beb-2",
    name: "Jarra de Maracuyá (1 L)",
    price: 15.0,
    category: "Bebidas & Refrescos",
    station: "Barra & Bebidas",
    stock: 50,
  },
  {
    id: "beb-3",
    name: "Limonada (1 L)",
    price: 15.0,
    category: "Bebidas & Refrescos",
    station: "Barra & Bebidas",
    stock: 50,
  },
  {
    id: "beb-4",
    name: "Chicha Morada Casera (Jarra 1.5L)",
    price: 14.0,
    category: "Bebidas & Refrescos",
    station: "Barra & Bebidas",
    stock: 40,
  },
  {
    id: "beb-5",
    name: "Inka Kola / Coca Cola 1.5L",
    price: 11.0,
    category: "Bebidas & Refrescos",
    station: "Barra & Bebidas",
    stock: 60,
  },
  {
    id: "beb-6",
    name: "Agua Mineral / Sin Gas (500 ml)",
    price: 4.0,
    category: "Bebidas & Refrescos",
    station: "Barra & Bebidas",
    stock: 80,
  },
  // ── Postres ───────────────────────────────────────────────────
  {
    id: "11",
    name: "Picarones Criollos con Miel de Chancaca (4 un.)",
    price: 12.0,
    category: "Postres",
    station: "Estación Postres",
    stock: 20,
  },
  {
    id: "post-2",
    name: "Mazamorra Morada con Arroz con Leche",
    price: 8.0,
    category: "Postres",
    station: "Estación Postres",
    stock: 25,
  },
];

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

export const DEFAULT_DAILY_MENU_ITEMS: DailyMenuItem[] = [
  // ── ENTRADAS & SOPAS ──
  { id: 'ent-1', name: 'Sopa Criolla Especial con Huevo', course: 'entrada', description: 'Sopa caliente de carne molida, fideos cabello de ángel, leche y tostadas.', available: true, popular: true },
  { id: 'ent-2', name: 'Papa a la Huancaína Tradicional', course: 'entrada', description: 'Papas nativas bañadas en crema de ají amarillo, queso fresco y aceituna.', available: true, popular: true },
  { id: 'ent-3', name: 'Causa Limeña Rellena de Pollo', course: 'entrada', description: 'Masa suave de papa amarilla con limón, palta y pechuga deshilachada.', available: true },
  { id: 'ent-4', name: 'Tequeños Crocantes con Guacamole (4 un.)', course: 'entrada', description: 'Tequeños rellenos de queso andino acompañados de crema de palta.', available: true },
  { id: 'ent-5', name: 'Ensalada Fresca de la Casa', course: 'entrada', description: 'Lechuga orgánica, tomate, pepinillo, choclo y vinagreta clásica.', available: true },
  // ── PLATOS DE FONDO ──
  { id: 'fon-1', name: '1/4 Pollo al Horno con Papas & Arroz', course: 'fondo', description: 'Pollo marinado a las finas hierbas con papas doradas crocantes y arroz.', available: true, popular: true },
  { id: 'fon-2', name: 'Lomo Saltado Criollo al Wok', course: 'fondo', description: 'Trozos de carne flameados con cebolla, tomate, ají amarillo y papas fritas.', available: true, popular: true },
  { id: 'fon-3', name: 'Seco de Res con Frijoles Canario & Arroz', course: 'fondo', description: 'Guiso tierno de res al culantro con porción de frijoles cremosos y arroz blanco.', available: true },
  { id: 'fon-4', name: 'Milanesa de Pollo con Tallarines Verdes', course: 'fondo', description: 'Pechuga apanada dorada sobre pasta con crema de albahaca, espinaca y queso.', available: true },
  { id: 'fon-5', name: 'Pescado Frito con Yuca Dorada & Salsa Criolla', course: 'fondo', description: 'Filete de pescado fresco frito al punto, con yucas y sarsa de cebolla y ají.', available: true },
  { id: 'fon-6', name: 'Arroz Chaufa Especial con Trozos de Pollo', course: 'fondo', description: 'Arroz salteado al wok con cebolla china, huevo, pimientos y sillao oriental.', available: true },
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

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionConfig = {
  Owner: [
    'dashboard', 'pos', 'billing', 'cash_register', 'delivery', 'reservations',
    'kds', 'products', 'daily_menu', 'promotions', 'inventory', 'suppliers',
    'recipes', 'reports', 'expenses', 'sunat', 'users', 'role_permissions', 'staff', 'customers',
    'printers', 'audit_log', 'notifications', 'settings'
  ],
  Administrador: [
    'dashboard', 'pos', 'billing', 'cash_register', 'delivery', 'reservations',
    'kds', 'products', 'daily_menu', 'promotions', 'inventory', 'suppliers',
    'recipes', 'reports', 'expenses', 'sunat', 'users', 'role_permissions', 'customers',
    'printers', 'audit_log', 'notifications', 'settings'
  ],
  Cajero: [
    'dashboard', 'pos', 'billing', 'cash_register', 'delivery', 'reservations',
    'customers', 'sunat', 'expenses', 'printers', 'notifications'
  ],
  Mozo: [
    'pos', 'reservations', 'notifications'
  ],
  Cocinero: [
    'kds', 'recipes', 'notifications'
  ],
  Repartidor: [
    'delivery', 'notifications'
  ]
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  companyName: "Cafetín Don Grill",
  currency: "S/",
  lowStockThreshold: 5,
  overdueDaysThreshold: 30,
  autoSendToKitchen: false,
  posTerminalId: "POS-CAJA-01",
  showPaymentQR: true,
  defaultDeliveryCost: 5.00,
  paymentDetails: {
    yape: "987-654-321",
    yapeImage: "",
    plin: "987-654-321",
    plinImage: "",
    transferencia: "BCP: 191-98765432-0-01 (CCI: 0021910098765432001)",
  },
};
