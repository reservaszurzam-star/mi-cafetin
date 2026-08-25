import { useState, useEffect, useCallback } from "react";
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
  PaymentMethod,
  InventoryItem,
  InventoryMovement,
  Reservation,
  User,
  DeliveryDriver,
  DeliveryZone,
  SunatInvoice,
  DailyMenuItem,
  RoleType,
  AppModuleKey,
  RolePermissionConfig,
  KitchenScreen,
  Promotion,
} from "../types";

import {
  DEFAULT_PRODUCTS,
  DEFAULT_PRODUCTS_LASLOMAS,
  DEFAULT_PRODUCTS_PARADERO,
  DEFAULT_CUSTOMERS,
  DEFAULT_TRANSACTIONS,
  DEFAULT_EXPENSES,
  DEFAULT_SALES,
  DEFAULT_PRINTERS,
  DEFAULT_KITCHEN_SCREENS,
  DEFAULT_INITIAL_ORDERS,
  DEFAULT_USERS,
  DEFAULT_USERS_PARADERO,
  DEFAULT_USERS_LASLOMAS,
  DEFAULT_DRIVERS,
  DEFAULT_DRIVERS_PARADERO,
  DEFAULT_DRIVERS_LASLOMAS,
  DEFAULT_ZONES,
  DEFAULT_SUNAT_INVOICES,
  DEFAULT_DAILY_MENU_ITEMS,
  DEFAULT_DAILY_MENU_ITEMS_LASLOMAS,
  DEFAULT_DAILY_MENU_ITEMS_PARADERO,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_SETTINGS,
  DEFAULT_SETTINGS_LASLOMAS,
  DEFAULT_SETTINGS_PARADERO,
  DEFAULT_PROMOTIONS,
} from "../data/initialData";

import * as svc from "../lib/supabaseService";
import { useSupabaseSync } from "./useSupabaseSync";
import { generateUUID } from "../lib/utils";
import { getSunatConfig, generateCanonicalHash, buildSunatQRString } from "../lib/sunatService";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function ensureUUID(val?: string | null): string {
  if (val && UUID_REGEX.test(val)) return val;
  return generateUUID();
}

export function useStore(tenantId: string) {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_customers`);
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_transactions`);
    if (!saved) return DEFAULT_TRANSACTIONS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((t: Transaction) => t.id !== 'tx-1' && t.id !== 'tx-2') : [];
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_inventory`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_movements`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_reservations`);
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const isParadero = tenantId === 'paradero';
    const defaultProds = isParadero ? DEFAULT_PRODUCTS_PARADERO : DEFAULT_PRODUCTS_LASLOMAS;
    const saved = localStorage.getItem(`${tenantId}_cafetin_products`);
    if (!saved) return defaultProds;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultProds;
      // Sanity check: ensure dishes in storage match the business type
      if (isParadero && parsed.some(p => p.name.toLowerCase().includes('pollo a la brasa'))) return defaultProds;
      if (!isParadero && parsed.some(p => p.name.toLowerCase().includes('ceviche') && !p.name.toLowerCase().includes('chaufa'))) return defaultProds;
      return parsed;
    } catch {
      return defaultProds;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_expenses`);
    if (!saved) return DEFAULT_EXPENSES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((e: Expense) => e.id !== 'exp-1' && e.id !== 'exp-2') : [];
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  const [sales, setSales] = useState<import("../types").Sale[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_sales`);
    if (!saved) return DEFAULT_SALES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((s: import("../types").Sale) => s.id !== 'sale-101' && s.id !== 'sale-102') : [];
    } catch {
      return DEFAULT_SALES;
    }
  });

  const [orders, setOrders] = useState<RestaurantOrder[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_restaurant_orders`);
    if (!saved) return DEFAULT_INITIAL_ORDERS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((o: RestaurantOrder) => o.id !== 'ord-102' && o.id !== 'ord-del-02') : [];
    } catch {
      return DEFAULT_INITIAL_ORDERS;
    }
  });

  const [printers, setPrinters] = useState<StationPrinter[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_restaurant_printers`);
    return saved ? JSON.parse(saved) : DEFAULT_PRINTERS;
  });

  const [kitchenScreens, setKitchenScreens] = useState<KitchenScreen[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_kitchen_screens`);
    return saved ? JSON.parse(saved) : DEFAULT_KITCHEN_SCREENS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const isParadero = tenantId === 'paradero';
    const defaultList = isParadero ? DEFAULT_USERS_PARADERO : DEFAULT_USERS_LASLOMAS;
    const saved = localStorage.getItem(`${tenantId}_cafetin_users`);
    if (!saved) return defaultList;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultList;
      const hasOldDummyOnly = parsed.some(u => u.id === 'usr-1' && u.name === 'Administrador General');
      if (hasOldDummyOnly) return defaultList;
      const hasOwner = parsed.some(u => u.username === 'valentino' || u.role === 'Owner');
      if (!hasOwner) return [defaultList[0], ...parsed];
      return parsed;
    } catch {
      return defaultList;
    }
  });

  const [drivers, setDrivers] = useState<DeliveryDriver[]>(() => {
    const isParadero = tenantId === 'paradero';
    const defaultList = isParadero ? DEFAULT_DRIVERS_PARADERO : DEFAULT_DRIVERS_LASLOMAS;
    const saved = localStorage.getItem(`${tenantId}_cafetin_drivers`);
    if (!saved) return defaultList;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultList;
      const hasOldDummyOnly = parsed.some(d => d.id === 'drv-1' && d.name === 'Carlos Rivas');
      if (hasOldDummyOnly && !isParadero) return defaultList;
      return parsed;
    } catch {
      return defaultList;
    }
  });

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_zones`);
    return saved && JSON.parse(saved).length > 0 ? JSON.parse(saved) : DEFAULT_ZONES;
  });

  const [sunatInvoices, setSunatInvoices] = useState<SunatInvoice[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_sunat`);
    if (!saved) return DEFAULT_SUNAT_INVOICES;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((s: SunatInvoice) => s.id !== 'inv-1' && s.id !== 'inv-2') : [];
    } catch {
      return DEFAULT_SUNAT_INVOICES;
    }
  });

  const [dailyMenuItems, setDailyMenuItems] = useState<DailyMenuItem[]>(() => {
    const isParadero = tenantId === 'paradero';
    const defaultMenu = isParadero ? DEFAULT_DAILY_MENU_ITEMS_PARADERO : DEFAULT_DAILY_MENU_ITEMS_LASLOMAS;
    const saved = localStorage.getItem(`${tenantId}_cafetin_daily_menu`);
    if (!saved) return defaultMenu;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return defaultMenu;
      if (isParadero && parsed.some(m => m.name.toLowerCase().includes('pollo al horno'))) return defaultMenu;
      if (!isParadero && parsed.some(m => m.name.toLowerCase().includes('chilcano'))) return defaultMenu;
      return parsed;
    } catch {
      return defaultMenu;
    }
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_promotions`);
    if (!saved) return DEFAULT_PROMOTIONS;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROMOTIONS;
    } catch {
      return DEFAULT_PROMOTIONS;
    }
  });

  const [rolePermissions, setRolePermissions] = useState<RolePermissionConfig>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_role_permissions`);
    return saved ? JSON.parse(saved) : DEFAULT_ROLE_PERMISSIONS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => users[0] || DEFAULT_USERS[0]);

  // ── Owner Role Simulator: permite al Owner probar la vista de cualquier rol en vivo ──
  const [ownerSimulatedRole, setOwnerSimulatedRole] = useState<RoleType | null>(() => {
    const saved = sessionStorage.getItem(`${tenantId}_owner_simulated_role`);
    return (saved as RoleType) || null;
  });

  const changeOwnerSimulatedRole = useCallback((role: RoleType | null) => {
    setOwnerSimulatedRole(role);
    if (role) {
      sessionStorage.setItem(`${tenantId}_owner_simulated_role`, role);
    } else {
      sessionStorage.removeItem(`${tenantId}_owner_simulated_role`);
    }
  }, [tenantId]);

  // ── Supabase: indica si está cargando datos desde la base de datos ──
  const [isLoadingFromDB, setIsLoadingFromDB] = useState(true);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(() => new Date());

  // ── Supabase: hidrata el store con datos reales y suscribe a Realtime ──
  const { reload: reloadSupabaseData } = useSupabaseSync(tenantId, {
    setCustomers,
    setTransactions,
    setProducts,
    setExpenses,
    setOrders,
    setPrinters,
    setInventoryItems,
    setInventoryMovements,
    setReservations,
    setUsers,
    setDrivers,
    setDeliveryZones,
    setSunatInvoices,
    setDailyMenuItems,
    setRolePermissions,
    setPromotions,
    setCurrentUser,
    setSettings: (s: Settings) => setSettings({ ...s, theme: "light" }),
    setIsLoadingFromDB,
  });

  const syncWithSupabase = useCallback(async () => {
    setIsManualSyncing(true);
    try {
      await reloadSupabaseData();
      setLastSyncTime(new Date());
    } finally {
      setIsManualSyncing(false);
    }
  }, [reloadSupabaseData]);

  const [settings, setSettings] = useState<Settings>(() => {
    const isParadero = tenantId === 'paradero';
    const defaultSettings = isParadero ? DEFAULT_SETTINGS_PARADERO : DEFAULT_SETTINGS_LASLOMAS;
    const defaultLogo = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';
    const defaultName = isParadero ? 'Paradero 104' : 'Las Lomas Grill';
    const defaultTerminal = isParadero ? 'POS-PARADERO-01' : 'POS-LOMAS-01';

    const saved = localStorage.getItem(`${tenantId}_cafetin_settings`);
    if (saved) {
      const parsed = JSON.parse(saved);
      const isLegacyLogo = !parsed.logoUrl || 
        parsed.logoUrl === '/icono.png' || 
        parsed.logoUrl === '/logo-web.png' || 
        parsed.logoUrl.includes('/assets/logos/');
      
      const logo = isLegacyLogo ? defaultLogo : parsed.logoUrl;
      return { 
        ...defaultSettings, 
        companyName: parsed.companyName || defaultName,
        logoUrl: logo,
        posTerminalId: parsed.posTerminalId || defaultTerminal,
        ...parsed, 
        theme: "light" 
      };
    }

    return {
      ...defaultSettings,
      companyName: defaultName,
      logoUrl: defaultLogo,
      posTerminalId: defaultTerminal,
      theme: "light",
    };
  });

  // LocalStorage sync effects
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_inventory`, JSON.stringify(inventoryItems)); }, [inventoryItems, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_movements`, JSON.stringify(inventoryMovements)); }, [inventoryMovements, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_reservations`, JSON.stringify(reservations)); }, [reservations, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_customers`, JSON.stringify(customers)); }, [customers, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_transactions`, JSON.stringify(transactions)); }, [transactions, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_products`, JSON.stringify(products)); }, [products, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_expenses`, JSON.stringify(expenses)); }, [expenses, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_sales`, JSON.stringify(sales)); }, [sales, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_restaurant_orders`, JSON.stringify(orders)); }, [orders, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_restaurant_printers`, JSON.stringify(printers)); }, [printers, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_kitchen_screens`, JSON.stringify(kitchenScreens)); }, [kitchenScreens, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_users`, JSON.stringify(users)); }, [users, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_drivers`, JSON.stringify(drivers)); }, [drivers, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_zones`, JSON.stringify(deliveryZones)); }, [deliveryZones, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_sunat`, JSON.stringify(sunatInvoices)); }, [sunatInvoices, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_daily_menu`, JSON.stringify(dailyMenuItems)); }, [dailyMenuItems, tenantId]);
  useEffect(() => { localStorage.setItem(`${tenantId}_cafetin_role_permissions`, JSON.stringify(rolePermissions)); }, [rolePermissions, tenantId]);

  useEffect(() => {
    const settingsToSave = { ...settings, theme: "light" as const };
    localStorage.setItem(`${tenantId}_cafetin_settings`, JSON.stringify(settingsToSave));
    document.body.classList.remove("dark");
    document.documentElement.classList.remove("dark");
  }, [settings, tenantId]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings, theme: "light" as const };
      svc.saveSettings(tenantId, merged);
      return merged;
    });
  }, [tenantId]);

  const updatePrinters = useCallback((newPrinters: StationPrinter[]) => {
    setPrinters(prev => {
      const newIds = new Set(newPrinters.map(p => p.id));
      prev.forEach(oldP => {
        if (!newIds.has(oldP.id)) {
          svc.deletePrinter(tenantId, oldP.id);
        }
      });
      return newPrinters;
    });
    newPrinters.forEach(p => svc.upsertPrinter(tenantId, p));
  }, [tenantId]);

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o))
    );
    svc.updateOrderStatus(tenantId, orderId, newStatus);
  }, [tenantId]);

  const updateOrder = useCallback((id: string, updates: Partial<RestaurantOrder>) => {
    let updatedOrder: RestaurantOrder | undefined;
    setOrders((prev) => {
      const entry = prev.find(o => o.id === id);
      if (!entry) return prev;
      const updated = { ...entry, ...updates, updatedAt: new Date().toISOString() };
      updatedOrder = updated;
      return prev.map((o) => (o.id === id ? updated : o));
    });
    if (updatedOrder) {
      svc.upsertOrder(tenantId, updatedOrder);
    }
  }, [tenantId]);

  const saveOrderDraft = useCallback((order: RestaurantOrder) => {
    const entry = { ...order, updatedAt: new Date().toISOString() };
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === order.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entry;
        return next;
      }
      return [...prev, entry];
    });
    svc.upsertOrder(tenantId, entry);
  }, [tenantId]);


  const markPreCountPrinted = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, preCountPrinted: true, updatedAt: new Date().toISOString() } : o))
    );
  }, []);

  const createCustomTableOrder = useCallback((customName: string, floor: 1 | 2 | 3 | 4 = 1, dinerCount: number = 2) => {
    const newOrderId = generateUUID();
    const newOrder: RestaurantOrder = {
      id: newOrderId,
      type: "salón",
      floor,
      tableNumber: customName,
      customTableName: customName,
      dinerName: `${customName} (${dinerCount} pers.)`,
      status: "draft",
      items: [],
      total: 0,
      waiterName: currentUser.name || "Mesero",
      posTerminalId: settings.posTerminalId || "POS-01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders((prev) => [...prev, newOrder]);
    svc.upsertOrder(tenantId, newOrder);
    return newOrder;
  }, [currentUser, settings, tenantId]);

  const createDirectSaleOrder = useCallback(() => {
    const saleNo = Date.now().toString().slice(-4);
    const newOrderId = generateUUID();
    const newOrder: RestaurantOrder = {
      id: newOrderId,
      type: "venta_libre",
      floor: 0,
      tableNumber: `Venta Rápida #${saleNo}`,
      dinerName: "Cliente Mostrador / Venta Libre",
      status: "draft",
      items: [],
      total: 0,
      waiterName: currentUser.name || "Cajero Principal",
      posTerminalId: settings.posTerminalId || "POS-01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders((prev) => [...prev, newOrder]);
    svc.upsertOrder(tenantId, newOrder);
    return newOrder;
  }, [currentUser, settings, tenantId]);

  const addInventoryItem = useCallback((item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...item, id: generateUUID() };
    setInventoryItems(prev => [...prev, newItem]);
    svc.upsertInventoryItem(tenantId, newItem);
    return newItem;
  }, [tenantId]);

  const updateInventoryItem = useCallback((id: string, item: Partial<InventoryItem>) => {
    setInventoryItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, ...item } : i);
      const updated = next.find(i => i.id === id);
      if (updated) svc.upsertInventoryItem(tenantId, updated);
      return next;
    });
  }, [tenantId]);

  const deleteInventoryItem = useCallback((id: string) => {
    setInventoryItems(prev => prev.filter(i => i.id !== id));
    svc.deleteInventoryItem(tenantId, id);
  }, [tenantId]);

  const addInventoryMovement = useCallback((movement: Omit<InventoryMovement, 'id' | 'date'>) => {
    const newMovement: InventoryMovement = { ...movement, id: generateUUID(), date: new Date().toISOString() };
    setInventoryMovements(prev => [...prev, newMovement]);
    setInventoryItems(prev => prev.map(i => i.id === movement.itemId ? { ...i, currentStock: i.currentStock + (movement.type === 'in' ? movement.quantity : -movement.quantity) } : i));
    svc.insertInventoryMovement(tenantId, newMovement);
    return newMovement;
  }, [tenantId]);
  
  const addReservation = useCallback((res: Omit<Reservation, 'id'>) => {
    const newRes: Reservation = { ...res, id: generateUUID() };
    setReservations(prev => [...prev, newRes]);
    svc.upsertReservation(tenantId, newRes);
    return newRes;
  }, [tenantId]);

  const updateReservationStatus = useCallback((id: string, status: Reservation['status']) => {
    setReservations(prev => {
      const next = prev.map(r => r.id === id ? { ...r, status } : r);
      const updated = next.find(r => r.id === id);
      if (updated) svc.upsertReservation(tenantId, updated);
      return next;
    });
  }, [tenantId]);

  const deleteReservation = useCallback((id: string) => {
    setReservations(prev => prev.filter(r => r.id !== id));
    svc.deleteReservation(tenantId, id);
  }, [tenantId]);


  const sendOrderToKitchen = useCallback((orderId: string, customStation?: string) => {
    let sentItemsResult: OrderItem[] = [];
    let currentBatch = 1;

    setOrders((prev) => {
      return prev.map((order) => {
        if (order.id !== orderId) return order;

        const maxBatch = Math.max(0, ...order.items.map((i) => i.batchNumber || 1));
        const hasUnsent = order.items.some((i) => !i.sentToKitchen);
        currentBatch = hasUnsent ? maxBatch + 1 : maxBatch;

        const updatedItems = order.items.map((item) => {
          if (!item.sentToKitchen) {
            const newItem = {
              ...item,
              station: customStation && customStation !== 'auto' ? customStation : item.station,
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
    svc.deleteOrder(tenantId, orderId);
  }, [tenantId]);

  const addCustomer = useCallback((name: string, phone?: string, docType?: "DNI" | "RUC", docNumber?: string, address?: string) => {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name,
      phone,
      docType,
      docNumber,
      address,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    svc.upsertCustomer(tenantId, newCustomer);
    return newCustomer;
  }, [tenantId]);

  const updateCustomer = useCallback(
    (id: string, data: Partial<Omit<Customer, "id" | "createdAt">>) => {
      setCustomers((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...data } : c));
        const updated = next.find(c => c.id === id);
        if (updated) svc.upsertCustomer(tenantId, updated);
        return next;
      });
    },
    [tenantId],
  );

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setTransactions((prev) => prev.filter((t) => t.customerId !== id));
    svc.deleteCustomer(tenantId, id);
  }, [tenantId]);

  const addTransaction = useCallback(
    (
      customerId: string,
      type: TransactionType,
      amount: number,
      description: string,
      date?: string,
      paymentMethod?: PaymentMethod,
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
      svc.insertTransaction(tenantId, newTransaction);
      return newTransaction;
    },
    [tenantId],
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
      svc.upsertProduct(tenantId, newProduct);
      return newProduct;
    },
    [tenantId],
  );

  const updateProductStock = useCallback((id: string, newStock?: number) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p));
      const updated = next.find(p => p.id === id);
      if (updated) svc.upsertProduct(tenantId, updated);
      return next;
    });
  }, [tenantId]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem(`${tenantId}_cafetin_products`, JSON.stringify(next));
      return next;
    });
    svc.deleteProduct(tenantId, id);
  }, [tenantId]);

  const addExpense = useCallback(
    (
      description: string,
      amount: number,
      category: string,
      date?: string,
      paymentMethod?: PaymentMethod,
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
      svc.insertExpense(tenantId, newExpense);
      return newExpense;
    },
    [tenantId],
  );

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    svc.deleteExpense(tenantId, id);
  }, [tenantId]);

  const addSale = useCallback(
    (
      items: import("../types").SaleItem[],
      total: number,
      paymentMethod: PaymentMethod,
      customerId?: string,
      tableNumber?: string,
      floor?: number,
      orderType?: "salón" | "delivery" | "para_llevar" | "venta_libre",
      waiterName?: string
    ) => {
      const newSale: import("../types").Sale = {
        id: crypto.randomUUID(),
        customerId,
        items,
        total,
        paymentMethod,
        date: new Date().toISOString(),
        tableNumber,
        floor,
        orderType: orderType || "salón",
        waiterName: waiterName || currentUser.name || "Mesero",
        cashierName: currentUser.name || "Cajero Principal",
        posTerminalId: settings.posTerminalId || "POS-01"
      };
      setSales((prev) => [newSale, ...prev]);

      if (paymentMethod === "A crédito" && customerId) {
        const desc =
          items.length === 1
            ? items[0].productName
            : `Venta Restaurante: ${items.map((i) => i.productName).join(", ")}`;
        const newTransaction: Transaction = {
          id: crypto.randomUUID(),
          customerId,
          type: "charge",
          amount: total,
          description: desc,
          date: new Date().toISOString(),
        };
        setTransactions((prev) => [...prev, newTransaction]);
        svc.insertTransaction(tenantId, newTransaction);
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
    [currentUser, settings.posTerminalId, tenantId],
  );

  // ── Helpers para Usuarios ──
  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    const newId = generateUUID();
    const newUser: User = { ...user, id: newId, createdAt: new Date().toISOString() };
    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem(`${tenantId}_cafetin_users`, JSON.stringify(updated));
      return updated;
    });
    svc.upsertUser(tenantId, newUser);

    // Si el usuario es Repartidor, vincularlo automáticamente como chofer activo
    if (user.role === 'Repartidor') {
      const newDriver: DeliveryDriver = {
        id: `drv-${newId.slice(0, 8)}`,
        userId: newId,
        name: user.name,
        phone: user.phone || '987000000',
        vehicleType: 'Moto',
        status: 'disponible',
        activeOrdersCount: 0,
        isOnline: true,
      };
      setDrivers(prev => {
        const next = [...prev, newDriver];
        localStorage.setItem(`${tenantId}_cafetin_drivers`, JSON.stringify(next));
        return next;
      });
      svc.upsertDriver(tenantId, newDriver);
    }
  }, [tenantId]);

  const updateUser = useCallback((id: string, user: Partial<User>) => {
    let updatedUser: User | undefined;
    setUsers(prev => {
      const target = prev.find(u => u.id === id);
      if (!target) return prev;
      const updated = { ...target, ...user };
      updatedUser = updated;
      const next = prev.map(u => u.id === id ? updated : u);
      localStorage.setItem(`${tenantId}_cafetin_users`, JSON.stringify(next));
      return next;
    });
    if (updatedUser) {
      svc.upsertUser(tenantId, updatedUser);
      // Si el rol es repartidor o cambió de nombre/teléfono, sincronizar chofer
      setDrivers(prev => {
        const driver = prev.find(d => d.userId === id || d.name === updatedUser?.name);
        if (driver && updatedUser) {
          const updDriver: DeliveryDriver = {
            ...driver,
            name: updatedUser.name || driver.name,
            phone: updatedUser.phone || driver.phone,
          };
          svc.upsertDriver(tenantId, updDriver);
          return prev.map(d => d.id === driver.id ? updDriver : d);
        }
        return prev;
      });
    }
  }, [tenantId]);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => {
      const next = prev.filter(u => u.id !== id);
      localStorage.setItem(`${tenantId}_cafetin_users`, JSON.stringify(next));
      return next;
    });
    svc.deleteUser(tenantId, id);
    // Eliminar también chofer vinculado si existía
    setDrivers(prev => {
      const driver = prev.find(d => d.userId === id);
      if (driver) {
        svc.deleteDriver(tenantId, driver.id);
        const next = prev.filter(d => d.id !== driver.id);
        localStorage.setItem(`${tenantId}_cafetin_drivers`, JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [tenantId]);

  // ── Helpers para Motorizados & GPS ──
  const addDriver = useCallback((driver: Omit<DeliveryDriver, 'id' | 'activeOrdersCount'>) => {
    const newDriver: DeliveryDriver = { ...driver, id: `drv-${Date.now()}`, activeOrdersCount: 0 };
    setDrivers(prev => [...prev, newDriver]);
    svc.upsertDriver(tenantId, newDriver);
  }, [tenantId]);

  const updateDriver = useCallback((id: string, driver: Partial<DeliveryDriver>) => {
    setDrivers(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...driver } : d);
      const updated = next.find(d => d.id === id);
      if (updated) svc.upsertDriver(tenantId, updated);
      return next;
    });
  }, [tenantId]);

  const closeOrderAndPay = useCallback(
    (
      orderId: string, 
      paymentInput: PaymentMethod | { method: PaymentMethod; amount: number }[] | { method: PaymentMethod; amount: number }, 
      customerId?: string, 
      docType?: "Boleta" | "Factura" | "Nota de Venta", 
      docNumber?: string
    ) => {
      setOrders((prev) => {
        const target = prev.find((o) => o.id === orderId);
        if (!target) return prev;

        // Normalizar pagos en una lista válida de métodos y montos
        let paymentList: { method: PaymentMethod; amount: number }[] = [];
        if (typeof paymentInput === 'string') {
          paymentList = [{ method: paymentInput as PaymentMethod, amount: target.total }];
        } else if (Array.isArray(paymentInput)) {
          paymentList = paymentInput.length > 0 ? paymentInput : [{ method: 'Efectivo', amount: target.total }];
        } else if (paymentInput && typeof paymentInput === 'object') {
          paymentList = [paymentInput as { method: PaymentMethod; amount: number }];
        } else {
          paymentList = [{ method: 'Efectivo', amount: target.total }];
        }

        // Auto-descuento en Inventario
        if (Array.isArray(target.items)) {
          target.items.forEach(item => {
            const matchingInventoryItem = (inventoryItems || []).find(inv => 
              inv.name.toLowerCase() === item.productName.toLowerCase() || 
              inv.name.toLowerCase().includes(item.productName.toLowerCase())
            );
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
        }

        const saleItems = (target.items || []).map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes,
        }));

        // Registrar Venta
        paymentList.forEach(payment => {
          addSale(
            saleItems, 
            payment.amount, 
            payment.method, 
            customerId || target.customerId, 
            target.tableNumber, 
            target.floor, 
            target.type, 
            target.waiterName
          );
        });

        // Generar Comprobante SUNAT si es Boleta o Factura
        if (docType === "Boleta" || docType === "Factura") {
          const subtotal = Number((target.total / 1.18).toFixed(2));
          const igv = Number((target.total - subtotal).toFixed(2));
          const config = getSunatConfig(tenantId);
          const series = docType === "Factura" ? config.facturaSeries : config.boletaSeries;
          const number = String((sunatInvoices || []).length + 1).padStart(6, '0');
          const hash = generateCanonicalHash(`${config.ruc}-${series}-${number}-${target.total}-${Date.now()}`);
          
          const newSunatDoc: SunatInvoice = {
            id: `sunat-${Date.now()}`,
            orderId: target.id,
            type: docType,
            series,
            number,
            date: new Date().toISOString(),
            customerName: target.dinerName || "Cliente General",
            customerDocType: docType === "Factura" ? "RUC" : (docNumber && docNumber.length === 8 ? "DNI" : "Sin Documento"),
            customerDocNumber: docNumber || (docType === "Factura" ? "20601234567" : "00000000"),
            subtotal,
            igv,
            total: target.total,
            status: "Aceptado",
            hash,
            paymentMethod: paymentList[0]?.method || "Efectivo",
            items: target.items || [],
            tenant_id: tenantId,
            cdrResponseCode: '0',
            cdrDescription: `Comprobante ${series}-${number} aceptado por SUNAT.`,
          };

          newSunatDoc.qrCode = buildSunatQRString({
            ruc: config.ruc,
            type: docType,
            series,
            number,
            igv,
            total: target.total,
            date: newSunatDoc.date,
            customerDocType: newSunatDoc.customerDocType,
            customerDocNumber: newSunatDoc.customerDocNumber,
            hash,
          });

          setSunatInvoices(s => {
            const updated = [newSunatDoc, ...s];
            localStorage.setItem(`${tenantId}_cafetin_sunat_invoices`, JSON.stringify(updated));
            return updated;
          });
          svc.insertSunatInvoice(tenantId, newSunatDoc);
        }

        // Marcar el pedido como pagado
        svc.updateOrderStatus(tenantId, orderId, 'paid');
        return prev.filter((o) => o.id !== orderId);
      });
    },
    [inventoryItems, addInventoryMovement, sunatInvoices?.length, tenantId, addSale]
  );


  const updateDriverGpsLocation = useCallback((driverId: string, lat: number, lng: number, isOnline: boolean = true) => {

    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        return {
          ...d,
          currentLat: lat,
          currentLng: lng,
          lastGpsUpdate: new Date().toISOString(),
          isOnline,
        };
      }
      return d;
    }));
  }, []);

  const linkDriverToUser = useCallback((driverId: string, userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setDrivers(prev => prev.map(d => {
      if (d.id === driverId) {
        return {
          ...d,
          userId,
          username: targetUser?.username,
          userEmail: targetUser?.email,
          name: targetUser ? targetUser.name : d.name,
          phone: targetUser?.phone || d.phone,
        };
      }
      return d;
    }));
  }, [users]);

  const updateOrderRoute = useCallback((orderId: string, route: import("../types").RouteInfo, address?: string, coords?: [number, number]) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          routeDistanceKm: route.distanceKm,
          routeDurationMins: route.durationMinutes,
          routeGeometry: route.geometry,
          routeSummary: route.summary,
          ...(address ? { deliveryAddress: address } : {}),
          ...(coords ? { deliveryLat: coords[0], deliveryLng: coords[1] } : {}),
          updatedAt: new Date().toISOString(),
        };
      }
      return o;
    }));
  }, []);

  const deleteDriver = useCallback((id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
    svc.deleteDriver(tenantId, id);
  }, [tenantId]);

  // ── Helpers para Zonas de Delivery ──
  const addDeliveryZone = useCallback((zone: Omit<DeliveryZone, 'id'>) => {
    const newZone: DeliveryZone = { ...zone, id: generateUUID() };
    setDeliveryZones(prev => [...prev, newZone]);
    svc.upsertDeliveryZone(tenantId, newZone);
    return newZone;
  }, [tenantId]);

  const updateDeliveryZone = useCallback((id: string, zone: Partial<DeliveryZone>) => {
    setDeliveryZones(prev => {
      const next = prev.map(z => z.id === id ? { ...z, ...zone } : z);
      const updated = next.find(z => z.id === id);
      if (updated) svc.upsertDeliveryZone(tenantId, updated);
      return next;
    });
  }, [tenantId]);

  const deleteDeliveryZone = useCallback((id: string) => {
    setDeliveryZones(prev => prev.filter(z => z.id !== id));
    svc.deleteDeliveryZone(tenantId, id);
  }, [tenantId]);

  // ── Helpers para SUNAT ──
  const createSunatInvoice = useCallback((inv: Omit<SunatInvoice, 'id' | 'hash'>) => {
    const newDoc: SunatInvoice = {
      ...inv,
      id: generateUUID(),
      hash: Math.random().toString(36).substring(2, 12),
    };
    setSunatInvoices(prev => [newDoc, ...prev]);
    svc.insertSunatInvoice(tenantId, newDoc);
    return newDoc;
  }, [tenantId]);

  const updateSunatInvoiceStatus = useCallback((id: string, status: SunatInvoice['status']) => {
    setSunatInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
  }, []);

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

  // ── Daily Menu CRUD ──
  const addDailyMenuItem = useCallback((item: DailyMenuItem) => {
    const newItem = { ...item, id: ensureUUID(item.id) };
    setDailyMenuItems(prev => [...prev, newItem]);
    svc.upsertDailyMenuItem(tenantId, newItem);
    return newItem;
  }, [tenantId]);

  const updateDailyMenuItem = useCallback((id: string, updates: Partial<DailyMenuItem>) => {
    setDailyMenuItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, ...updates } : i);
      const updated = next.find(i => i.id === id);
      if (updated) svc.upsertDailyMenuItem(tenantId, updated);
      return next;
    });
  }, [tenantId]);

  const deleteDailyMenuItem = useCallback((id: string) => {
    setDailyMenuItems(prev => prev.filter(i => i.id !== id));
    svc.deleteDailyMenuItem(tenantId, id);
  }, [tenantId]);

  const resetDailyMenuItems = useCallback(() => {
    const defaultSet = tenantId === 'paradero' ? DEFAULT_DAILY_MENU_ITEMS_PARADERO : DEFAULT_DAILY_MENU_ITEMS_LASLOMAS;
    setDailyMenuItems(defaultSet);
    defaultSet.forEach(item => svc.upsertDailyMenuItem(tenantId, item));
  }, [tenantId]);

  // ── Role Permissions CRUD ──
  const updateRolePermission = useCallback((role: RoleType, module: AppModuleKey, enabled: boolean) => {
    setRolePermissions(prev => {
      const currentList = prev[role] || [];
      const updatedList = enabled
        ? (currentList.includes(module) ? currentList : [...currentList, module])
        : currentList.filter(m => m !== module);
      const nextConfig = {
        ...prev,
        [role]: updatedList
      };
      svc.saveRolePermissions(tenantId, nextConfig);
      return nextConfig;
    });
  }, [tenantId]);

  const resetRolePermissions = useCallback(() => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    svc.saveRolePermissions(tenantId, DEFAULT_ROLE_PERMISSIONS);
  }, [tenantId]);

  // ── Kitchen Display Screens (Multi-KDS) CRUD ──
  const addKitchenScreen = useCallback((screen: Omit<KitchenScreen, 'id'>) => {
    const newScreen: KitchenScreen = {
      ...screen,
      id: `kds-${Date.now()}`
    };
    setKitchenScreens(prev => [...prev, newScreen]);
    return newScreen;
  }, []);

  const updateKitchenScreen = useCallback((id: string, updates: Partial<KitchenScreen>) => {
    setKitchenScreens(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteKitchenScreen = useCallback((id: string) => {
    setKitchenScreens(prev => prev.filter(s => s.id !== id));
  }, []);

  const resetKitchenScreens = useCallback(() => {
    setKitchenScreens(DEFAULT_KITCHEN_SCREENS);
  }, []);

  const toggleItemPrepared = useCallback((orderId: string, itemId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = order.items.map(item => {
        if (item.id === itemId) {
          const isPrepared = !item.prepared;
          return {
            ...item,
            prepared: isPrepared,
            preparedAt: isPrepared ? new Date().toISOString() : undefined
          };
        }
        return item;
      });
      return {
        ...order,
        items: updatedItems,
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  const markOrderServed = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        status: "served",
        items: order.items.map(i => ({ ...i, prepared: true, preparedAt: i.preparedAt || new Date().toISOString() })),
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  const hasPermission = useCallback((module: AppModuleKey, roleToCheck?: RoleType): boolean => {
    // Si se especifica un rol a chequear explícitamente
    if (roleToCheck) {
      if (roleToCheck === 'Owner') return true;
      if (module === 'staff') return false;
      if (module === 'role_permissions') return roleToCheck === 'Administrador';
      const allowed = rolePermissions[roleToCheck] || [];
      return allowed.includes(module);
    }

    // Modo simulación de rol activo para el Owner
    const isOwner = currentUser.role === 'Owner';
    const effectiveRole = isOwner && ownerSimulatedRole ? ownerSimulatedRole : currentUser.role;

    // Si el rol efectivo es Owner (modo real sin simular), tiene acceso irrestricto y absoluto
    if (effectiveRole === 'Owner') return true;

    // Personal & Turnos: exclusivo para Owner real (oculto en simulación)
    if (module === 'staff') return isOwner && !ownerSimulatedRole;

    // Gobernanza de Roles: configurable por Owner y Administrador
    if (module === 'role_permissions') {
      return isOwner || effectiveRole === 'Administrador';
    }

    // Para todos los demás módulos y roles, consultar la matriz configurada
    const allowed = rolePermissions[effectiveRole] || [];
    return allowed.includes(module);
  }, [currentUser.role, ownerSimulatedRole, rolePermissions]);

  const addPromotion = useCallback((promo: Omit<Promotion, 'id' | 'usageCount'>) => {
    const newPromo: Promotion = {
      ...promo,
      id: ensureUUID(Date.now().toString()),
      usageCount: 0,
      tenant_id: tenantId,
    };
    svc.upsertPromotion(tenantId, newPromo);
    setPromotions(prev => {
      const updated = [newPromo, ...prev];
      localStorage.setItem(`${tenantId}_cafetin_promotions`, JSON.stringify(updated));
      return updated;
    });
  }, [tenantId]);

  const updatePromotion = useCallback((id: string, partial: Partial<Promotion>) => {
    setPromotions(prev => {
      const target = prev.find(p => p.id === id);
      if (target) {
        svc.upsertPromotion(tenantId, { ...target, ...partial });
      }
      const updated = prev.map(p => p.id === id ? { ...p, ...partial } : p);
      localStorage.setItem(`${tenantId}_cafetin_promotions`, JSON.stringify(updated));
      return updated;
    });
  }, [tenantId]);

  const deletePromotion = useCallback((id: string) => {
    svc.deletePromotion(tenantId, id);
    setPromotions(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem(`${tenantId}_cafetin_promotions`, JSON.stringify(updated));
      return updated;
    });
  }, [tenantId]);

  return {
    inventoryItems,
    inventoryMovements,
    reservations,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addInventoryMovement,
    addReservation,
    updateReservationStatus,
    deleteReservation,
    customers,
    transactions,
    products,
    expenses,
    sales,
    orders,
    printers,
    settings,
    users,
    drivers,
    deliveryZones,
    sunatInvoices,
    currentUser,
    setCurrentUser,
    updateSettings,
    updatePrinters,
    updateOrderStatus,
    saveOrderDraft,
    updateOrder,
    sendOrderToKitchen,
    deleteOrder,
    closeOrderAndPay,
    markPreCountPrinted,
    createCustomTableOrder,
    createDirectSaleOrder,
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
    addUser,
    updateUser,
    deleteUser,
    addDriver,
    updateDriver,
    updateDriverGpsLocation,
    linkDriverToUser,
    updateOrderRoute,
    deleteDriver,
    addDeliveryZone,
    updateDeliveryZone,
    deleteDeliveryZone,
    createSunatInvoice,
    updateSunatInvoiceStatus,
    getCustomerBalance,
    getTotalReceivables,
    dailyMenuItems,
    addDailyMenuItem,
    updateDailyMenuItem,
    deleteDailyMenuItem,
    resetDailyMenuItems,
    promotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    rolePermissions,
    updateRolePermission,
    resetRolePermissions,
    kitchenScreens,
    addKitchenScreen,
    updateKitchenScreen,
    deleteKitchenScreen,
    resetKitchenScreens,
    toggleItemPrepared,
    markOrderServed,
    hasPermission,
    ownerSimulatedRole,
    setOwnerSimulatedRole: changeOwnerSimulatedRole,
    tenantId,
    isLoadingFromDB,
    syncWithSupabase,
    isManualSyncing,
    lastSyncTime,
  };
}
