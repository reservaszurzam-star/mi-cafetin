import { InventoryItem, InventoryMovement, Reservation,  useState, useEffect, useCallback } from "react";
import {
  Customer,
  Transaction,
  TransactionType,
  Product,
  Settings,
  Expense,
  RestaurantOrder,
  OrderStatus,
  StationPrinter,
  OrderItem,
  PaymentMethod
} from "../types";

const DEFAULT_PRODUCTS: Product[] = [
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

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "cust-1", name: "Carlos Mendoza (TechCorp Perú)", phone: "987654321", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 40).toISOString() },
  { id: "cust-2", name: "Sofía Alarcón", phone: "912345678", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 25).toISOString() },
  { id: "cust-3", name: "Empresa Constructora del Norte S.A.C.", phone: "955443322", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 35).toISOString() },
  { id: "cust-4", name: "Jorge Ramírez (Delivery Frecuente)", phone: "933221100", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString() },
  { id: "cust-5", name: "Dra. Lucía Benavides", phone: "944556677", createdAt: new Date(Date.now() - 1000 * 3600 * 24 * 5).toISOString() },
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    customerId: "cust-1",
    type: "charge",
    amount: 144.0,
    description: "Consumo Crédito Corporativo 2 Combos Familiares",
    date: new Date(Date.now() - 1000 * 3600 * 24 * 35).toISOString(),
    paymentMethod: "A crédito",
  },
  {
    id: "tx-2",
    customerId: "cust-1",
    type: "payment",
    amount: 100.0,
    description: "Abono transferencia BCP",
    date: new Date(Date.now() - 1000 * 3600 * 24 * 15).toISOString(),
    paymentMethod: "Transferencia",
  },
  {
    id: "tx-3",
    customerId: "cust-3",
    type: "charge",
    amount: 320.0,
    description: "Almuerzo de integración de obra (4 Pollos + Adicionales)",
    date: new Date(Date.now() - 1000 * 3600 * 24 * 32).toISOString(),
    paymentMethod: "A crédito",
  },
  {
    id: "tx-4",
    customerId: "cust-2",
    type: "charge",
    amount: 86.0,
    description: "Cena de cumpleaños 1/2 Pollo + Parrilla",
    date: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(),
    paymentMethod: "A crédito",
  },
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: "exp-1",
    description: "Compra Insumos: 50 Sacos de Carbón Vegetal de Quebracho",
    amount: 450.0,
    category: "Insumos & Alimentos",
    date: new Date(Date.now() - 1000 * 3600 * 24 * 3).toISOString(),
    paymentMethod: "Efectivo",
  },
  {
    id: "exp-2",
    description: "Distribuidor Avícola: 80 Pollos Frescos Seleccionados",
    amount: 960.0,
    category: "Insumos & Alimentos",
    date: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(),
    paymentMethod: "Transferencia",
  },
  {
    id: "exp-3",
    description: "Compra Insumos: 200kg Papa Amarilla e Inka Kola Distribuidora",
    amount: 580.0,
    category: "Insumos & Alimentos",
    date: new Date(Date.now() - 1000 * 3600 * 24 * 1).toISOString(),
    paymentMethod: "Transferencia",
  },
  {
    id: "exp-4",
    description: "Mantenimiento preventivo de Horno Ecológico y extractores",
    amount: 250.0,
    category: "Mantenimiento",
    date: new Date(Date.now() - 1000 * 3600 * 12).toISOString(),
    paymentMethod: "Efectivo",
  },
  {
    id: "exp-5",
    description: "Recarga de Gas industrial para cocina principal (2 Balones 45kg)",
    amount: 320.0,
    category: "Servicios Básicos",
    date: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    paymentMethod: "Yape",
  },
];

const DEFAULT_SALES: import("../types").Sale[] = [
  {
    id: "sale-101",
    items: [
      { productId: "1", productName: "Combo Familiar: 1 Pollo + Papas + Ensalada + Gaseosa 1.5L", quantity: 1, price: 72.0 },
      { productId: "13", productName: "Picarones Criollos con Miel de Chancaca (4 un.)", quantity: 2, price: 12.0 }
    ],
    total: 96.0,
    paymentMethod: "Yape",
    date: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
    tableNumber: "101",
    floor: 1,
    orderType: "salón"
  },
  {
    id: "sale-102",
    items: [
      { productId: "2", productName: "1/2 Pollo a la Brasa + Papas Fritas + Ensalada", quantity: 2, price: 38.0 },
      { productId: "11", productName: "Chicha Morada Casera (Jarra 1.5L)", quantity: 1, price: 14.0 }
    ],
    total: 90.0,
    paymentMethod: "Tarjeta",
    date: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    tableNumber: "201",
    floor: 2,
    orderType: "salón"
  },
  {
    id: "sale-103",
    items: [
      { productId: "4", productName: "Mostro Especial (1/4 Pollo + Arroz Chaufa + Papas)", quantity: 3, price: 26.0 },
      { productId: "12", productName: "Inka Kola / Coca Cola 1.5L", quantity: 1, price: 11.0 }
    ],
    total: 89.0,
    paymentMethod: "Efectivo",
    date: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    tableNumber: "Delivery #01",
    orderType: "delivery"
  },
  {
    id: "sale-104",
    items: [
      { productId: "5", productName: "Anticuchos de Corazón (2 Palitos) + Papas + Choclo", quantity: 2, price: 24.0 },
      { productId: "8", productName: "Tequeños Rellenos de Queso / Pollo (8 un.)", quantity: 1, price: 15.0 },
      { productId: "11", productName: "Chicha Morada Casera (Jarra 1.5L)", quantity: 1, price: 14.0 }
    ],
    total: 77.0,
    paymentMethod: "Plin",
    date: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
    tableNumber: "103",
    floor: 1,
    orderType: "salón"
  }
];

const DEFAULT_PRINTERS: StationPrinter[] = [
  {
    id: "p1",
    name: "Impresora Horno & Pollos (Área Caliente)",
    station: "Horno & Pollos",
    categories: ["Combos & Promos", "Pollos a la Brasa", "Guarniciones & Salsas"],
    status: "online",
  },
  {
    id: "p2",
    name: "Impresora Cocina & Parrilla (Chaufa / Parrillas)",
    station: "Cocina & Parrilla",
    categories: ["Parrillas & Mostros", "Entradas & Chaufa"],
    status: "online",
  },
  {
    id: "p3",
    name: "Impresora Barra & Bebidas",
    station: "Barra & Bebidas",
    categories: ["Bebidas & Refrescos"],
    status: "online",
  },
  {
    id: "p4",
    name: "Impresora Repostería y Postres",
    station: "Estación Postres",
    categories: ["Postres"],
    status: "online",
  },
];

const DEFAULT_INITIAL_ORDERS: RestaurantOrder[] = [
  {
    id: "ord-102",
    type: "salón",
    floor: 1,
    tableNumber: "Mesa 102",
    dinerName: "Familia García (4 personas)",
    status: "sent",
    waiterName: "Mesero Juan",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    items: [
      {
        id: "item-1",
        productId: "1",
        productName: "Combo Familiar: 1 Pollo + Papas + Ensalada + Gaseosa 1.5L",
        quantity: 1,
        price: 72.0,
        notes: "Parte Pecho bien dorado, Inka Kola helada",
        station: "Horno & Pollos",
        sentToKitchen: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        batchNumber: 1,
      },
      {
        id: "item-2",
        productId: "11",
        productName: "Chicha Morada Casera (Jarra 1.5L)",
        quantity: 1,
        price: 14.0,
        notes: "Con bastante hielo y limón",
        station: "Barra & Bebidas",
        sentToKitchen: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        batchNumber: 1,
      }
    ],
    total: 86.0,
  },
  {
    id: "ord-204",
    type: "salón",
    floor: 2,
    tableNumber: "Mesa 204",
    dinerName: "Mesa Amigos Tech",
    status: "sent",
    waiterName: "Mesera Maria",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    items: [
      {
        id: "item-3",
        productId: "4",
        productName: "Mostro Especial (1/4 Pollo + Arroz Chaufa + Papas)",
        quantity: 2,
        price: 26.0,
        notes: "Bastante ají pollero aparte",
        station: "Horno & Pollos",
        sentToKitchen: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        batchNumber: 1,
      },
      {
        id: "item-4",
        productId: "5",
        productName: "Anticuchos de Corazón (2 Palitos) + Papas + Choclo",
        quantity: 1,
        price: 24.0,
        notes: "Término medio, choclo desgranado",
        station: "Cocina & Parrilla",
        sentToKitchen: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        batchNumber: 1,
      }
    ],
    total: 76.0,
  },
  {
    id: "ord-301",
    type: "salón",
    floor: 3,
    tableNumber: "Mesa 301",
    dinerName: "Cumpleaños Sr. Mendoza",
    status: "partially_sent",
    waiterName: "Mesero Carlos",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    items: [
      {
        id: "item-5",
        productId: "1",
        productName: "Combo Familiar: 1 Pollo + Papas + Ensalada + Gaseosa 1.5L",
        quantity: 2,
        price: 72.0,
        notes: "Servir primero ensaladas",
        station: "Horno & Pollos",
        sentToKitchen: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        batchNumber: 1,
      },
      {
        id: "item-6",
        productId: "13",
        productName: "Picarones Criollos con Miel de Chancaca (4 un.)",
        quantity: 3,
        price: 12.0,
        notes: "Para el final con las velas",
        station: "Estación Postres",
        sentToKitchen: false,
        batchNumber: 2,
      }
    ],
    total: 180.0,
  },
  {
    id: "ord-del-02",
    type: "delivery",
    floor: 1,
    tableNumber: "Delivery #02",
    dinerName: "Jorge Ramírez (Av. Larco 450)",
    status: "sent",
    waiterName: "Cajero Principal",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    items: [
      {
        id: "item-7",
        productId: "2",
        productName: "1/2 Pollo a la Brasa + Papas Fritas + Ensalada",
        quantity: 1,
        price: 38.0,
        notes: "Enviar cubiertos descartables y táper hermético",
        station: "Horno & Pollos",
        sentToKitchen: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        batchNumber: 1,
      },
      {
        id: "item-8",
        productId: "12",
        productName: "Inka Kola / Coca Cola 1.5L",
        quantity: 1,
        price: 11.0,
        notes: "Inka Kola Sin Azúcar",
        station: "Barra & Bebidas",
        sentToKitchen: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        batchNumber: 1,
      }
    ],
    total: 49.0,
  }
];

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  companyName: "Cafetín Don Grill",
  currency: "S/",
  lowStockThreshold: 5,
  overdueDaysThreshold: 30,
  autoSendToKitchen: false,
  paymentDetails: {
    yape: "987-654-321",
    yapeImage: "",
    plin: "987-654-321",
    plinImage: "",
    transferencia: "BCP: 191-98765432-0-01 (CCI: 0021910098765432001)",
  },
};

export function useStore() {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("cafetin_customers");
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("cafetin_transactions");
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  });

  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('cafetin_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem('cafetin_movements');
    return saved ? JSON.parse(saved) : [];
  });
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('cafetin_reservations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('cafetin_inventory', JSON.stringify(inventoryItems)); }, [inventoryItems]);
  useEffect(() => { localStorage.setItem('cafetin_movements', JSON.stringify(inventoryMovements)); }, [inventoryMovements]);
  useEffect(() => { localStorage.setItem('cafetin_reservations', JSON.stringify(reservations)); }, [reservations]);

  const [products, setProducts] = useState<Product[]>
(() => {
    const saved = localStorage.getItem("cafetin_products");
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("cafetin_expenses");
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_EXPENSES;
  });

  const [sales, setSales] = useState<import("../types").Sale[]>(() => {
    const saved = localStorage.getItem("cafetin_sales");
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_SALES;
  });

  const [orders, setOrders] = useState<RestaurantOrder[]>(() => {
    const saved = localStorage.getItem("restaurant_orders");
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_INITIAL_ORDERS;
  });

  const [printers, setPrinters] = useState<StationPrinter[]>(() => {
    const saved = localStorage.getItem("restaurant_printers");
    return saved ? JSON.parse(saved) : DEFAULT_PRINTERS;
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("cafetin_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("cafetin_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("cafetin_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("cafetin_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("cafetin_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("cafetin_sales", JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem("restaurant_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("restaurant_printers", JSON.stringify(printers));
  }, [printers]);

  useEffect(() => {
    localStorage.setItem("cafetin_settings", JSON.stringify(settings));
    if (settings.theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const updatePrinters = useCallback((newPrinters: StationPrinter[]) => {
    setPrinters(newPrinters);
  }, []);

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
    );
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<RestaurantOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
    );
  }, []);

  const saveOrderDraft = useCallback((order: RestaurantOrder) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...order, updatedAt: new Date().toISOString() };
        return copy;
      }
      return [...prev, { ...order, updatedAt: new Date().toISOString() }];
    });
  }, []);



  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    setInventoryItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };
  const updateInventoryItem = (id: string, item: Partial<InventoryItem>) => {
    setInventoryItems(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
  };
  const addInventoryMovement = (movement: Omit<InventoryMovement, 'id' | 'date'>) => {
    const newMovement = { ...movement, id: Date.now().toString(), date: new Date().toISOString() };
    setInventoryMovements(prev => [...prev, newMovement]);
    setInventoryItems(prev => prev.map(i => i.id === movement.itemId ? { ...i, currentStock: i.currentStock + (movement.type === 'in' ? movement.quantity : -movement.quantity) } : i));
  };
  const addReservation = (res: Omit<Reservation, 'id'>) => {
    setReservations(prev => [...prev, { ...res, id: Date.now().toString() }]);
  };
  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const sendOrderToKitchen = useCallback((orderId: string) => {
    let sentItemsResult: OrderItem[] = [];
    let currentBatch = 1;

    setOrders((prev) => {
      return prev.map((order) => {
        if (order.id !== orderId) return order;

        const maxBatch = Math.max(0, ...order.items.map((i) => i.batchNumber));
        const hasUnsent = order.items.some((i) => !i.sentToKitchen);
        currentBatch = hasUnsent ? maxBatch + 1 : maxBatch;

        const updatedItems = order.items.map((item) => {
          if (!item.sentToKitchen) {
            const newItem = {
              ...item,
              sentToKitchen: true,
              sentAt: new Date().toISOString(),
              batchNumber: currentBatch,
            };
            sentItemsResult.push(newItem);
            return newItem;
          }
          return item;
        });

        return {
          ...order,
          items: updatedItems,
          status: "sent",
          updatedAt: new Date().toISOString(),
        };
      });
    });

    return { sentItems: sentItemsResult, batchNumber: currentBatch };
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const closeOrderAndPay = useCallback(
    (orderId: string, payments: { method: PaymentMethod; amount: number }[], customerId?: string) => {
      setOrders((prev) => {
        const target = prev.find((o) => o.id === orderId);
        if (!target) return prev;

        // Auto-descuento en Inventario
        target.items.forEach(item => {
          // Buscamos si el nombre del producto vendido coincide con algún insumo
          const matchingInventoryItem = inventoryItems.find(inv => inv.name.toLowerCase() === item.productName.toLowerCase() || inv.name.toLowerCase().includes(item.productName.toLowerCase()));
          if (matchingInventoryItem) {
             addInventoryMovement({
               itemId: matchingInventoryItem.id,
               type: 'out',
               quantity: item.quantity,
               reason: `Venta de ${item.productName}`,
               referenceOrderId: target.id
             });
          }
        });

        const saleItems = target.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes,
        }));

        // Add multiple payments if split bill, or single
        payments.forEach(payment => {
          addSale(saleItems, payment.amount, payment.method, customerId || target.customerId);
        });

        return prev.filter((o) => o.id !== orderId);
      });
    },
    [inventoryItems, addInventoryMovement]
  );

  const addCustomer = useCallback((name: string, phone?: string) => {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name,
      phone,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  }, []);

  const addTransaction = useCallback(
    (
      customerId: string,
      type: TransactionType,
      amount: number,
      description: string,
      date?: string,
      paymentMethod?: import("../types").PaymentMethod,
    ) => {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        customerId,
        type,
        amount,
        description,
        date: date || new Date().toISOString(),
        paymentMethod,
      };
      setTransactions((prev) => [...prev, newTransaction]);
      return newTransaction;
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addProduct = useCallback(
    (name: string, price: number, category: string, stock?: number, station?: string) => {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        name,
        price,
        category,
        stock,
        station,
      };
      setProducts((prev) => [...prev, newProduct]);
      return newProduct;
    },
    [],
  );

  const updateProductStock = useCallback((id: string, newStock?: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addExpense = useCallback(
    (
      description: string,
      amount: number,
      category: string,
      date?: string,
      paymentMethod?: import("../types").PaymentMethod,
    ) => {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description,
        amount,
        category,
        date: date || new Date().toISOString(),
        paymentMethod,
      };
      setExpenses((prev) => [...prev, newExpense]);
      return newExpense;
    },
    [],
  );

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateCustomer = useCallback(
    (id: string, data: Partial<Omit<Customer, "id" | "createdAt">>) => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
      );
    },
    [],
  );

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setTransactions((prev) => prev.filter((t) => t.customerId !== id));
  }, []);

  const addSale = useCallback(
    (
      items: import("../types").SaleItem[],
      total: number,
      paymentMethod: import("../types").PaymentMethod,
      customerId?: string,
    ) => {
      const newSale: import("../types").Sale = {
        id: crypto.randomUUID(),
        customerId,
        items,
        total,
        paymentMethod,
        date: new Date().toISOString(),
      };
      setSales((prev) => [...prev, newSale]);

      if (paymentMethod === "A crédito" && customerId) {
        const desc =
          items.length === 1
            ? items[0].productName
            : `Venta Restaurante: ${items.map((i) => i.productName).join(", ")}`;
        const newTransaction: import("../types").Transaction = {
          id: crypto.randomUUID(),
          customerId,
          type: "charge",
          amount: total,
          description: desc,
          date: new Date().toISOString(),
        };
        setTransactions((prev) => [...prev, newTransaction]);
      }

      // Deduct stock for each item in the sale
      setProducts((prev) =>
        prev.map((product) => {
          const soldItem = items.find((item) => item.productId === product.id);
          if (soldItem && product.stock !== undefined) {
            return {
              ...product,
              stock: Math.max(0, product.stock - soldItem.quantity),
            };
          }
          return product;
        }),
      );
      return newSale;
    },
    [],
  );

  const getCustomerBalance = useCallback(
    (customerId: string) => {
      return transactions
        .filter((t) => t.customerId === customerId)
        .reduce(
          (acc, t) => acc + (t.type === "charge" ? t.amount : -t.amount),
          0,
        );
    },
    [transactions],
  );

  const getTotalReceivables = useCallback(() => {
    return customers.reduce((acc, customer) => {
      const balance = getCustomerBalance(customer.id);
      return acc + (balance > 0 ? balance : 0);
    }, 0);
  }, [customers, getCustomerBalance]);

  return {
    inventoryItems,
    inventoryMovements,
    reservations,
    addInventoryItem,
    updateInventoryItem,
    addInventoryMovement,
    addReservation,
    updateReservationStatus,
    customers,
    transactions,
    products,
    expenses,
    sales,
    orders,
    printers,
    settings,
    updateSettings,
    updatePrinters,
    updateOrderStatus,
    saveOrderDraft,
    updateOrder,
    sendOrderToKitchen,
    deleteOrder,
    closeOrderAndPay,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addTransaction,
    deleteTransaction,
    addSale,
    addProduct,
    updateProductStock,
    deleteProduct,
    addExpense,
    deleteExpense,
    getCustomerBalance,
    getTotalReceivables,
  };
}

