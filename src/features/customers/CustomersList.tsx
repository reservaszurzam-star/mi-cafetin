import React, { useState, useMemo } from "react";
import { useAppStore } from "../../hooks/StoreContext";
import { ViewState } from "../../App";
import { 
  UserPlus, Search, Edit2, X, CheckCircle2, Users, Phone, ArrowRight,
  Sparkles, Crown, MessageCircle, CreditCard, Gift, Cake, Award,
  AlertTriangle, DollarSign, ChevronRight, FileText, MapPin, Mail
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Customer } from "../../types";

export default function CustomersList({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { customers, addCustomer, updateCustomer, getCustomerBalance, settings } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"todos" | "con_deuda" | "vip" | "cumpleanos">("todos");
  
  // Modal Crear / Editar
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDocType, setFormDocType] = useState<"DNI" | "RUC">("DNI");
  const [formDocNumber, setFormDocNumber] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCreditLimit, setFormCreditLimit] = useState<number>(300);
  const [formBirthday, setFormBirthday] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("");
    setFormDocType("DNI");
    setFormDocNumber("");
    setFormEmail("");
    setFormAddress("");
    setFormCreditLimit(300);
    setFormBirthday("");
    setFormNotes("");
    setIsAdding(true);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || "");
    setFormDocType(customer.docType || "DNI");
    setFormDocNumber(customer.docNumber || "");
    setFormEmail(customer.email || "");
    setFormAddress(customer.address || "");
    setFormCreditLimit(customer.creditLimit || 300);
    setFormBirthday(customer.birthday || "");
    setFormNotes(customer.notes || "");
    setIsAdding(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        docType: formDocType,
        docNumber: formDocNumber.trim() || undefined,
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        creditLimit: Number(formCreditLimit) || 300,
        birthday: formBirthday || undefined,
        notes: formNotes.trim() || undefined,
      });
    } else {
      const newCust = addCustomer(formName.trim(), formPhone.trim() || undefined);
      updateCustomer(newCust.id, {
        docType: formDocType,
        docNumber: formDocNumber.trim() || undefined,
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
        creditLimit: Number(formCreditLimit) || 300,
        birthday: formBirthday || undefined,
        notes: formNotes.trim() || undefined,
        points: 50, // Puntos de bienvenida
        tier: "Bronce",
      });
    }

    setIsAdding(false);
    setEditingCustomer(null);
  };

  // Métricas
  const totalBalance = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, getCustomerBalance(c.id)), 0);
  }, [customers, getCustomerBalance]);

  const debtCount = useMemo(() => {
    return customers.filter(c => getCustomerBalance(c.id) > 0).length;
  }, [customers, getCustomerBalance]);

  const vipCount = useMemo(() => {
    return customers.filter(c => c.tier === 'VIP' || c.tier === 'Oro' || (c.points || 0) >= 250).length;
  }, [customers]);

  const totalPointsIssued = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.points || 0), 0);
  }, [customers]);

  // Filtrado
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const balance = getCustomerBalance(c.id);
      const matchesSearch = 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search)) ||
        (c.docNumber && c.docNumber.includes(search));

      if (!matchesSearch) return false;

      if (filterTab === "con_deuda") return balance > 0;
      if (filterTab === "vip") return c.tier === "VIP" || c.tier === "Oro" || (c.points || 0) >= 250;
      if (filterTab === "cumpleanos") return Boolean(c.birthday);

      return true;
    });
  }, [customers, search, filterTab, getCustomerBalance]);

  const getTierColor = (tier?: string, points: number = 0) => {
    if (tier === "VIP" || points >= 500) return "bg-purple-100 text-purple-800 border-purple-200";
    if (tier === "Oro" || points >= 250) return "bg-amber-100 text-amber-800 border-amber-300";
    if (tier === "Plata" || points >= 100) return "bg-slate-100 text-slate-800 border-slate-300";
    return "bg-stone-100 text-stone-700 border-stone-200";
  };

  const getTierName = (tier?: string, points: number = 0) => {
    if (tier) return tier;
    if (points >= 500) return "VIP";
    if (points >= 250) return "Oro";
    if (points >= 100) return "Plata";
    return "Bronce";
  };

  const openWhatsApp = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer.phone) return;
    const cleanPhone = customer.phone.replace(/\D/g, "");
    const phoneWithCode = cleanPhone.startsWith("51") ? cleanPhone : `51${cleanPhone}`;
    const balance = getCustomerBalance(customer.id);
    let msg = `Hola ${customer.name}, te saludamos de ${settings.companyName}! `;
    if (balance > 0) {
      msg += `Te recordamos que mantienes un saldo pendiente de ${settings.currency} ${balance.toFixed(2)}. Si ya realizaste el abono, por favor compártenos tu constancia. ¡Muchas gracias!`;
    } else {
      msg += `Tienes acumulados ${(customer.points || 0)} puntos de fidelización en tu cuenta. ¡Esperamos verte pronto para canjear tus beneficios!`;
    }
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8 space-y-6">
      
      {/* ── HEADER SUPERIOR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Fidelización & Cartera
            </span>
            <span className="text-xs text-stone-400 font-bold">· {settings.companyName}</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-500" />
            Clientes, CRM & Club de Fidelización
          </h1>
          <p className="text-xs text-stone-500 font-semibold mt-0.5">
            Gestión de clientes frecuentes, puntos de recompensa, créditos fiados y avisos por WhatsApp.
          </p>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="h-11 px-5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20"
        >
          <UserPlus className="w-5 h-5" /> Nuevo Cliente
        </button>
      </div>

      {/* ── MÉTRICAS CRM ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Total Clientes</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">{customers.length}</div>
          <span className="text-[10px] font-bold text-stone-500">Base de datos registrada</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Cuentas por Cobrar</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {settings.currency} {totalBalance.toFixed(2)}
          </div>
          <span className="text-[10px] font-bold text-rose-600">{debtCount} clientes con saldo pendiente</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Clientes VIP / Oro</span>
            <Crown className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">{vipCount}</div>
          <span className="text-[10px] font-bold text-purple-600">Mayor frecuencia de compra</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Puntos en Circulación</span>
            <Gift className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{totalPointsIssued} pts</div>
          <span className="text-[10px] font-bold text-amber-600">Disponibles para canjes</span>
        </div>
      </div>

      {/* ── CONTROLES & FILTROS ── */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, DNI/RUC o teléfono..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none transition-all"
          />
        </div>

        {/* Tabs de Filtro */}
        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterTab("todos")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap",
              filterTab === "todos" ? "bg-stone-900 text-white shadow-xs" : "text-stone-600 hover:text-stone-900"
            )}
          >
            Todos ({customers.length})
          </button>
          <button
            onClick={() => setFilterTab("con_deuda")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap flex items-center gap-1",
              filterTab === "con_deuda" ? "bg-rose-600 text-white shadow-xs" : "text-rose-700 hover:bg-rose-50"
            )}
          >
            Fiados / Deudas ({debtCount})
          </button>
          <button
            onClick={() => setFilterTab("vip")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap flex items-center gap-1",
              filterTab === "vip" ? "bg-purple-700 text-white shadow-xs" : "text-purple-700 hover:bg-purple-50"
            )}
          >
            VIP & Oro ({vipCount})
          </button>
          <button
            onClick={() => setFilterTab("cumpleanos")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black transition whitespace-nowrap flex items-center gap-1",
              filterTab === "cumpleanos" ? "bg-amber-600 text-white shadow-xs" : "text-amber-700 hover:bg-amber-50"
            )}
          >
            <Cake className="w-3 h-3" /> Cumpleaños
          </button>
        </div>
      </div>

      {/* ── GRID DE CLIENTES ── */}
      <div className="flex-1 min-h-0">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-stone-400 bg-white rounded-3xl border border-stone-200 shadow-sm p-12 text-center">
            <Users className="w-12 h-12 mb-3 opacity-20" />
            <h3 className="font-black text-base text-stone-700">No se encontraron clientes</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm">
              No hay registros que coincidan con la búsqueda o el filtro seleccionado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => {
              const balance = getCustomerBalance(customer.id);
              const initials = customer.name.substring(0, 2).toUpperCase();
              const points = customer.points || 0;
              const tierName = getTierName(customer.tier, points);

              return (
                <div 
                  key={customer.id} 
                  onClick={() => onNavigate({ name: "customer_detail", customerId: customer.id })}
                  className="group bg-white border border-stone-200 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  <div>
                    {/* Header del Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-base flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-black text-sm text-stone-900 group-hover:text-amber-700 transition">
                              {customer.name}
                            </h3>
                          </div>
                          
                          {customer.docNumber && (
                            <span className="text-[10px] font-mono font-bold text-stone-500 block mt-0.5">
                              {customer.docType || "DNI"}: {customer.docNumber}
                            </span>
                          )}

                          {customer.phone && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-stone-600 font-semibold">
                              <Phone className="w-3 h-3 text-stone-400" /> {customer.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEdit(customer, e)}
                          title="Editar Ficha"
                          className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {customer.phone && (
                          <button
                            onClick={(e) => openWhatsApp(customer, e)}
                            title="Enviar WhatsApp"
                            className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Badges de Fidelización & Cumpleaños */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1",
                        getTierColor(customer.tier, points)
                      )}>
                        <Award className="w-3 h-3" />
                        Club {tierName}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Gift className="w-3 h-3 text-amber-600" />
                        {points} pts
                      </span>

                      {customer.birthday && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <Cake className="w-3 h-3 text-rose-500" />
                          {customer.birthday}
                        </span>
                      )}
                    </div>

                    {customer.notes && (
                      <p className="text-[11px] text-stone-500 italic mt-2.5 bg-stone-50 p-2 rounded-xl border border-stone-150 line-clamp-2">
                        "{customer.notes}"
                      </p>
                    )}
                  </div>

                  {/* Footer del Card con Saldo y Navegación */}
                  <div className="flex items-end justify-between border-t border-stone-100 pt-3.5 mt-1">
                    <div>
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-0.5">
                        Estado de Cuenta
                      </span>
                      <span className={cn(
                        "font-mono font-black text-base leading-none", 
                        balance > 0 ? "text-rose-600" : "text-emerald-700"
                      )}>
                        {balance > 0 
                          ? `Deuda: ${settings.currency} ${balance.toFixed(2)}` 
                          : `Al día (${settings.currency} 0.00)`
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-black text-amber-700 group-hover:translate-x-0.5 transition-transform">
                      <span>Ver Ficha</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL AÑADIR / EDITAR CLIENTE ── */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveForm} 
            className="bg-white rounded-3xl w-full max-w-lg border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-stone-900">
                    {editingCustomer ? "Editar Ficha de Cliente" : "Registrar Nuevo Cliente CRM"}
                  </h3>
                  <p className="text-xs text-stone-500 font-semibold">Datos de contacto, fidelización y crédito</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                  Nombre Completo o Razón Social *
                </label>
                <input 
                  autoFocus 
                  placeholder="Ej. Juan Carlos Pérez o Corporación ABC S.A.C." 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={formDocType}
                    onChange={e => setFormDocType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  >
                    <option value="DNI">DNI (Persona Natural)</option>
                    <option value="RUC">RUC (Empresa / Facturación)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Número de Documento
                  </label>
                  <input 
                    placeholder="45892147 o 2060..." 
                    value={formDocNumber} 
                    onChange={e => setFormDocNumber(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input 
                    placeholder="987654321" 
                    value={formPhone} 
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Límite Crédito Fiado ({settings.currency})
                  </label>
                  <input 
                    type="number"
                    min={0}
                    step={50}
                    value={formCreditLimit} 
                    onChange={e => setFormCreditLimit(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input 
                    type="email"
                    placeholder="cliente@correo.com" 
                    value={formEmail} 
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                    Fecha de Cumpleaños
                  </label>
                  <input 
                    type="date"
                    value={formBirthday} 
                    onChange={e => setFormBirthday(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                  Dirección de Entrega / Domicilio
                </label>
                <input 
                  placeholder="Av. Los Pinos 123, Urb. San José" 
                  value={formAddress} 
                  onChange={e => setFormAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                  Preferencias / Notas Internas
                </label>
                <textarea 
                  rows={2}
                  placeholder="Mesa favorita, alergias, término de cocción preferido, etc." 
                  value={formNotes} 
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-amber-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="p-4 px-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 transition shadow-md shadow-amber-500/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> 
                <span>{editingCustomer ? "Guardar Cambios" : "Crear Cliente"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

