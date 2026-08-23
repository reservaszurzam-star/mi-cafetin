/**
 * useSupabaseSync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook que hidrata el store con datos de Supabase al iniciar la sesión.
 * También suscribe a cambios en tiempo real de órdenes y conductores.
 *
 * Estrategia:
 *   1. Al montar: carga TODOS los datos de Supabase → sobreescribe estado del store.
 *   2. Si Supabase falla o está vacío: el store conserva sus datos de localStorage.
 *   3. Suscripción Realtime en `orders` y `delivery_drivers`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { getSupabaseForTenant } from '../lib/supabaseClient';
import * as svc from '../lib/supabaseService';
import type {
  Customer,
  Transaction,
  Product,
  Settings,
  Expense,
  RestaurantOrder,
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
} from '../types';

// Tipado mínimo de los setters que necesitamos del store
interface StoreSetters {
  setCustomers:          Dispatch<SetStateAction<Customer[]>>;
  setTransactions:       Dispatch<SetStateAction<Transaction[]>>;
  setProducts:           Dispatch<SetStateAction<Product[]>>;
  setExpenses:           Dispatch<SetStateAction<Expense[]>>;
  setOrders:             Dispatch<SetStateAction<RestaurantOrder[]>>;
  setPrinters:           Dispatch<SetStateAction<StationPrinter[]>>;
  setInventoryItems:     Dispatch<SetStateAction<InventoryItem[]>>;
  setInventoryMovements: Dispatch<SetStateAction<InventoryMovement[]>>;
  setReservations:       Dispatch<SetStateAction<Reservation[]>>;
  setUsers:              Dispatch<SetStateAction<User[]>>;
  setDrivers:            Dispatch<SetStateAction<DeliveryDriver[]>>;
  setDeliveryZones:      Dispatch<SetStateAction<DeliveryZone[]>>;
  setSunatInvoices:      Dispatch<SetStateAction<SunatInvoice[]>>;
  setDailyMenuItems:     Dispatch<SetStateAction<DailyMenuItem[]>>;
  setRolePermissions:    Dispatch<SetStateAction<RolePermissionConfig>>;
  setSettings:           (s: Settings) => void;
  setCurrentUser?:       Dispatch<SetStateAction<User>>;
  setIsLoadingFromDB:    (v: boolean) => void;
}


export function useSupabaseSync(tenantId: string, setters: StoreSetters) {
  const initialized = useRef(false);
  const realtimeChannel = useRef<ReturnType<typeof getSupabaseForTenant>['channel'] | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setters.setIsLoadingFromDB(true);

    try {
      // Carga en paralelo — todos los recursos a la vez
      const [
        customers, transactions, products, expenses,
        orders, printers, inventoryItems,
        reservations, users, drivers, zones,
        sunat, menu, permissions, settings,
      ] = await Promise.all([
        svc.fetchCustomers(tenantId),
        svc.fetchTransactions(tenantId),
        svc.fetchProducts(tenantId),
        svc.fetchExpenses(tenantId),
        svc.fetchOrders(tenantId),
        svc.fetchPrinters(tenantId),
        svc.fetchInventoryItems(tenantId),
        svc.fetchReservations(tenantId),
        svc.fetchUsers(tenantId),
        svc.fetchDrivers(tenantId),
        svc.fetchDeliveryZones(tenantId),
        svc.fetchSunatInvoices(tenantId),
        svc.fetchDailyMenuItems(tenantId),
        svc.fetchRolePermissions(tenantId),
        svc.fetchSettings(tenantId),
      ]);

      // Solo sobreescribe si Supabase devolvió datos
      if (customers.length > 0)     setters.setCustomers(customers);
      if (transactions.length > 0)  setters.setTransactions(transactions);
      if (products.length > 0)      setters.setProducts(products);
      if (expenses.length > 0)      setters.setExpenses(expenses);
      setters.setOrders(orders);
      if (printers.length > 0)      setters.setPrinters(printers);
      if (inventoryItems.length > 0)setters.setInventoryItems(inventoryItems);
      if (reservations.length > 0)  setters.setReservations(reservations);
      if (users.length > 0) {
        setters.setUsers(users);
        // Sincronizar usuario activo con la sesión de Supabase Auth
        const { supabase } = await import('../lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && setters.setCurrentUser) {
          const authUser = users.find(u =>
            u.supabaseId === session.user.id ||
            (u.email && u.email.toLowerCase() === session.user.email?.toLowerCase()) ||
            (session.user.app_metadata?.username && u.username === session.user.app_metadata.username)
          );
          if (authUser) {
            setters.setCurrentUser(authUser);
          }
        }
      }
      if (drivers.length > 0)       setters.setDrivers(drivers);
      if (zones.length > 0)         setters.setDeliveryZones(zones);
      if (sunat.length > 0)         setters.setSunatInvoices(sunat);
      if (menu.length > 0)          setters.setDailyMenuItems(menu);
      if (permissions)              setters.setRolePermissions(permissions);
      if (settings)                 setters.setSettings(settings);

      console.info(`[Supabase] Datos cargados para "${tenantId}" correctamente.`);
    } catch (err) {
      console.warn('[Supabase] Error al cargar datos, usando cache local.', err);
    } finally {
      setters.setIsLoadingFromDB(false);
    }
  }, [tenantId]);

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current && tenantId === initialized.current as unknown as string) return;
    initialized.current = true as unknown as boolean;
    load();
  }, [tenantId, load]);

  // ── Realtime: órdenes y conductores ─────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    const client = getSupabaseForTenant(tenantId);

    const channel = client
      .channel(`realtime:${tenantId}`)
      // Cambios en órdenes y comanda
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => {
          svc.fetchOrders(tenantId).then(remoteOrders => {
            if (!remoteOrders) return;
            setters.setOrders((prevOrders: RestaurantOrder[]) => {
              if (!prevOrders || prevOrders.length === 0) return remoteOrders;
              const prevMap = new Map(prevOrders.map(o => [o.id, o]));
              const merged = remoteOrders.map(rem => {
                const local = prevMap.get(rem.id);
                if (!local) return rem;

                // Si la orden local tiene más platos, conservarla siempre
                if (local.items.length > rem.items.length) {
                  return local;
                }

                const localTime = new Date(local.updatedAt || local.createdAt).getTime();
                const remTime = new Date(rem.updatedAt || rem.createdAt).getTime();

                // Si la versión local es más reciente
                if (localTime > remTime) {
                  return local;
                }
                return rem;
              });

              // Preservar órdenes locales que todavía no llegaron de Supabase
              for (const [id, local] of prevMap.entries()) {
                if (!merged.some(m => m.id === id)) {
                  merged.push(local);
                }
              }

              return merged;
            });
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          svc.fetchOrders(tenantId).then(remoteOrders => {
            if (remoteOrders && remoteOrders.length > 0) {
              setters.setOrders((prevOrders: RestaurantOrder[]) => {
                if (!prevOrders || prevOrders.length === 0) return remoteOrders;
                const prevMap = new Map(prevOrders.map(o => [o.id, o]));
                const merged = remoteOrders.map(rem => {
                  const local = prevMap.get(rem.id);
                  if (!local) return rem;
                  if (local.items.length > rem.items.length) return local;
                  return rem;
                });
                for (const [id, local] of prevMap.entries()) {
                  if (!merged.some(m => m.id === id)) merged.push(local);
                }
                return merged;
              });
            }
          });
        }
      )
      // Cambios en conductores (GPS, estado)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_drivers', filter: `tenant_id=eq.${tenantId}` },
        () => {
          svc.fetchDrivers(tenantId).then(drivers => {
            if (drivers.length > 0) setters.setDrivers(drivers);
          });
        }
      )
      .subscribe();

    realtimeChannel.current = channel as unknown as ReturnType<typeof getSupabaseForTenant>['channel'];

    return () => {
      client.removeChannel(channel);
    };
  }, [tenantId]);

  return { reload: load };
}
