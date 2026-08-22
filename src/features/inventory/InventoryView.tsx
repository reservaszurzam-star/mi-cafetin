import React, { useState, useMemo } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { Package, ArrowDownToLine, ArrowUpFromLine, Search, Plus, Filter, ClipboardList } from 'lucide-react';
import { cn } from "../../lib/utils";
import { InventoryMovement } from "../../types";

export default function InventoryView() {
  const { inventoryItems, inventoryMovements, addInventoryItem, addInventoryMovement, settings } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'kardex' | 'movements'>('kardex');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingMovement, setIsAddingMovement] = useState(false);
  const [movementItem, setMovementItem] = useState('');
  
  // Forms
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemUnit, setItemUnit] = useState('Kg');
  const [itemMinStock, setItemMinStock] = useState('10');
  const [itemCost, setItemCost] = useState('0');

  const [movType, setMovType] = useState<'in'|'out'>('in');
  const [movQty, setMovQty] = useState('');
  const [movReason, setMovReason] = useState('Compra');

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.category.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [inventoryItems, searchQuery]);

  const recentMovements = useMemo(() => {
    return [...inventoryMovements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
  }, [inventoryMovements]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;
    addInventoryItem({
      name: itemName,
      category: itemCategory || 'General',
      unit: itemUnit,
      currentStock: 0,
      minStock: parseFloat(itemMinStock) || 0,
      costPerUnit: parseFloat(itemCost) || 0
    });
    setIsAddingItem(false);
    setItemName(''); setItemCategory('');
  };

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementItem || !movQty) return;
    addInventoryMovement({
      itemId: movementItem,
      type: movType,
      quantity: parseFloat(movQty),
      reason: movReason
    });
    setIsAddingMovement(false);
    setMovQty('');
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-amber-500" />
            Inventario & Kardex
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Control de insumos, entradas y salidas.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setMovType('in'); setMovReason('Compra'); setIsAddingMovement(true); }} className="h-11 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm">
            <ArrowDownToLine className="w-4 h-4" /> Registrar Entrada
          </button>
          <button onClick={() => { setMovType('out'); setMovReason('Merma'); setIsAddingMovement(true); }} className="h-11 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm">
            <ArrowUpFromLine className="w-4 h-4" /> Registrar Salida
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 p-2 mb-6 flex items-center shadow-sm w-fit">
        <button onClick={() => setActiveTab('kardex')} className={cn("px-5 py-2 rounded-xl font-bold text-sm transition-all", activeTab === 'kardex' ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md" : "text-stone-500 hover:text-stone-900 dark:hover:text-white")}>Kardex de Insumos</button>
        <button onClick={() => setActiveTab('movements')} className={cn("px-5 py-2 rounded-xl font-bold text-sm transition-all", activeTab === 'movements' ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md" : "text-stone-500 hover:text-stone-900 dark:hover:text-white")}>Últimos Movimientos</button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm">
        {activeTab === 'kardex' && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="text" placeholder="Buscar insumo..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-amber-500 dark:text-white transition-colors" />
              </div>
              <button onClick={() => setIsAddingItem(true)} className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-2 text-sm transition-all">
                <Plus className="w-4 h-4" /> Nuevo Insumo
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-stone-400 border-b border-stone-200 dark:border-stone-800">
                    <th className="pb-3 font-bold px-2">Insumo</th>
                    <th className="pb-3 font-bold px-2">Categoría</th>
                    <th className="pb-3 font-bold px-2 text-right">Stock Actual</th>
                    <th className="pb-3 font-bold px-2 text-right">Costo Ref.</th>
                    <th className="pb-3 font-bold px-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-colors">
                      <td className="py-3 px-2 font-bold text-sm dark:text-white text-stone-900">{item.name}</td>
                      <td className="py-3 px-2 text-xs text-stone-500">{item.category}</td>
                      <td className="py-3 px-2 text-sm font-mono font-bold text-right dark:text-white text-stone-900">
                        {item.currentStock.toFixed(2)} <span className="text-[10px] text-stone-400">{item.unit}</span>
                      </td>
                      <td className="py-3 px-2 text-sm text-right text-stone-500 font-mono">
                        {settings.currency} {item.costPerUnit.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {item.currentStock <= item.minStock ? (
                          <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">Bajo Stock</span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">Óptimo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-stone-400 text-sm">No hay insumos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-stone-400 border-b border-stone-200 dark:border-stone-800">
                    <th className="pb-3 font-bold px-2">Fecha</th>
                    <th className="pb-3 font-bold px-2">Tipo</th>
                    <th className="pb-3 font-bold px-2">Insumo</th>
                    <th className="pb-3 font-bold px-2 text-right">Cantidad</th>
                    <th className="pb-3 font-bold px-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map(mov => {
                    const item = inventoryItems.find(i => i.id === mov.itemId);
                    return (
                      <tr key={mov.id} className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/20 transition-colors">
                        <td className="py-3 px-2 text-xs text-stone-500">{new Date(mov.date).toLocaleString()}</td>
                        <td className="py-3 px-2">
                          {mov.type === 'in' ? 
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-0.5 rounded"><ArrowDownToLine className="w-3 h-3"/> ENTRADA</span> : 
                            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[10px] font-bold bg-rose-50 dark:bg-rose-900/20 w-fit px-2 py-0.5 rounded"><ArrowUpFromLine className="w-3 h-3"/> SALIDA</span>
                          }
                        </td>
                        <td className="py-3 px-2 font-bold text-sm dark:text-white text-stone-900">{item?.name || 'Eliminado'}</td>
                        <td className="py-3 px-2 text-sm font-mono font-bold text-right dark:text-white text-stone-900">
                          {mov.type === 'in' ? '+' : '-'}{mov.quantity} <span className="text-[10px] text-stone-400">{item?.unit}</span>
                        </td>
                        <td className="py-3 px-2 text-xs font-semibold text-stone-600 dark:text-stone-300">{mov.reason}</td>
                      </tr>
                    );
                  })}
                  {recentMovements.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-stone-400 text-sm">No hay movimientos recientes.</td></tr>
                  )}
                </tbody>
              </table>
          </div>
        )}
      </div>

      {isAddingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <form onSubmit={handleAddItem} className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-md border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
              <div className="bg-stone-50 dark:bg-stone-950/50 px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-white leading-tight">Nuevo Insumo</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">Agrega un ítem al inventario</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Nombre del Insumo</label>
                  <input placeholder="Ej. Pollo Fresco" value={itemName} onChange={e=>setItemName(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Categoría</label>
                  <input placeholder="Ej. Cárnicos, Abarrotes" value={itemCategory} onChange={e=>setItemCategory(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Unidad</label>
                    <input placeholder="Kg, L, Und" value={itemUnit} onChange={e=>setItemUnit(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Costo Ref.</label>
                    <input type="number" step="0.01" placeholder="0.00" value={itemCost} onChange={e=>setItemCost(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Alerta de Stock Mínimo</label>
                  <input type="number" step="0.1" placeholder="Ej. 10" value={itemMinStock} onChange={e=>setItemMinStock(e.target.value)} required className="mt-1.5 w-full bg-stone-50 dark:bg-stone-800/50 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold text-stone-900 dark:text-white outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                </div>
              </div>
              <div className="bg-stone-50 dark:bg-stone-950/50 p-6 flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
                <button type="button" onClick={()=>setIsAddingItem(false)} className="px-5 py-2.5 font-bold text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 font-black text-sm bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-100 active:scale-95 transition-all shadow-md">Guardar Insumo</button>
              </div>
           </form>
        </div>
      )}

      {isAddingMovement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <form onSubmit={handleAddMovement} className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm border border-stone-200 dark:border-stone-800 shadow-2xl p-5">
              <h3 className={`font-black text-lg mb-4 flex items-center gap-2 ${movType==='in'?'text-emerald-500':'text-rose-500'}`}>
                {movType === 'in' ? <ArrowDownToLine/> : <ArrowUpFromLine/>} 
                Registrar {movType === 'in' ? 'Entrada' : 'Salida'}
              </h3>
              <div className="space-y-3">
                <select value={movementItem} onChange={e=>setMovementItem(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500 text-black dark:text-white">
                  <option value="" disabled>Selecciona un Insumo...</option>
                  {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
                <input type="number" step="0.01" placeholder="Cantidad" value={movQty} onChange={e=>setMovQty(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500" />
                <input placeholder="Motivo (Ej. Compra Factura 001)" value={movReason} onChange={e=>setMovReason(e.target.value)} required className="w-full bg-stone-50 dark:bg-stone-800 border rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500" />
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={()=>setIsAddingMovement(false)} className="px-4 py-2 font-bold text-sm text-stone-500">Cancelar</button>
                <button type="submit" className={`px-4 py-2 font-bold text-sm text-white rounded-xl ${movType==='in'?'bg-emerald-500 hover:bg-emerald-600':'bg-rose-500 hover:bg-rose-600'}`}>Registrar</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
