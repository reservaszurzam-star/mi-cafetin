import React, { useMemo } from "react";
import { RestaurantOrder } from "../types";
import { cn } from "../lib/utils";

export type FloorDefinition = {
  id: number;
  name: string;
  icon: string;
  tables: string[];
};

export const RESTAURANT_FLOORS: FloorDefinition[] = [
  { id: 1, name: "Piso 1",    icon: "1",  tables: ["101","102","103","104","105","106","107","108"] },
  { id: 2, name: "Piso 2",    icon: "2",  tables: ["201","202","203","204","205","206"] },
  { id: 3, name: "Piso 3",    icon: "3",  tables: ["301","302","303","304","305","306"] },
  { id: 4, name: "Terraza",   icon: "🌿", tables: ["401","402","403","404","405","406"] },
  { id: 0, name: "Delivery",  icon: "🛵", tables: ["D-01","D-02","D-03","D-04","D-05"] },
];

type Status = "libre" | "borrador" | "cocina" | "servido";

function getStatus(tbl: string, orders: RestaurantOrder[]): Status {
  const o = orders.find((o) => o.tableNumber === tbl);
  if (!o || o.items.length === 0) return "libre";
  if (o.status === "draft") return "borrador";
  if (o.status === "sent" || o.status === "partially_sent") return "cocina";
  return "servido";
}

interface Props {
  activeFloor: number;
  selectedTable: string;
  orders: RestaurantOrder[];
  currency: string;
  onSelectFloor: (id: number) => void;
  onSelectTable: (tbl: string) => void;
}

export function PisoSelector({ activeFloor, selectedTable, orders, currency, onSelectFloor, onSelectTable }: Props) {
  const floor = RESTAURANT_FLOORS.find((f) => f.id === activeFloor) ?? RESTAURANT_FLOORS[0];

  const counts = useMemo(() =>
    RESTAURANT_FLOORS.map((f) => ({
      id: f.id,
      n: orders.filter((o) => f.id === 0 ? o.tableNumber.startsWith("D-") : f.tables.includes(o.tableNumber)).length,
    })),
    [orders]
  );

  return (
    <div className="flex-shrink-0 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm overflow-hidden">
      <div className="flex items-stretch">

        {/* ── Tabs de piso ── */}
        <div className="flex items-stretch border-r border-stone-100 dark:border-stone-800 overflow-x-auto flex-shrink-0">
          {RESTAURANT_FLOORS.map((f) => {
            const c = counts.find((x) => x.id === f.id);
            const active = activeFloor === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { onSelectFloor(f.id); onSelectTable(f.tables[0]); }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all min-w-[72px]",
                  active
                    ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                    : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200"
                )}
              >
                <span className="text-base leading-none">{f.icon}</span>
                <span className="text-[10px] font-bold">{f.name}</span>
                {c && c.n > 0 && (
                  <span className={cn(
                    "absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center",
                    active ? "bg-amber-400 text-stone-900" : "bg-amber-500 text-white"
                  )}>{c.n}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Chips de mesas ── */}
        <div className="flex items-center gap-1.5 px-3 overflow-x-auto flex-1 scrollbar-none py-2">
          {floor.id === 0 && (
            <button
              onClick={() => {
                const dOrders = orders.filter(o => o.tableNumber.startsWith("D-"));
                const nums = dOrders.map(o => parseInt(o.tableNumber.split("-")[1] || "0")).filter(n => !isNaN(n));
                const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
                const newTbl = `D-${next.toString().padStart(2, "0")}`;
                onSelectTable(newTbl);
              }}
              className="relative flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-all active:scale-95 border-2 border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <span className="font-black text-[13px] leading-none">+ Nuevo</span>
              <span className="text-[9px] font-medium mt-0.5 opacity-75">Delivery</span>
            </button>
          )}

          {(() => {
            let activeTables = floor.tables;
            if (floor.id === 0) {
              const dOrders = orders.filter(o => o.tableNumber.startsWith("D-")).map(o => o.tableNumber);
              const unique = Array.from(new Set(dOrders));
              if (selectedTable.startsWith("D-") && !unique.includes(selectedTable)) {
                unique.push(selectedTable);
              }
              activeTables = unique.sort((a, b) => {
                const nA = parseInt(a.split("-")[1] || "0");
                const nB = parseInt(b.split("-")[1] || "0");
                return nA - nB;
              });
            }

            if (activeTables.length === 0 && floor.id === 0) {
               return <span className="text-xs text-stone-400 italic">No hay pedidos de delivery activos</span>;
            }

            return activeTables.map((tbl) => {
              const s = getStatus(tbl, orders);
              const ord = orders.find((o) => o.tableNumber === tbl);
              const sel = selectedTable === tbl;

              const statusRing: Record<Status, string> = {
                libre:    "",
                borrador: "ring-1 ring-amber-400",
                cocina:   "ring-1 ring-sky-400",
                servido:  "ring-1 ring-emerald-400",
              };
              const statusBg: Record<Status, string> = {
                libre:    "bg-stone-50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400",
                borrador: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300",
                cocina:   "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300",
                servido:  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300",
              };
              const dotColor: Record<Status, string> = {
                libre: "bg-stone-300", borrador: "bg-amber-500", cocina: "bg-sky-500", servido: "bg-emerald-500",
              };

              return (
                <button
                  key={tbl}
                  onClick={() => onSelectTable(tbl)}
                  className={cn(
                    "relative flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-2.5 py-1.5 transition-all active:scale-95 border",
                    sel
                      ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-lg scale-[1.08]"
                      : `${statusBg[s]} border-transparent ${statusRing[s]}`
                  )}
                >
                  <span className={cn(
                    "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2",
                    sel ? "border-stone-900 dark:border-white" : "border-white dark:border-stone-900",
                    dotColor[s],
                    (s === "borrador" || s === "cocina") && "animate-pulse"
                  )} />
                  <span className="font-black text-[13px] font-mono leading-none">{tbl}</span>
                  <span className="text-[9px] font-medium leading-none mt-0.5 opacity-75">
                    {ord && ord.total > 0 ? `${currency}${ord.total.toFixed(0)}` : "—"}
                  </span>
                </button>
              );
            });
          })()}
        </div>

        {/* ── Leyenda ── */}
        <div className="hidden lg:flex flex-shrink-0 items-center gap-3 px-4 border-l border-stone-100 dark:border-stone-800 text-[9px] text-stone-400 font-semibold">
          {(["libre","borrador","cocina","servido"] as Status[]).map((s) => {
            const colors = { libre:"bg-stone-300", borrador:"bg-amber-500", cocina:"bg-sky-500", servido:"bg-emerald-500" };
            return (
              <span key={s} className="flex items-center gap-1 whitespace-nowrap">
                <span className={cn("w-2 h-2 rounded-full", colors[s])} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
