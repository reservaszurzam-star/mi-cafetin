import React, { useState, useMemo } from "react";
import { useAppStore } from "../hooks/StoreContext";
import { ViewState } from "../App";
import { UserPlus, Search, Edit2, X, CheckCircle2, Users, Phone, ArrowRight } from "lucide-react";
import { cn } from "../lib/utils";

export default function CustomersList({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { customers, addCustomer, updateCustomer, getCustomerBalance, settings } = useAppStore();
  const [search, setSearch] = useState("");
  
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [customers, search]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const newCustomer = addCustomer(newCustomerName.trim(), newCustomerPhone.trim() || undefined);
    setIsAdding(false);
    setNewCustomerName(""); setNewCustomerPhone("");
    onNavigate({ name: "customer_detail", customerId: newCustomer.id });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingId) return;
    updateCustomer(editingId, { name: editName.trim(), phone: editPhone.trim() || undefined });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-amber-500" />
            Directorio de Clientes
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Gestiona tus clientes frecuentes y sus cuentas por cobrar.
          </p>
        </div>
        <button onClick={() => setIsAdding(true)} 
          className="h-11 px-5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-amber-500/30"
        >
          <UserPlus className="w-5 h-5" /> Nuevo Cliente
        </button>
      </div>

      {/* ── BÚSQUEDA ── */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 p-3 mb-6 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text" placeholder="Buscar cliente por nombre..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-amber-500 rounded-xl pl-11 pr-4 py-3 text-sm font-medium outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      {/* ── GRID DE CLIENTES ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredCustomers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm p-8">
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium text-lg text-stone-500 dark:text-stone-400">No hay clientes registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => {
              const balance = getCustomerBalance(customer.id);
              const initials = customer.name.substring(0, 2).toUpperCase();

              return (
                <div key={customer.id} onClick={() => onNavigate({ name: "customer_detail", customerId: customer.id })}
                  className="group bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-black text-xl flex items-center justify-center shrink-0 shadow-inner">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-bold text-stone-900 dark:text-white truncate pr-6">{customer.name}</h3>
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                          <Phone className="w-3 h-3" /> {customer.phone}
                        </div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(customer.id); setEditName(customer.name); setEditPhone(customer.phone || ""); }} title="Editar"
                      className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all opacity-0 group-hover:opacity-100"
                    ><Edit2 className="w-4 h-4" /></button>
                  </div>

                  <div className="flex items-end justify-between border-t border-stone-100 dark:border-stone-800 pt-4 mt-2">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-0.5">Deuda Total</span>
                      <span className={cn("font-mono font-black text-lg leading-none", balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-500")}>
                        {settings.currency} {balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL AÑADIR CLIENTE ── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddCustomer} className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-md border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
              <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2"><UserPlus className="w-5 h-5 text-amber-500" /> Nuevo Cliente</h3>
              <button type="button" onClick={() => setIsAdding(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
                <input autoFocus placeholder="Ej. Juan Pérez..." value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} required
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-500 transition-colors dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Teléfono / WhatsApp (Opcional)</label>
                <input placeholder="Ej. +51 987 654 321" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-500 transition-colors dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition shadow shadow-amber-500/20"><CheckCircle2 className="w-4 h-4" /> Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL EDITAR CLIENTE ── */}
      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveEdit} className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-md border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
              <h3 className="font-black text-lg text-stone-900 dark:text-white flex items-center gap-2"><Edit2 className="w-5 h-5 text-amber-500" /> Editar Cliente</h3>
              <button type="button" onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nombre Completo *</label>
                <input autoFocus placeholder="Ej. Juan Pérez..." value={editName} onChange={e => setEditName(e.target.value)} required
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-500 transition-colors dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Teléfono / WhatsApp (Opcional)</label>
                <input placeholder="Ej. +51 987 654 321" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-500 transition-colors dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingId(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition shadow shadow-amber-500/20"><CheckCircle2 className="w-4 h-4" /> Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
