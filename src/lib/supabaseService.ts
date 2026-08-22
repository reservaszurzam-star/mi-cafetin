/**
 * supabaseService.ts
 * ─────────────────────────────────────────────
 * Capa de servicio que envuelve todas las consultas a Supabase.
 * La app React llama a estas funciones en lugar de leer/escribir localStorage.
 *
 * Patrón: cada función recibe (db, tenantId, …) donde `db` es el cliente
 * obtenido con getSupabaseForTenant(tenantId).
 * ─────────────────────────────────────────────
 */

import { getSupabaseForTenant } from './supabaseClient';
import { generateUUID } from './utils';
import type {
  Customer,
  Transaction,
  Product,
  Settings,
  Expense,
  RestaurantOrder,
  OrderItem,
  StationPrinter,
  InventoryItem,
  InventoryMovement,
  Reservation,
  User,
  DeliveryDriver,
  DeliveryZone,
  SunatInvoice,
  DailyMenuItem,
  RolePermissionConfig,
  RoleType,
} from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureUUID(val: string | undefined | null): string {
  if (val && UUID_REGEX.test(val)) return val;
  return generateUUID();
}

function db(tenantId: string) {
  return getSupabaseForTenant(tenantId);
}

function handleError(label: string, error: unknown) {
  console.warn(`[Supabase:${label}]`, error);
}

// ─── TENANTS / SETTINGS ──────────────────────────────────────────────────────

export async function fetchSettings(tenantId: string): Promise<Settings | null> {
  const { data, error } = await db(tenantId)
    .from('settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) { handleError('fetchSettings', error); return null; }
  if (!data) return null;

  return {
    theme: 'light',
    companyName: tenantId === 'paradero' ? 'Paradero 104' : 'Las Lomas Grill',
    currency: 'S/',
    lowStockThreshold:          data.low_stock_threshold,
    overdueDaysThreshold:       data.overdue_days_threshold,
    kitchenDelayThresholdMins:  data.kitchen_delay_threshold_mins,
    deliveryDelayThresholdMins: data.delivery_delay_threshold_mins,
    soundAlertsEnabled:         data.sound_alerts_enabled,
    autoSendToKitchen:          data.auto_send_to_kitchen,
    enablePreCountPrint:        data.enable_pre_count_print,
    showPaymentQR:              data.show_payment_qr,
    printBankDetailsOnTicket:   data.print_bank_details_on_ticket,
    defaultDeliveryCost:        data.default_delivery_cost,
    posTerminalId:              data.pos_terminal_id,
    paymentDetails: {
      yape:              data.yape_number,
      yapeHolder:        data.yape_holder,
      yapeActive:        data.yape_active,
      plin:              data.plin_number,
      plinHolder:        data.plin_holder,
      plinActive:        data.plin_active,
      bankName:          data.bank_name,
      bankAccount:       data.bank_account,
      bankCci:           data.bank_cci,
      bankHolder:        data.bank_holder,
      bankActive:        data.bank_active,
      posProvider:       data.pos_provider,
      posTerminalCode:   data.pos_terminal_code,
      posCommissionRate: data.pos_commission_rate,
      posActive:         data.pos_active,
      cashActive:        data.cash_active,
    },
  };
}

export async function saveSettings(tenantId: string, s: Partial<Settings>): Promise<void> {
  const row: Record<string, unknown> = {
    tenant_id:                    tenantId,
    low_stock_threshold:          s.lowStockThreshold,
    overdue_days_threshold:       s.overdueDaysThreshold,
    kitchen_delay_threshold_mins: s.kitchenDelayThresholdMins,
    delivery_delay_threshold_mins:s.deliveryDelayThresholdMins,
    sound_alerts_enabled:         s.soundAlertsEnabled,
    auto_send_to_kitchen:         s.autoSendToKitchen,
    enable_pre_count_print:       s.enablePreCountPrint,
    show_payment_qr:              s.showPaymentQR,
    print_bank_details_on_ticket: s.printBankDetailsOnTicket,
    default_delivery_cost:        s.defaultDeliveryCost,
    pos_terminal_id:              s.posTerminalId,
    ...(s.paymentDetails ? {
      yape_number:       s.paymentDetails.yape,
      yape_holder:       s.paymentDetails.yapeHolder,
      yape_active:       s.paymentDetails.yapeActive,
      plin_number:       s.paymentDetails.plin,
      plin_holder:       s.paymentDetails.plinHolder,
      plin_active:       s.paymentDetails.plinActive,
      bank_name:         s.paymentDetails.bankName,
      bank_account:      s.paymentDetails.bankAccount,
      bank_cci:          s.paymentDetails.bankCci,
      bank_holder:       s.paymentDetails.bankHolder,
      bank_active:       s.paymentDetails.bankActive,
      pos_provider:      s.paymentDetails.posProvider,
      pos_terminal_code: s.paymentDetails.posTerminalCode,
      pos_commission_rate: s.paymentDetails.posCommissionRate,
      pos_active:        s.paymentDetails.posActive,
      cash_active:       s.paymentDetails.cashActive,
    } : {}),
    updated_at: new Date().toISOString(),
  };
  // Remove undefined keys
  Object.keys(row).forEach(k => row[k] === undefined && delete row[k]);
  const { error } = await db(tenantId).from('settings').upsert(row, { onConflict: 'tenant_id' });
  if (error) handleError('saveSettings', error);
}

// ─── USERS ───────────────────────────────────────────────────────────────────

function mapDbUser(u: Record<string, unknown>): User {
  return {
    id:         u.id as string,
    name:       u.name as string,
    username:   u.username as string,
    pin:        u.pin as string,
    role:       u.role as RoleType,
    phone:      u.phone as string | undefined,
    email:      u.email as string | undefined,
    active:     u.active as boolean,
    avatarUrl:  u.avatar_url as string | undefined,
    createdAt:  u.created_at as string,
    supabaseId: u.supabase_id as string | undefined,
  };
}

export async function fetchUsers(tenantId: string): Promise<User[]> {
  const { data, error } = await db(tenantId)
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at');
  if (error) { handleError('fetchUsers', error); return []; }
  return (data ?? []).map(mapDbUser);
}

export async function loginByPin(tenantId: string, username: string, pin: string): Promise<User | null> {
  const { data, error } = await db(tenantId).rpc('login_by_pin', {
    p_tenant_id: tenantId,
    p_username:  username,
    p_pin:       pin,
  });
  if (error || !data || data.length === 0) { handleError('loginByPin', error); return null; }
  return mapDbUser(data[0]);
}

export async function upsertUser(tenantId: string, user: User): Promise<void> {
  const row = {
    id:         user.id,
    tenant_id:  tenantId,
    name:       user.name,
    username:   user.username,
    pin:        user.pin,
    role:       user.role,
    phone:      user.phone,
    email:      user.email,
    active:     user.active,
    avatar_url: user.avatarUrl,
  };
  const { error } = await db(tenantId).from('users').upsert(row, { onConflict: 'id' });
  if (error) handleError('upsertUser', error);
}

export async function deleteUser(tenantId: string, userId: string): Promise<void> {
  const { error } = await db(tenantId).from('users').delete().eq('id', userId).eq('tenant_id', tenantId);
  if (error) handleError('deleteUser', error);
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

function mapDbCustomer(c: Record<string, unknown>): Customer {
  return {
    id:          c.id as string,
    name:        c.name as string,
    phone:       c.phone as string | undefined,
    docType:     c.doc_type as 'DNI' | 'RUC' | undefined,
    docNumber:   c.doc_number as string | undefined,
    address:     c.address as string | undefined,
    email:       c.email as string | undefined,
    points:      (c.points as number) ?? 0,
    creditLimit: c.credit_limit as number | undefined,
    birthday:    c.birthday as string | undefined,
    notes:       c.notes as string | undefined,
    tier:        (c.tier as Customer['tier']) ?? 'Bronce',
    createdAt:   c.created_at as string,
  };
}

export async function fetchCustomers(tenantId: string): Promise<Customer[]> {
  const { data, error } = await db(tenantId)
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) { handleError('fetchCustomers', error); return []; }
  return (data ?? []).map(mapDbCustomer);
}

export async function upsertCustomer(tenantId: string, c: Customer): Promise<void> {
  const row = {
    id: c.id, tenant_id: tenantId, name: c.name, phone: c.phone,
    doc_type: c.docType, doc_number: c.docNumber, address: c.address,
    email: c.email, points: c.points ?? 0, credit_limit: c.creditLimit ?? 0,
    birthday: c.birthday ?? null, notes: c.notes, tier: c.tier ?? 'Bronce',
  };
  const { error } = await db(tenantId).from('customers').upsert(row, { onConflict: 'id' });
  if (error) handleError('upsertCustomer', error);
}

export async function deleteCustomer(tenantId: string, id: string): Promise<void> {
  const { error } = await db(tenantId).from('customers').delete().eq('id', id).eq('tenant_id', tenantId);
  if (error) handleError('deleteCustomer', error);
}

// ─── CREDIT TRANSACTIONS (FIADOS) ────────────────────────────────────────────

function mapDbTransaction(t: Record<string, unknown>): Transaction {
  return {
    id:            t.id as string,
    customerId:    t.customer_id as string,
    type:          t.type as Transaction['type'],
    amount:        t.amount as number,
    description:   t.description as string,
    date:          t.date as string,
    paymentMethod: t.payment_method as Transaction['paymentMethod'],
  };
}

export async function fetchTransactions(tenantId: string): Promise<Transaction[]> {
  const { data, error } = await db(tenantId)
    .from('credit_transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });
  if (error) { handleError('fetchTransactions', error); return []; }
  return (data ?? []).map(mapDbTransaction);
}

export async function insertTransaction(tenantId: string, t: Transaction): Promise<void> {
  const row = {
    id: t.id, tenant_id: tenantId, customer_id: t.customerId,
    type: t.type, amount: t.amount, description: t.description,
    payment_method: t.paymentMethod, date: t.date,
  };
  const { error } = await db(tenantId).from('credit_transactions').insert(row);
  if (error) handleError('insertTransaction', error);
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

function mapDbProduct(p: Record<string, unknown>): Product {
  return {
    id:       p.id as string,
    name:     p.name as string,
    price:    p.price as number,
    category: p.category as string,
    station:  p.station as string | undefined,
    stock:    p.stock as number | undefined,
  };
}

export async function fetchProducts(tenantId: string): Promise<Product[]> {
  const { data, error } = await db(tenantId)
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .order('category');
  if (error) { handleError('fetchProducts', error); return []; }
  return (data ?? []).map(mapDbProduct);
}

export async function upsertProduct(tenantId: string, p: Product): Promise<void> {
  const row = {
    id: p.id, tenant_id: tenantId, name: p.name, price: p.price,
    category: p.category, station: p.station, stock: p.stock ?? null,
  };
  const { error } = await db(tenantId).from('products').upsert(row, { onConflict: 'id' });
  if (error) handleError('upsertProduct', error);
}

export async function deleteProduct(tenantId: string, id: string): Promise<void> {
  const { error } = await db(tenantId).from('products').update({ active: false }).eq('id', id).eq('tenant_id', tenantId);
  if (error) handleError('deleteProduct', error);
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

function mapDbOrderItem(i: Record<string, unknown>): OrderItem {
  return {
    id:             i.id as string,
    productId:      i.product_id as string,
    productName:    i.product_name as string,
    quantity:       i.quantity as number,
    price:          i.price as number,
    notes:          i.notes as string | undefined,
    station:        i.station as string,
    sentToKitchen:  i.sent_to_kitchen as boolean,
    sentAt:         i.sent_at as string | undefined,
    batchNumber:    i.batch_number as number,
  };
}

function mapDbOrder(o: Record<string, unknown>): RestaurantOrder {
  const items = Array.isArray(o.order_items)
    ? (o.order_items as Record<string, unknown>[]).map(mapDbOrderItem)
    : [];
  return {
    id:               o.id as string,
    type:             o.type as RestaurantOrder['type'],
    floor:            o.floor as RestaurantOrder['floor'],
    tableNumber:      o.table_number as string,
    customTableName:  o.custom_table_name as string | undefined,
    dinerName:        o.diner_name as string | undefined,
    customerId:       o.customer_id as string | undefined,
    customerPhone:    o.customer_phone as string | undefined,
    deliveryAddress:  o.delivery_address as string | undefined,
    deliveryLat:      o.delivery_lat as number | undefined,
    deliveryLng:      o.delivery_lng as number | undefined,
    routeDistanceKm:  o.route_distance_km as number | undefined,
    routeDurationMins:o.route_duration_mins as number | undefined,
    deliveryCost:     o.delivery_cost as number | undefined,
    deliveryPlatform: o.delivery_platform as RestaurantOrder['deliveryPlatform'],
    driverId:         o.driver_id as string | undefined,
    driverName:       o.driver_name as string | undefined,
    status:           o.status as RestaurantOrder['status'],
    items,
    total:            o.total as number,
    notes:            o.notes as string | undefined,
    waiterName:       o.waiter_name as string | undefined,
    posTerminalId:    o.pos_terminal_id as string | undefined,
    preCountPrinted:  o.pre_count_printed as boolean | undefined,
    createdAt:        o.created_at as string,
    updatedAt:        o.updated_at as string,
  };
}

export async function fetchOrders(tenantId: string): Promise<RestaurantOrder[]> {
  const { data, error } = await db(tenantId)
    .from('orders')
    .select('*, order_items(*)')
    .eq('tenant_id', tenantId)
    .not('status', 'in', '(paid,cancelled)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) { handleError('fetchOrders', error); return []; }
  return (data ?? []).map(o => mapDbOrder(o as Record<string, unknown>));
}

export async function upsertOrder(tenantId: string, order: RestaurantOrder): Promise<void> {
  const client = db(tenantId);
  const validOrderId = ensureUUID(order.id);

  const orderRow = {
    id:                validOrderId,
    tenant_id:         tenantId,
    type:              order.type,
    floor:             order.floor,
    table_number:      order.tableNumber,
    custom_table_name: order.customTableName ?? null,
    diner_name:        order.dinerName ?? null,
    customer_id:       order.customerId && UUID_REGEX.test(order.customerId) ? order.customerId : null,
    customer_phone:    order.customerPhone ?? null,
    delivery_address:  order.deliveryAddress ?? null,
    delivery_lat:      order.deliveryLat ?? null,
    delivery_lng:      order.deliveryLng ?? null,
    route_distance_km: order.routeDistanceKm ?? null,
    route_duration_mins: order.routeDurationMins ?? null,
    delivery_cost:     order.deliveryCost ?? null,
    delivery_platform: order.deliveryPlatform ?? null,
    driver_id:         order.driverId && UUID_REGEX.test(order.driverId) ? order.driverId : null,
    driver_name:       order.driverName ?? null,
    status:            order.status,
    total:             order.total,
    notes:             order.notes ?? null,
    waiter_name:       order.waiterName ?? null,
    pos_terminal_id:   order.posTerminalId ?? null,
    pre_count_printed: order.preCountPrinted ?? false,
    updated_at:        new Date().toISOString(),
  };

  const { error: orderErr } = await client.from('orders').upsert(orderRow, { onConflict: 'id' });
  if (orderErr) { handleError('upsertOrder:order', orderErr); return; }

  // Upsert items
  if (order.items && order.items.length > 0) {
    const itemRows = order.items.map(i => ({
      id:             ensureUUID(i.id),
      order_id:       validOrderId,
      product_id:     i.productId && UUID_REGEX.test(i.productId) ? i.productId : null,
      product_name:   i.productName,
      quantity:       i.quantity,
      price:          i.price,
      notes:          i.notes ?? null,
      station:        i.station ?? null,
      sent_to_kitchen:i.sentToKitchen ?? false,
      sent_at:        i.sentAt ?? null,
      batch_number:   i.batchNumber ?? 1,
    }));
    const { error: itemErr } = await client.from('order_items').upsert(itemRows, { onConflict: 'id' });
    if (itemErr) handleError('upsertOrder:items', itemErr);
  }
}

export async function updateOrderStatus(tenantId: string, orderId: string, status: RestaurantOrder['status']): Promise<void> {
  const { error } = await db(tenantId)
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('tenant_id', tenantId);
  if (error) handleError('updateOrderStatus', error);
}

export async function deleteOrder(tenantId: string, orderId: string): Promise<void> {
  const { error } = await db(tenantId).from('orders').delete().eq('id', orderId).eq('tenant_id', tenantId);
  if (error) handleError('deleteOrder', error);
}

// ─── EXPENSES ────────────────────────────────────────────────────────────────

function mapDbExpense(e: Record<string, unknown>): Expense {
  return {
    id:            e.id as string,
    description:   e.description as string,
    amount:        e.amount as number,
    category:      e.category as string,
    date:          e.date as string,
    paymentMethod: e.payment_method as Expense['paymentMethod'],
  };
}

export async function fetchExpenses(tenantId: string): Promise<Expense[]> {
  const { data, error } = await db(tenantId)
    .from('expenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });
  if (error) { handleError('fetchExpenses', error); return []; }
  return (data ?? []).map(mapDbExpense);
}

export async function insertExpense(tenantId: string, e: Expense): Promise<void> {
  const { error } = await db(tenantId).from('expenses').insert({
    id: e.id, tenant_id: tenantId, description: e.description,
    amount: e.amount, category: e.category, payment_method: e.paymentMethod, date: e.date,
  });
  if (error) handleError('insertExpense', error);
}

export async function deleteExpense(tenantId: string, id: string): Promise<void> {
  const { error } = await db(tenantId).from('expenses').delete().eq('id', id).eq('tenant_id', tenantId);
  if (error) handleError('deleteExpense', error);
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────

function mapDbInventoryItem(i: Record<string, unknown>): InventoryItem {
  return {
    id:           i.id as string,
    name:         i.name as string,
    unit:         i.unit as string,
    currentStock: i.current_stock as number,
    minStock:     i.min_stock as number,
    costPerUnit:  i.cost_per_unit as number,
    category:     i.category as string,
  };
}

export async function fetchInventoryItems(tenantId: string): Promise<InventoryItem[]> {
  const { data, error } = await db(tenantId)
    .from('inventory_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) { handleError('fetchInventoryItems', error); return []; }
  return (data ?? []).map(mapDbInventoryItem);
}

export async function upsertInventoryItem(tenantId: string, item: InventoryItem): Promise<void> {
  const { error } = await db(tenantId).from('inventory_items').upsert({
    id: item.id, tenant_id: tenantId, name: item.name, unit: item.unit,
    current_stock: item.currentStock, min_stock: item.minStock,
    cost_per_unit: item.costPerUnit, category: item.category,
  }, { onConflict: 'id' });
  if (error) handleError('upsertInventoryItem', error);
}

export async function insertInventoryMovement(tenantId: string, m: InventoryMovement): Promise<void> {
  const { error } = await db(tenantId).from('inventory_movements').insert({
    id: m.id, tenant_id: tenantId, item_id: m.itemId, type: m.type,
    quantity: m.quantity, reason: m.reason,
    reference_order_id: m.referenceOrderId ?? null, date: m.date,
  });
  if (error) handleError('insertInventoryMovement', error);
}

// ─── PRINTERS ────────────────────────────────────────────────────────────────

function mapDbPrinter(p: Record<string, unknown>): StationPrinter {
  return {
    id:             p.id as string,
    name:           p.name as string,
    station:        p.station as string,
    categories:     p.categories as string[],
    connectionType: p.connection_type as StationPrinter['connectionType'],
    ipAddress:      p.ip_address as string | undefined,
    status:         p.status as StationPrinter['status'],
    autoPrint:      p.auto_print as boolean | undefined,
    paperWidth:     p.paper_width as StationPrinter['paperWidth'],
  };
}

export async function fetchPrinters(tenantId: string): Promise<StationPrinter[]> {
  const { data, error } = await db(tenantId)
    .from('printers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) { handleError('fetchPrinters', error); return []; }
  return (data ?? []).map(mapDbPrinter);
}

export async function upsertPrinter(tenantId: string, p: StationPrinter): Promise<void> {
  const { error } = await db(tenantId).from('printers').upsert({
    id: p.id, tenant_id: tenantId, name: p.name, station: p.station,
    categories: p.categories, connection_type: p.connectionType ?? null,
    ip_address: p.ipAddress ?? null, status: p.status,
    auto_print: p.autoPrint ?? true, paper_width: p.paperWidth ?? '80mm',
  }, { onConflict: 'id' });
  if (error) handleError('upsertPrinter', error);
}

export async function deletePrinter(tenantId: string, id: string): Promise<void> {
  const { error } = await db(tenantId).from('printers').delete().eq('id', id).eq('tenant_id', tenantId);
  if (error) handleError('deletePrinter', error);
}

// ─── DELIVERY DRIVERS ────────────────────────────────────────────────────────

function mapDbDriver(d: Record<string, unknown>): DeliveryDriver {
  return {
    id:               d.id as string,
    name:             d.name as string,
    phone:            d.phone as string,
    plateNumber:      d.plate_number as string | undefined,
    vehicleType:      d.vehicle_type as DeliveryDriver['vehicleType'],
    status:           d.status as DeliveryDriver['status'],
    activeOrdersCount:d.active_orders as number,
    userId:           d.user_id as string | undefined,
    currentLat:       d.current_lat as number | undefined,
    currentLng:       d.current_lng as number | undefined,
    lastGpsUpdate:    d.last_gps_update as string | undefined,
    isOnline:         d.is_online as boolean | undefined,
  };
}

export async function fetchDrivers(tenantId: string): Promise<DeliveryDriver[]> {
  const { data, error } = await db(tenantId)
    .from('delivery_drivers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) { handleError('fetchDrivers', error); return []; }
  return (data ?? []).map(mapDbDriver);
}

export async function upsertDriver(tenantId: string, d: DeliveryDriver): Promise<void> {
  const { error } = await db(tenantId).from('delivery_drivers').upsert({
    id: d.id, tenant_id: tenantId, name: d.name, phone: d.phone,
    plate_number: d.plateNumber ?? null, vehicle_type: d.vehicleType,
    status: d.status, active_orders: d.activeOrdersCount,
    current_lat: d.currentLat ?? null, current_lng: d.currentLng ?? null,
    last_gps_update: d.lastGpsUpdate ?? null, is_online: d.isOnline ?? false,
  }, { onConflict: 'id' });
  if (error) handleError('upsertDriver', error);
}

// ─── DELIVERY ZONES ───────────────────────────────────────────────────────────

export async function fetchDeliveryZones(tenantId: string): Promise<DeliveryZone[]> {
  const { data, error } = await db(tenantId)
    .from('delivery_zones')
    .select('*')
    .eq('tenant_id', tenantId);
  if (error) { handleError('fetchDeliveryZones', error); return []; }
  return (data ?? []).map(z => ({
    id:               z.id,
    name:             z.name,
    cost:             z.cost,
    estimatedMinutes: z.estimated_minutes,
  }));
}

export async function upsertDeliveryZone(tenantId: string, z: DeliveryZone): Promise<void> {
  const { error } = await db(tenantId).from('delivery_zones').upsert({
    id: z.id, tenant_id: tenantId, name: z.name,
    cost: z.cost, estimated_minutes: z.estimatedMinutes,
  }, { onConflict: 'id' });
  if (error) handleError('upsertDeliveryZone', error);
}

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

function mapDbReservation(r: Record<string, unknown>): Reservation {
  return {
    id:           r.id as string,
    customerName: r.customer_name as string,
    phone:        r.phone as string | undefined,
    date:         r.date as string,
    time:         r.time as string,
    tableNumber:  r.table_number as string,
    guestCount:   r.guest_count as number,
    status:       r.status as Reservation['status'],
    notes:        r.notes as string | undefined,
    deposit:      r.deposit as number | undefined,
  };
}

export async function fetchReservations(tenantId: string): Promise<Reservation[]> {
  const { data, error } = await db(tenantId)
    .from('reservations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date');
  if (error) { handleError('fetchReservations', error); return []; }
  return (data ?? []).map(mapDbReservation);
}

export async function upsertReservation(tenantId: string, r: Reservation): Promise<void> {
  const { error } = await db(tenantId).from('reservations').upsert({
    id: r.id, tenant_id: tenantId, customer_name: r.customerName,
    phone: r.phone ?? null, date: r.date, time: r.time,
    table_number: r.tableNumber, guest_count: r.guestCount,
    status: r.status, notes: r.notes ?? null, deposit: r.deposit ?? null,
  }, { onConflict: 'id' });
  if (error) handleError('upsertReservation', error);
}

// ─── SUNAT INVOICES ───────────────────────────────────────────────────────────

function mapDbSunat(s: Record<string, unknown>): SunatInvoice {
  return {
    id:                  s.id as string,
    type:                s.type as SunatInvoice['type'],
    series:              s.series as string,
    number:              s.number as string,
    date:                s.date as string,
    customerName:        s.customer_name as string,
    customerDocType:     s.customer_doc_type as SunatInvoice['customerDocType'],
    customerDocNumber:   s.customer_doc_number as string,
    subtotal:            s.subtotal as number,
    igv:                 s.igv as number,
    total:               s.total as number,
    status:              s.status as SunatInvoice['status'],
    hash:                s.hash as string,
    orderId:             s.order_id as string | undefined,
    paymentMethod:       s.payment_method as SunatInvoice['paymentMethod'],
  };
}

export async function fetchSunatInvoices(tenantId: string): Promise<SunatInvoice[]> {
  const { data, error } = await db(tenantId)
    .from('sunat_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });
  if (error) { handleError('fetchSunatInvoices', error); return []; }
  return (data ?? []).map(mapDbSunat);
}

export async function insertSunatInvoice(tenantId: string, inv: SunatInvoice): Promise<void> {
  const { error } = await db(tenantId).from('sunat_invoices').insert({
    id: inv.id, tenant_id: tenantId, order_id: inv.orderId ?? null,
    type: inv.type, series: inv.series, number: inv.number,
    date: inv.date, customer_name: inv.customerName,
    customer_doc_type: inv.customerDocType, customer_doc_number: inv.customerDocNumber,
    subtotal: inv.subtotal, igv: inv.igv, total: inv.total,
    status: inv.status, hash: inv.hash, payment_method: inv.paymentMethod,
  });
  if (error) handleError('insertSunatInvoice', error);
}

// ─── DAILY MENU ───────────────────────────────────────────────────────────────

function mapDbDailyMenuItem(m: Record<string, unknown>): DailyMenuItem {
  return {
    id:          m.id as string,
    name:        m.name as string,
    course:      m.course as DailyMenuItem['course'],
    description: m.description as string | undefined,
    available:   m.available as boolean,
    extraPrice:  m.extra_price as number | undefined,
    imageUrl:    m.image_url as string | undefined,
    popular:     m.popular as boolean | undefined,
  };
}

export async function fetchDailyMenuItems(tenantId: string): Promise<DailyMenuItem[]> {
  const { data, error } = await db(tenantId)
    .from('daily_menu_items')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('course');
  if (error) { handleError('fetchDailyMenuItems', error); return []; }
  return (data ?? []).map(mapDbDailyMenuItem);
}

export async function upsertDailyMenuItem(tenantId: string, item: DailyMenuItem): Promise<void> {
  const { error } = await db(tenantId).from('daily_menu_items').upsert({
    id: item.id, tenant_id: tenantId, name: item.name, course: item.course,
    description: item.description ?? null, available: item.available,
    extra_price: item.extraPrice ?? 0, image_url: item.imageUrl ?? null,
    popular: item.popular ?? false,
  }, { onConflict: 'id' });
  if (error) handleError('upsertDailyMenuItem', error);
}

// ─── ROLE PERMISSIONS ─────────────────────────────────────────────────────────

export async function fetchRolePermissions(tenantId: string): Promise<RolePermissionConfig | null> {
  const { data, error } = await db(tenantId)
    .from('role_permissions')
    .select('role, modules')
    .eq('tenant_id', tenantId);
  if (error) { handleError('fetchRolePermissions', error); return null; }
  if (!data || data.length === 0) return null;

  const result = {} as RolePermissionConfig;
  for (const row of data) {
    result[row.role as RoleType] = row.modules;
  }
  return result;
}

export async function saveRolePermissions(tenantId: string, config: RolePermissionConfig): Promise<void> {
  const client = db(tenantId);
  for (const [role, modules] of Object.entries(config)) {
    const { error } = await client.from('role_permissions').upsert(
      { tenant_id: tenantId, role, modules },
      { onConflict: 'tenant_id,role' }
    );
    if (error) handleError(`saveRolePermissions:${role}`, error);
  }
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

export async function insertAuditLog(tenantId: string, entry: {
  userId?: string;
  userName: string;
  userRole: string;
  eventType: string;
  severity: 'critico' | 'advertencia' | 'info';
  title: string;
  description?: string;
  ipAddress?: string;
  terminal?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await db(tenantId).from('audit_logs').insert({
    tenant_id:   tenantId,
    user_id:     entry.userId ?? null,
    user_name:   entry.userName,
    user_role:   entry.userRole,
    event_type:  entry.eventType,
    severity:    entry.severity,
    title:       entry.title,
    description: entry.description ?? null,
    ip_address:  entry.ipAddress ?? null,
    terminal:    entry.terminal ?? null,
    payload:     entry.payload ?? null,
  });
  if (error) handleError('insertAuditLog', error);
}
