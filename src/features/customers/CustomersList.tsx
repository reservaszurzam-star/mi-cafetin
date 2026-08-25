import React, { useState, useMemo } from "react";
import { useAppStore } from "../../hooks/StoreContext";
import { ViewState } from "../../App";
import { 
  UserPlus, Search, Edit2, X, CheckCircle2, Users, Phone, ArrowRight,
  Sparkles, Crown, MessageCircle, CreditCard, Gift, Cake, Award,
  AlertTriangle, DollarSign, ChevronRight, FileText, MapPin, Mail,
  Send, Share2, Copy, Check, ExternalLink, Utensils, Download
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Customer } from "../../types";
import { createWhatsAppUrl } from "../../lib/formatters";

// Emojis con código Unicode explícito para evitar corrupción de caracteres en Windows/WhatsApp Web
const EMOJIS = {
  WAVE: '\u{1F44B}',
  FIRE: '\u{1F525}',
  CHICKEN: '\u{1F357}',
  SPARKLES: '\u{2728}',
  MEAT: '\u{1F969}',
  FRIES: '\u{1F35F}',
  MOTO: '\u{1F6F5}',
  POINT_RIGHT: '\u{1F449}',
  YUM: '\u{1F60B}',
  ROCKET: '\u{1F680}',
  POT: '\u{1F372}',
  SOUP: '\u{1F963}',
  DRINK: '\u{1F964}',
  RUNNER: '\u{1F3C3}',
  PARTY: '\u{1F389}',
  GIFT: '\u{1F381}',
  PHONE: '\u{1F4F2}',
  CARD: '\u{1F4B3}',
  PRAY: '\u{1F64F}',
};

export default function CustomersList({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { customers, addCustomer, updateCustomer, getCustomerBalance, settings, tenantId } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"todos" | "con_deuda" | "vip" | "cumpleanos">("todos");
  
  const isParadero = tenantId === 'paradero';
  const tenantKey = isParadero ? 'paradero' : 'laslomas';
  const cartaUrl = `${window.location.origin}/carta/${tenantKey}`;
  const menuUrl = `${window.location.origin}/menu/${tenantKey}`;

  // Modal Campaña Masiva WhatsApp
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'vip' | 'debt'>('all');
  const [broadcastType, setBroadcastType] = useState<'carta' | 'menu' | 'promo' | 'custom'>('carta');
  const [customMessage, setCustomMessage] = useState('');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copiedBroadcastText, setCopiedBroadcastText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);

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

  const broadcastTargetCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c.phone || !c.phone.trim()) return false;
      const balance = getCustomerBalance(c.id);
      if (broadcastTarget === 'vip') return c.tier === 'VIP' || c.tier === 'Oro' || (c.points || 0) >= 250;
      if (broadcastTarget === 'debt') return balance > 0;
      return true;
    });
  }, [customers, broadcastTarget, getCustomerBalance]);

  const getBroadcastMessageForCustomer = (customer: Customer) => {
    const brandName = settings.companyName || (isParadero ? 'Paradero 104' : 'Las Lomas Grill');
    
    if (broadcastType === 'carta') {
      return (
        `¡Hola *${customer.name}*! ${EMOJIS.WAVE}${EMOJIS.FIRE}\n\n` +
        `Te saludamos de *${brandName}* ${EMOJIS.CHICKEN}${EMOJIS.SPARKLES}\n\n` +
        `Te compartimos nuestra *Carta Digital Oficial* para que disfrutes de nuestros mejores platos recién salidos del horno:\n\n` +
        `${EMOJIS.CHICKEN} *Pollos a la Brasa Crujientes*\n` +
        `${EMOJIS.MEAT} *Parrillas & Cortes Especiales*\n` +
        `${EMOJIS.FRIES} *Mostritos, Chaufa & Guarniciones*\n\n` +
        `${EMOJIS.MOTO} *Pide tu Delivery directo o Recojo aquí:*\n` +
        `${EMOJIS.POINT_RIGHT} ${cartaUrl}\n\n` +
        `_¡Estaremos atentos para prepararlo y llevártelo calientito!_ ${EMOJIS.YUM}${EMOJIS.ROCKET}`
      );
    }
    if (broadcastType === 'menu') {
      const price = settings.dailyMenuPrice || (isParadero ? 18 : 16);
      return (
        `¡Hola *${customer.name}*! ${EMOJIS.WAVE}${EMOJIS.POT}\n\n` +
        `¡Ya tenemos listo el *Menú Ejecutivo Criollo de Hoy* en *${brandName}*! ${EMOJIS.YUM}${EMOJIS.SPARKLES}\n\n` +
        `🍽️ *¿Qué incluye por solo S/ ${price.toFixed(2)}?*\n` +
        `${EMOJIS.SOUP} *Entrada:* Sopa del día o Ensalada fresca\n` +
        `🍛 *Plato de Fondo:* Variedad criolla a elegir\n` +
        `${EMOJIS.DRINK} *Bebida Refrescante incluida*\n\n` +
        `${EMOJIS.MOTO} *Arma tu menú y pide tu delivery directo aquí:*\n` +
        `${EMOJIS.POINT_RIGHT} ${menuUrl}\n\n` +
        `_¡Pídelo temprano antes que se agote!_ ${EMOJIS.FIRE}${EMOJIS.RUNNER}`
      );
    }
    if (broadcastType === 'promo') {
      return (
        `¡Hola *${customer.name}*! ${EMOJIS.PARTY}${EMOJIS.GIFT}\n\n` +
        `En *${brandName}* tenemos una *Promoción Especial* exclusiva para ti hoy ${EMOJIS.FIRE}${EMOJIS.CHICKEN}\n\n` +
        `${EMOJIS.FIRE} *Descuentos en Combos Familiares & Parrillas*\n` +
        `${EMOJIS.MOTO} *Atención Rápida & Delivery Prioritario*\n\n` +
        `${EMOJIS.PHONE} *Descubre las ofertas y pide aquí:*\n` +
        `${EMOJIS.POINT_RIGHT} ${cartaUrl}\n\n` +
        `_¡Muchas gracias por tu preferencia!_ ${EMOJIS.SPARKLES}${EMOJIS.CHICKEN}`
      );
    }
    return customMessage.replace(/{nombre}/gi, customer.name);
  };

  const handleSendSingleBroadcast = (customer: Customer) => {
    if (!customer.phone) return;
    const msg = getBroadcastMessageForCustomer(customer);
    setSentMap(prev => ({ ...prev, [customer.id]: true }));
    try {
      navigator.clipboard.writeText(msg);
    } catch {}
    const url = createWhatsAppUrl(customer.phone, msg);
    window.open(url, "_blank");
  };

  const handleCopyBroadcastText = () => {
    const brandName = settings.companyName || (isParadero ? 'Paradero 104' : 'Las Lomas Grill');
    let template = '';
    if (broadcastType === 'carta') {
      template = (
        `¡Hola! ${EMOJIS.WAVE}${EMOJIS.FIRE}\n\n` +
        `Te saludamos de *${brandName}* ${EMOJIS.CHICKEN}${EMOJIS.SPARKLES}\n\n` +
        `Te compartimos nuestra *Carta Digital Oficial* para que disfrutes de nuestros mejores platos recién salidos del horno:\n\n` +
        `${EMOJIS.CHICKEN} *Pollos a la Brasa Crujientes*\n` +
        `${EMOJIS.MEAT} *Parrillas & Cortes Especiales*\n` +
        `${EMOJIS.FRIES} *Mostritos, Chaufa & Guarniciones*\n\n` +
        `${EMOJIS.MOTO} *Pide tu Delivery directo o Recojo aquí:*\n` +
        `${EMOJIS.POINT_RIGHT} ${cartaUrl}\n\n` +
        `_¡Estaremos atentos para prepararlo y llevártelo calientito!_ ${EMOJIS.YUM}${EMOJIS.ROCKET}`
      );
    } else if (broadcastType === 'menu') {
      const price = settings.dailyMenuPrice || (isParadero ? 18 : 16);
      template = (
        `¡Hola! ${EMOJIS.WAVE}${EMOJIS.POT}\n\n` +
        `¡Ya tenemos listo el *Menú Ejecutivo Criollo de Hoy* en *${brandName}*! ${EMOJIS.YUM}${EMOJIS.SPARKLES}\n\n` +
        `🍽️ *¿Qué incluye por solo S/ ${price.toFixed(2)}?*\n` +
        `${EMOJIS.SOUP} *Entrada:* Sopa del día o Ensalada fresca\n` +
        `🍛 *Plato de Fondo:* Variedad criolla a elegir\n` +
        `${EMOJIS.DRINK} *Bebida Refrescante incluida*\n\n` +
        `${EMOJIS.MOTO} *Arma tu menú y pide tu delivery directo aquí:*\n` +
        `${EMOJIS.POINT_RIGHT} ${menuUrl}\n\n` +
        `_¡Pídelo temprano antes que se agote!_ ${EMOJIS.FIRE}${EMOJIS.RUNNER}`
      );
    } else if (broadcastType === 'promo') {
      template = (
        `¡Hola! ${EMOJIS.PARTY}${EMOJIS.GIFT}\n\n` +
        `En *${brandName}* tenemos una *Promoción Especial* exclusiva para ti hoy ${EMOJIS.FIRE}${EMOJIS.CHICKEN}\n\n` +
        `${EMOJIS.FIRE} *Descuentos en Combos Familiares & Parrillas*\n` +
        `${EMOJIS.MOTO} *Atención Rápida & Delivery Prioritario*\n\n` +
        `${EMOJIS.PHONE} *Descubre las ofertas y pide aquí:*\n` +
        `${EMOJIS.POINT_RIGHT} ${cartaUrl}\n\n` +
        `_¡Muchas gracias por tu preferencia!_ ${EMOJIS.SPARKLES}${EMOJIS.CHICKEN}`
      );
    } else {
      template = customMessage;
    }
    navigator.clipboard.writeText(template);
    setCopiedBroadcastText(true);
    setTimeout(() => setCopiedBroadcastText(false), 2500);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyImageToClipboard = async () => {
    try {
      let blob: Blob;
      if (uploadedImageFile) {
        blob = uploadedImageFile;
      } else {
        const logoPath = isParadero ? '/Logo/logo-paradero-104.png' : '/Logo/logo-lomas-grill.png';
        const res = await fetch(logoPath);
        blob = await res.blob();
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type.includes('png') ? 'image/png' : blob.type]: blob
        })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      console.warn('Clipboard write image error:', err);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    }
  };

  const handleExportPhoneList = () => {
    const validCustomers = customers.filter(c => c.phone && c.phone.trim());
    const csvContent = "data:text/csv;charset=utf-8,Nombre,Telefono\n" + 
      validCustomers.map(c => `"${c.name}","${c.phone}"`).join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `Clientes_${settings.companyName.replace(/\s+/g, '_')}_WhatsApp.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openWhatsApp = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!customer.phone) return;
    const balance = getCustomerBalance(customer.id);
    let msg = `¡Hola *${customer.name}*! ${EMOJIS.WAVE} Te saludamos de *${settings.companyName}* ${EMOJIS.CHICKEN}${EMOJIS.SPARKLES}\n\n`;
    if (balance > 0) {
      msg += `Te recordamos de manera cordial que mantienes un saldo pendiente de:\n${EMOJIS.CARD} *${settings.currency} ${balance.toFixed(2)}*\n\nSi ya realizaste el abono, por favor compártenos tu constancia de pago por este medio. ¡Muchas gracias por tu preferencia! ${EMOJIS.PRAY}`;
    } else {
      msg += `Tienes acumulados ${EMOJIS.GIFT} *${(customer.points || 0)} puntos de fidelización* en tu cuenta.\n\nTe invitamos a conocer nuestra carta digital y canjear beneficios:\n${EMOJIS.POINT_RIGHT} ${cartaUrl}\n\n¡Esperamos atenderte muy pronto! ${EMOJIS.YUM}${EMOJIS.FIRE}`;
    }
    try {
      navigator.clipboard.writeText(msg);
    } catch {}
    const url = createWhatsAppUrl(customer.phone, msg);
    window.open(url, "_blank");
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

        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => {
              setSentMap({});
              setCopiedBroadcastText(false);
              setShowBroadcastModal(true);
            }}
            className="h-11 px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer text-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>📢 Difusión Masiva WhatsApp</span>
          </button>

          <button 
            onClick={handleOpenCreate}
            className="h-11 px-4 sm:px-5 bg-stone-900 hover:bg-stone-800 active:scale-95 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-xs"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Cliente
          </button>
        </div>
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

      {/* ── MODAL CAMPAÑA DE DIFUSIÓN MASIVA WHATSAPP ── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Header Modal */}
            <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between bg-emerald-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white leading-tight">
                    Difusión Masiva por WhatsApp
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Envía el enlace de tu Carta Digital o Menú del Día a tus clientes
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* 1. Selección de Segmento */}
              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                  1. ¿A quiénes deseas enviar?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('all')}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition cursor-pointer",
                      broadcastTarget === 'all'
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    )}
                  >
                    <div className="text-[10px] font-black uppercase text-emerald-700">Todos</div>
                    <div className="text-sm font-black mt-0.5">{customers.filter(c => c.phone).length} con celular</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('vip')}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition cursor-pointer",
                      broadcastTarget === 'vip'
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    )}
                  >
                    <div className="text-[10px] font-black uppercase text-amber-700">Clientes VIP</div>
                    <div className="text-sm font-black mt-0.5">{customers.filter(c => c.phone && (c.tier === 'VIP' || c.tier === 'Oro' || (c.points || 0) >= 250)).length} contactos</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('debt')}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left transition cursor-pointer",
                      broadcastTarget === 'debt'
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    )}
                  >
                    <div className="text-[10px] font-black uppercase text-rose-700">Con Saldo / Fiado</div>
                    <div className="text-sm font-black mt-0.5">{debtCount} clientes</div>
                  </button>
                </div>
              </div>

              {/* 2. Tipo de Contenido / Plantilla */}
              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
                  2. Selecciona qué deseas compartir
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'carta', title: 'Carta Digital', icon: Utensils, desc: 'Enlace completo' },
                    { key: 'menu', title: 'Menú del Día', icon: Cake, desc: 'Almuerzo Criollo' },
                    { key: 'promo', title: 'Promoción', icon: Gift, desc: 'Oferta especial' },
                    { key: 'custom', title: 'Personalizado', icon: Edit2, desc: 'Texto propio' },
                  ].map((t) => {
                    const IconEl = t.icon;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setBroadcastType(t.key as any)}
                        className={cn(
                          "p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between cursor-pointer",
                          broadcastType === t.key
                            ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500/30"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <IconEl className={cn("w-4 h-4", broadcastType === t.key ? "text-emerald-700" : "text-stone-400")} />
                          {broadcastType === t.key && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-xs font-black">{t.title}</div>
                        <div className="text-[10px] text-stone-400 font-semibold">{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mensaje Personalizado si aplica */}
              {broadcastType === 'custom' && (
                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-1">
                    Escribe tu mensaje personalizado (Usa <code className="text-emerald-700 font-bold">{'{nombre}'}</code> para personalizar):
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={`¡Hola {nombre}! Te invitamos hoy a disfrutar de nuestra carta en ${settings.companyName}...`}
                    className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-medium outline-none focus:border-emerald-500 focus:bg-white resize-none"
                  />
                </div>
              )}

              {/* Selector de Imagen Flyer / Foto */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🖼️ Foto o Flyer de la Campaña</span>
                  </label>
                  {uploadedImage && (
                    <button
                      type="button"
                      onClick={() => { setUploadedImage(null); setUploadedImageFile(null); }}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-stone-100 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 cursor-pointer transition shadow-2xs">
                    <span>📤 Subir Foto desde mi Dispositivo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileSelect} 
                      className="hidden" 
                    />
                  </label>

                  {uploadedImage ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                      <img src={uploadedImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-emerald-400" />
                      <span className="text-xs font-bold text-emerald-800">✓ Tu imagen está cargada</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-stone-400 font-medium">
                      (Por defecto usa el logo/foto oficial de {settings.companyName})
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Vista Previa del Mensaje */}
              <div className="bg-[#E7F8E8] border border-emerald-300 rounded-2xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    Vista Previa del Mensaje en WhatsApp
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyImageToClipboard}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Copia la foto del negocio para pegarla con Ctrl+V en WhatsApp"
                    >
                      {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedImage ? '¡Imagen Copiada!' : '🖼️ Copiar Foto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyBroadcastText}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      {copiedBroadcastText ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBroadcastText ? '¡Copiado!' : '📋 Copiar Texto'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs text-stone-800 font-medium whitespace-pre-line shadow-2xs leading-relaxed">
                  {getBroadcastMessageForCustomer(broadcastTargetCustomers[0] || { id: 'preview', name: 'Juan Pérez' } as any)}
                </div>
                
                {/* Guía para enviar Foto + Texto en WhatsApp */}
                <div className="bg-emerald-900/5 border border-emerald-300/60 rounded-xl p-3 text-xs space-y-1.5 text-emerald-950">
                  <div className="font-black text-[11px] uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <span>📸 ¿Cómo enviar este mensaje junto a una FOTO en WhatsApp?</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-medium text-emerald-900">
                    1. Presiona arriba <strong>"Copiar Texto para Difusión"</strong>.<br />
                    2. En WhatsApp (o en tu Lista de Difusión), toca el <strong>Clip / Galería (📎)</strong> y elige la foto de tu plato estrella, flyer o pollo a la brasa.<br />
                    3. En el espacio inferior donde dice <em>"Añade un comentario..."</em>, <strong>pega el texto</strong>.<br />
                    4. Presiona <strong>Enviar</strong>. A todos tus clientes les llegará la <strong>foto en HD con el enlace directo debajo</strong>.
                  </p>
                </div>
              </div>

              {/* 4. Cola de Envío Rápido 1 a 1 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                      Cola de Envío Rápido ({broadcastTargetCustomers.length} destinatarios)
                    </h4>
                    <p className="text-[11px] text-stone-500 font-medium">
                      Toca "Enviar" en cada cliente para abrir el chat con el mensaje listo.
                    </p>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 bg-stone-100 text-stone-700 rounded-xl">
                    Enviados: {Object.keys(sentMap).length} / {broadcastTargetCustomers.length}
                  </span>
                </div>

                {broadcastTargetCustomers.length === 0 ? (
                  <div className="p-6 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-xs text-stone-500">
                    No hay clientes con teléfono en este segmento.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 border border-stone-200 rounded-2xl p-2 bg-stone-50/50 custom-scrollbar">
                    {broadcastTargetCustomers.map((cust) => {
                      const isSent = sentMap[cust.id];
                      return (
                        <div 
                          key={cust.id}
                          className="bg-white p-2.5 px-3 rounded-xl border border-stone-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              {cust.tier && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded">
                                  {cust.tier}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-stone-500">{cust.phone}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSendSingleBroadcast(cust)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-xl font-black text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95",
                              isSent 
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            )}
                          >
                            {isSent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Send className="w-3.5 h-3.5" />}
                            <span>{isSent ? "Enviado ✓" : "Enviar WhatsApp"}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="p-4 px-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleExportPhoneList}
                className="px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Lista de Celulares (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-black rounded-xl transition cursor-pointer"
              >
                Cerrar Difusión
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

