import React, { useState, useMemo } from "react";
import { RestaurantOrder } from "../../types";
import { cn } from "../../lib/utils";
import { Plus, User, Sparkles, X, Edit3, Check, Zap } from "lucide-react";
import { useAppStore } from "../../hooks/StoreContext";

export type FloorDefinition = {
  id: number;
  name: string;
  icon: string;
  tables: string[];
};

export const RESTAURANT_FLOORS: FloorDefinition[] = [
  { id: 1, name: "Piso 1",    icon: "P1", tables: ["101","102","103","104","105","106","107","108"] },
  { id: 2, name: "Piso 2",    icon: "P2", tables: ["201","202","203","204","205","206"] },
  { id: 3, name: "Piso 3",    icon: "P3", tables: ["301","302","303","304","305","306"] },
  { id: 4, name: "Terraza",   icon: "TR", tables: ["401","402","403","404","405","406"] },
  { id: 0, name: "Delivery",  icon: "DL", tables: ["D-01","D-02","D-03","D-04","D-05"] },
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
  onAddCustomTable?: (name: string, targetTable?: string) => void;
  onQuickSale?: () => void;
}

export function PisoSelector({ 
  activeFloor, 
  selectedTable, 
  orders, 
  currency, 
  onSelectFloor, 
  onSelectTable,
  onAddCustomTable,
  onQuickSale 
}: Props) {
  const { customers } = useAppStore();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customNameInput, setCustomNameInput] = useState("");
  const [targetTableSelection, setTargetTableSelection] = useState<string>("auto");

  const floor = RESTAURANT_FLOORS.find((f) => f.id === activeFloor) ?? RESTAURANT_FLOORS[0];

  const counts = useMemo(() =>
    RESTAURANT_FLOORS.map((f) => ({
      id: f.id,
      n: orders.filter((o) => f.id === 0 
        ? o.tableNumber.startsWith("D-") || o.type === "delivery" 
        : (f.tables.includes(o.tableNumber) || (o.floor === f.id && o.customTableName))
      ).length,
    })),
    [orders]
  );

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNameInput.trim()) return;
    
    const clientName = customNameInput.trim();
    const finalTableName = targetTableSelection === "auto" 
      ? clientName
      : targetTableSelection;
    
    if (onAddCustomTable) {
      onAddCustomTable(clientName, targetTableSelection === "auto" ? undefined : targetTableSelection);
    }
    onSelectTable(finalTableName);
    setCustomNameInput("");
    setShowCustomModal(false);
  };

  return (
    <div className="flex-shrink-0 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="flex items-stretch">

        {/* ── Tabs de piso ── */}
        <div className="flex items-stretch border-r border-stone-100 overflow-x-auto flex-shrink-0">
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
                    ? "bg-stone-900 text-white shadow-inner"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
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

        {/* ── Chips de mesas y Cuentas por Nombre ── */}
        <div className="flex items-center gap-1.5 px-3 overflow-x-auto flex-1 scrollbar-none py-2">
          
          {/* Botón: Crear mesa por nombre de cliente */}
          <button
            onClick={() => {
              setTargetTableSelection("auto");
              setShowCustomModal(true);
            }}
            className="relative flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all active:scale-95 border border-dashed border-amber-400 bg-amber-50/70 text-amber-900 hover:bg-amber-100 shadow-xs cursor-pointer"
            title="Abrir mesa o cuenta con el Nombre del Cliente"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />
            <span className="font-black text-xs leading-none">+ Mesa con Nombre</span>
          </button>

          {/* Botón: Venta Libre / Mostrador */}
          {onQuickSale && (
            <button
              onClick={onQuickSale}
              className="relative flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all active:scale-95 border border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 shadow-xs cursor-pointer"
              title="Iniciar venta rápida sin mesa asignada"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span className="font-black text-xs leading-none">Venta Libre</span>
            </button>
          )}

          {floor.id === 0 && (
            <button
              onClick={() => {
                const dOrders = orders.filter(o => o.tableNumber.startsWith("D-") || o.type === "delivery");
                const nums = dOrders.map(o => parseInt(o.tableNumber.split("-")[1] || "0")).filter(n => !isNaN(n));
                const next = (nums.length > 0 ? Math.max(...nums) : 0) + 1;
                const newTbl = `D-${next.toString().padStart(2, "0")}`;
                onSelectTable(newTbl);
              }}
              className="relative flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all active:scale-95 border border-dashed border-blue-400 bg-blue-50/70 text-blue-900 hover:bg-blue-100 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
              <span className="font-black text-xs leading-none">+ Delivery</span>
            </button>
          )}

          {/* Listado de Mesas del piso + Mesas con Nombre Personalizado */}
          {(() => {
            let tableList = [...floor.tables];

            // Buscar órdenes con nombre personalizado en este piso
            const customOrdersOnFloor = orders.filter(
              o => o.floor === floor.id && o.customTableName && !tableList.includes(o.tableNumber)
            );
            customOrdersOnFloor.forEach(o => {
              if (!tableList.includes(o.tableNumber)) {
                tableList.push(o.tableNumber);
              }
            });

            // Si la mesa seleccionada es personalizada y no está en la lista, agregarla
            if (selectedTable && !tableList.includes(selectedTable) && (selectedTable.startsWith("Cliente:") || selectedTable.startsWith("Venta") || selectedTable.startsWith("D-") || orders.some(o => o.tableNumber === selectedTable))) {
              tableList.push(selectedTable);
            }

            if (floor.id === 0) {
              const dOrders = orders.filter(o => o.tableNumber.startsWith("D-") || o.type === "delivery").map(o => o.tableNumber);
              const unique = Array.from(new Set(dOrders));
              if (selectedTable.startsWith("D-") && !unique.includes(selectedTable)) {
                unique.push(selectedTable);
              }
              tableList = unique.sort((a, b) => {
                const nA = parseInt(a.split("-")[1] || "0");
                const nB = parseInt(b.split("-")[1] || "0");
                return nA - nB;
              });
            }

            if (tableList.length === 0 && floor.id === 0) {
               return <span className="text-xs text-stone-400 italic">No hay pedidos de delivery activos</span>;
            }

            return tableList.map((tbl) => {
              const s = getStatus(tbl, orders);
              const ord = orders.find((o) => o.tableNumber === tbl);
              const sel = selectedTable === tbl;
              const hasCustomerName = ord?.dinerName && !ord.dinerName.toLowerCase().startsWith("mesa");

              const statusRing: Record<Status, string> = {
                libre:    "",
                borrador: "ring-1 ring-amber-400",
                cocina:   "ring-1 ring-sky-400",
                servido:  "ring-1 ring-emerald-400",
              };
              const statusBg: Record<Status, string> = {
                libre:    "bg-stone-50 text-stone-600 hover:bg-stone-100",
                borrador: "bg-amber-50 text-amber-900 border-amber-300",
                cocina:   "bg-sky-50 text-sky-900 border-sky-300",
                servido:  "bg-emerald-50 text-emerald-900 border-emerald-300",
              };
              const dotColor: Record<Status, string> = {
                libre: "bg-stone-300", borrador: "bg-amber-500", cocina: "bg-sky-500", servido: "bg-emerald-500",
              };

              return (
                <button
                  key={tbl}
                  onClick={() => onSelectTable(tbl)}
                  className={cn(
                    "relative flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-1.5 transition-all active:scale-95 border min-w-[70px]",
                    sel
                      ? "bg-stone-900 text-white border-stone-900 shadow-md scale-[1.05]"
                      : `${statusBg[s]} ${statusRing[s]}`
                  )}
                >
                  <span className={cn(
                    "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2",
                    sel ? "border-stone-900" : "border-white",
                    dotColor[s],
                    (s === "borrador" || s === "cocina") && "animate-pulse"
                  )} />
                  
                  {/* Si la mesa tiene Nombre de Cliente guardado, mostrarlo de forma destacada */}
                  {hasCustomerName ? (
                    <div className="flex flex-col items-center max-w-[130px]">
                      <span className={cn(
                        "font-black text-xs leading-tight truncate w-full text-center flex items-center justify-center gap-1",
                        sel ? "text-amber-300" : "text-stone-900"
                      )}>
                        <User className="w-3 h-3 shrink-0" />
                        {ord.dinerName}
                      </span>
                      <span className={cn(
                        "text-[9px] font-mono font-bold leading-none mt-0.5 opacity-85",
                        sel ? "text-stone-300" : "text-stone-500"
                      )}>
                        {tbl} · {currency} {ord.total.toFixed(0)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="font-black text-xs font-mono leading-none">
                        {tbl}
                      </span>
                      <span className="text-[9px] font-bold leading-none mt-0.5 opacity-80">
                        {ord && ord.total > 0 ? `${currency} ${ord.total.toFixed(0)}` : "Libre"}
                      </span>
                    </div>
                  )}
                </button>
              );
            });
          })()}
        </div>

        {/* ── Leyenda de Estados ── */}
        <div className="hidden xl:flex flex-shrink-0 items-center gap-3 px-4 border-l border-stone-100 text-[10px] text-stone-500 font-bold">
          {(["libre","borrador","cocina","servido"] as Status[]).map((s) => {
            const colors = { libre:"bg-stone-300", borrador:"bg-amber-500", cocina:"bg-sky-500", servido:"bg-emerald-500" };
            return (
              <span key={s} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className={cn("w-2 h-2 rounded-full", colors[s])} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Modal: Guardar Mesa por Nombre de Cliente ── */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">Guardar Mesa por Nombre</h3>
                  <p className="text-xs text-stone-500">Asigna el pedido directamente al nombre del cliente</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-stone-600 uppercase tracking-wider mb-1.5">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Gómez, Familia Pérez, Barra VIP..."
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                />

                {/* Sugerencias de clientes frecuentes */}
                {customers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-stone-400 font-bold w-full">Clientes frecuentes:</span>
                    {customers.slice(0, 4).map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCustomNameInput(c.name)}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-lg text-[11px] font-bold transition"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-stone-600 uppercase tracking-wider mb-1.5">
                  Asociar a Mesa Física (Opcional)
                </label>
                <select
                  value={targetTableSelection}
                  onChange={(e) => setTargetTableSelection(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
                >
                  <option value="auto">Solo por Nombre (Sin número de mesa fijo)</option>
                  {floor.tables.map(t => (
                    <option key={t} value={t}>{t} - {floor.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition shadow-md shadow-amber-500/20"
                >
                  Guardar y Abrir Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
