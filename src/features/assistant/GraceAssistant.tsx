import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Cat, X, Send, TrendingUp, Receipt, Package, ExternalLink, 
  Sparkles, Utensils, MessageCircleQuestion, Calendar, Crown, 
  ShieldCheck, Banknote, UserCheck, ChefHat, Bike, RotateCcw, 
  Bot, CheckCircle2, ChevronRight, Zap, RefreshCw, BarChart2,
  AlertCircle, DollarSign, Clock, Truck, Sliders, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from "../../hooks/StoreContext";
import { ViewState } from "../../App";
import { RoleType } from "../../types";
import { cn } from "../../lib/utils";

type Message = {
  id: string;
  sender: 'user' | 'grace';
  text: string;
  richData?: {
    type: 'sales' | 'tables' | 'inventory' | 'delivery' | 'role_switch';
    metrics?: { label: string; value: string; color?: string }[];
    badge?: string;
  };
  action?: {
    label: string;
    view?: ViewState;
    onClick?: () => void;
    icon: React.ReactNode;
  };
  quickReplies?: string[];
};

export default function GraceAssistant({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { 
    transactions, 
    orders, 
    products, 
    inventoryItems, 
    reservations, 
    settings, 
    currentUser, 
    ownerSimulatedRole, 
    setOwnerSimulatedRole,
    rolePermissions,
    hasPermission
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'shortcuts' | 'roles'>('chat');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [permissionDeniedModal, setPermissionDeniedModal] = useState<{ moduleName: string; roleName: string } | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'grace',
      text: '¡Hola! Soy **GRACE**, la Inteligencia Artificial de gestión de tu restaurante. Estoy conectada a Supabase en tiempo real para brindarte métricas, alertas y ayudarte a operar el sistema.',
      quickReplies: ['¿Cuánto hemos vendido hoy?', '¿Mesas ocupadas?', '¿Qué insumos faltan?']
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping, activeTab]);

  // Cálculos en tiempo real
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const todaysOrders = useMemo(() => orders.filter(o => o.createdAt && o.createdAt.startsWith(today)), [orders, today]);
  const activeTablesCount = useMemo(() => orders.filter(o => o.status === 'active' || o.status === 'pending').length, [orders]);
  const todaysSalesTotal = useMemo(() => {
    return todaysOrders
      .filter(o => o.status === 'paid' || o.status === 'served' || o.status === 'completed')
      .reduce((acc, o) => acc + (o.total || 0), 0);
  }, [todaysOrders]);
  const criticalProductsCount = useMemo(() => {
    return products.filter(p => p.stock !== undefined && p.stock <= (settings.lowStockThreshold || 5)).length;
  }, [products, settings.lowStockThreshold]);

  // Función de navegación segura que valida permisos por rol
  const handleGraceNavigate = (view: ViewState, customLabel?: string) => {
    const moduleKey = view.name as any;
    const allowed = hasPermission(moduleKey);
    const activeRole = ownerSimulatedRole || currentUser.role;

    if (!allowed) {
      setPermissionDeniedModal({
        moduleName: customLabel || view.name.toUpperCase(),
        roleName: activeRole
      });
      return;
    }

    onNavigate(view);
    setIsOpen(false);
  };

  const processQuery = (query: string) => {
    const q = query.toLowerCase().trim();
    
    let responseText = '';
    let richData: Message['richData'] = undefined;
    let action: Message['action'] = undefined;
    let quickReplies: string[] | undefined = undefined;

    // ── GOBERNANZA DE ROLES / SIMULACIÓN (Estrictamente Exclusivo Owner) ──
    if (q.includes('simular') || q.includes('probar rol') || q.includes('ver como') || q.includes('rol') || q.includes('permiso')) {
      if (currentUser.role === 'Owner') {
        if (q.includes('mesera') || q.includes('mozo')) {
          setOwnerSimulatedRole('Mozo');
          responseText = `He cambiado la vista a **Modo Mesera**. El menú lateral y las pantallas ahora solo muestran las pestañas permitidas para Mozo.`;
          quickReplies = ['Volver a modo Owner', '¿Qué pestañas tengo activas?'];
        } else if (q.includes('cajera') || q.includes('cajero') || q.includes('caja')) {
          setOwnerSimulatedRole('Cajero');
          responseText = `He cambiado la vista a **Modo Cajera**. Ya puedes probar la experiencia de facturación y cobros.`;
          quickReplies = ['Volver a modo Owner', 'Ir a Punto de Venta'];
        } else if (q.includes('cocinero') || q.includes('chef') || q.includes('cocina')) {
          setOwnerSimulatedRole('Cocinero');
          responseText = `He activado el **Modo Cocina / Chef**. Visualizarás el KDS y los recetarios técnicos.`;
          quickReplies = ['Volver a modo Owner', 'Ver Monitor KDS'];
        } else if (q.includes('repartidor') || q.includes('delivery') || q.includes('motorizado')) {
          setOwnerSimulatedRole('Repartidor');
          responseText = `Modo **Motorizado** activado. Solo verás despachos y rutas GPS.`;
          quickReplies = ['Volver a modo Owner', 'Ver Delivery'];
        } else if (q.includes('admin') || q.includes('administrador')) {
          setOwnerSimulatedRole('Administrador');
          responseText = `Modo **Administrador** activado con acceso de gestión de sede.`;
          quickReplies = ['Volver a modo Owner', 'Configurar Permisos'];
        } else if (q.includes('restaurar') || q.includes('owner') || q.includes('salir')) {
          setOwnerSimulatedRole(null);
          responseText = `¡Modo simulación desactivado! Has vuelto a tu perfil maestro de **Owner** con acceso irrestricto al 100% de los módulos.`;
          quickReplies = ['¿Cuánto hemos vendido hoy?', 'Ver resumen de mesas'];
        } else {
          responseText = `Como **Owner**, puedes probar cualquier perfil en tiempo real. ¿Qué rol deseas simular?`;
          quickReplies = ['Simular Mesera', 'Simular Cajera', 'Simular Cocinero', 'Volver a modo Owner'];
        }
      } else {
        responseText = `🔒 La función de simulación y prueba de roles es exclusiva para el **Owner**. Tu rol actual es **${currentUser.role}** y cuentas únicamente con las pestañas autorizadas por el Administrador.`;
      }
    }

    // ── VENTAS & CAJA ──
    else if (q.includes('venta') || q.includes('vendido') || q.includes('ingreso') || q.includes('dinero') || q.includes('caja') || q.includes('facturado')) {
      responseText = `Hasta el momento, las ventas registradas hoy suman **${settings.currency} ${todaysSalesTotal.toFixed(2)}** con un total de **${todaysOrders.length} pedidos** procesados en ${settings.companyName}.`;
      richData = {
        type: 'sales',
        badge: 'En tiempo real',
        metrics: [
          { label: 'Total Ventas', value: `${settings.currency} ${todaysSalesTotal.toFixed(2)}`, color: 'text-emerald-600' },
          { label: 'Pedidos Hoy', value: `${todaysOrders.length} órdenes` },
          { label: 'Mesas Ocupadas', value: `${activeTablesCount} mesas`, color: 'text-amber-600' },
        ]
      };
      action = { label: "Ir a Cierre de Caja", view: { name: "cash_register" }, icon: <Receipt className="w-4 h-4" /> };
      quickReplies = ['Ver reporte de ventas', '¿Cuántas mesas hay ocupadas?', 'Ver gastos'];
    } 

    // ── REPORTES & ANALÍTICA ──
    else if (q.includes('reporte') || q.includes('estadistica') || q.includes('grafico') || q.includes('ranking') || q.includes('top')) {
      responseText = `He preparado el análisis de ingresos, ranking de platos más vendidos y flujo de ventas del negocio.`;
      action = { label: "Abrir Reportes BI", view: { name: "reports" }, icon: <TrendingUp className="w-4 h-4" /> };
      quickReplies = ['¿Cuánto hemos vendido hoy?', 'Ver gastos'];
    }

    // ── STOCK & PRODUCTOS ──
    else if (q.includes('stock') || q.includes('inventario') || q.includes('falta') || q.includes('agotado') || q.includes('plato')) {
      const lowStock = products.filter(p => p.stock !== undefined && p.stock <= (settings.lowStockThreshold || 5));
      if (lowStock.length > 0) {
        const names = lowStock.map(p => p.name).slice(0, 3).join(', ');
        responseText = `¡Atención! Tienes **${lowStock.length} productos** en stock crítico (Ej: *${names}*${lowStock.length > 3 ? ', etc.' : ''}).`;
        richData = {
          type: 'inventory',
          badge: 'Alerta Stock',
          metrics: [
            { label: 'Productos Críticos', value: `${lowStock.length} ítems`, color: 'text-rose-600' },
            { label: 'Umbral Mínimo', value: `${settings.lowStockThreshold || 5} un.` },
          ]
        };
      } else {
        responseText = `Excelente noticia: todos los productos de la carta cuentan con stock suficiente por encima del umbral mínimo.`;
      }
      action = { label: "Gestionar Carta & Stock", view: { name: "products" }, icon: <Package className="w-4 h-4" /> };
      quickReplies = ['Ver insumos de Kárdex', 'Ver ventas de hoy'];
    }

    // ── MESAS & COMANDAS ──
    else if (q.includes('mesa') || q.includes('comanda') || q.includes('pedido') || q.includes('ocupada') || q.includes('salon')) {
      const openOrders = orders.filter(o => o.status === 'active' || o.status === 'pending');
      if (openOrders.length > 0) {
        const tables = openOrders.map(o => `Mesa ${o.tableNumber}`).slice(0, 5).join(', ');
        responseText = `Actualmente hay **${openOrders.length} mesas activas** con consumo en salón (${tables}${openOrders.length > 5 ? '...' : ''}).`;
        richData = {
          type: 'tables',
          badge: 'Salón en Vivo',
          metrics: [
            { label: 'Mesas Ocupadas', value: `${openOrders.length} mesas`, color: 'text-amber-600' },
            { label: 'Estado Comandas', value: 'En atención' },
          ]
        };
      } else {
        responseText = `El salón se encuentra 100% disponible. No hay comandas abiertas en este momento.`;
      }
      action = { label: "Ver Plano de Mesas POS", view: { name: "pos" }, icon: <Utensils className="w-4 h-4" /> };
      quickReplies = ['Ver monitor de cocina KDS', '¿Cuánto hemos vendido hoy?'];
    }

    // ── KDS / COCINA ──
    else if (q.includes('cocina') || q.includes('kds') || q.includes('horno') || q.includes('preparando')) {
      const kitchenOrders = orders.filter(o => o.status === 'active' || o.status === 'pending');
      responseText = `Hay **${kitchenOrders.length} pedidos** en curso en las estaciones de Cocina, Horno y Barra.`;
      action = { label: "Abrir Monitor KDS", view: { name: "kds" }, icon: <ChefHat className="w-4 h-4" /> };
      quickReplies = ['Ver plano de mesas', '¿Cuánto hemos vendido hoy?'];
    }

    // ── KARDEX / INSUMOS ──
    else if (q.includes('insumo') || q.includes('kardex') || q.includes('ingrediente') || q.includes('compra') || q.includes('proveedor')) {
      const lowInv = inventoryItems.filter(i => i.currentStock <= i.minStock);
      if (lowInv.length > 0) {
        const names = lowInv.map(i => i.name).slice(0, 3).join(', ');
        responseText = `Revisé el Kárdex en Supabase: **${lowInv.length} insumos** están por debajo del stock de seguridad (*${names}*). Se recomienda generar orden de compra.`;
      } else {
        responseText = `Todo el inventario de insumos (Kárdex) se encuentra en niveles saludables.`;
      }
      action = { label: "Ir a Inventario Kárdex", view: { name: "inventory" }, icon: <Package className="w-4 h-4" /> };
      quickReplies = ['Ver productos de la carta', 'Ver proveedores'];
    }

    // ── RESERVAS ──
    else if (q.includes('reserva') || q.includes('agenda') || q.includes('calendario')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRes = reservations.filter(r => r.date === todayStr);
      if (todayRes.length > 0) {
        responseText = `Para hoy tenemos registradas **${todayRes.length} reservas** de clientes.`;
      } else {
        responseText = `No hay reservas agendadas para el día de hoy.`;
      }
      action = { label: "Ver Calendario de Reservas", view: { name: "reservations" }, icon: <Calendar className="w-4 h-4" /> };
      quickReplies = ['Ver mesas ocupadas', 'Ver ventas'];
    }

    // ── FACTURACIÓN SUNAT ──
    else if (q.includes('sunat') || q.includes('boleta') || q.includes('factura') || q.includes('comprobante')) {
      responseText = `El módulo SUNAT está listo para emitir y sincronizar Boletas (B001) y Facturas (F001) electrónicas.`;
      action = { label: "Ir a Facturación SUNAT", view: { name: "sunat" }, icon: <Receipt className="w-4 h-4" /> };
      quickReplies = ['Ver cierre de caja', 'Ver ventas'];
    }

    // ── MATEMÁTICAS ──
    else if (q.includes('+') || q.includes('suma') || q.includes('*') || q.includes('-')) {
      try {
        const sanitized = q.replace(/[^0-9+\-*/.]/g, '');
        if (sanitized) {
          // eslint-disable-next-line no-eval
          const result = Function(`'use strict'; return (${sanitized})`)();
          responseText = `El resultado de **${sanitized}** es **${result}**.`;
        } else {
          responseText = "Por favor escribe una operación matemática simple, por ejemplo: `120 + 45`.";
        }
      } catch {
        responseText = "No pude calcular la operación, intenta con números sencillos.";
      }
    }

    // ── SALUDO ──
    else if (q.includes('hola') || q.includes('saludo') || q.includes('buen') || q.includes('qué tal') || q.includes('que tal') || q.includes('grace')) {
      const name = currentUser.name || 'Valentino';
      responseText = `¡Hola **${name}**! Soy Grace, tu copiloto con Inteligencia Artificial. Estoy lista para monitorear el restaurante, darte métricas en vivo o ayudarte a simular roles de trabajo.`;
      quickReplies = ['¿Cuánto hemos vendido hoy?', '¿Mesas ocupadas?', 'Simular otro rol'];
    }

    // ── RESPUESTA GENERAL INTELIGENTE ──
    else {
      responseText = `He analizado tu consulta. Puedo ayudarte con información en tiempo real de:\n\n• **Ventas y Caja:** *"¿Cuánto hemos vendido hoy?"*\n• **Salón:** *"¿Qué mesas están ocupadas?"*\n• **Stock y Kárdex:** *"¿Qué insumos faltan?"*\n• **Simulador de Roles:** *"Simular rol Mesera"* *(Exclusivo Owner)*\n• **Operaciones:** *"Abrir KDS"*, *"Facturación SUNAT"*`;
      quickReplies = ['¿Cuánto vendimos hoy?', 'Ver mesas activas', 'Simular rol'];
    }

    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'grace',
      text: responseText,
      richData,
      action,
      quickReplies
    }]);
  };

  const submitMessage = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      processQuery(text);
    }, 600);
  };

  const isOwner = currentUser.role === 'Owner';

  return (
    <>
      {/* ── BOTÓN FLOTANTE ELEGANTE DE GRACE IA ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-3.5 sm:p-4 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.25)] flex items-center gap-2 group bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white border-2 border-amber-400/60 cursor-pointer"
            title="Abrir Grace IA · Asistente Inteligente"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                <Cat className="w-4 h-4 text-stone-950 group-hover:scale-110 transition-transform" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-stone-900 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-stone-900 rounded-full" />
            </div>
            
            <div className="hidden sm:flex flex-col text-left pr-1">
              <span className="text-xs font-black text-white flex items-center gap-1">
                GRACE <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider">
                {ownerSimulatedRole ? `Modo ${ownerSimulatedRole}` : 'IA Activa'}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── VENTANA DE CHAT DE GRACE IA ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-5rem)] bg-white dark:bg-stone-950 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col origin-bottom-right font-sans"
          >
            {/* Header de Grace */}
            <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md border-2 border-amber-300">
                  <Cat className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-white font-black text-base">GRACE IA</h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-stone-950">PRO</span>
                  </div>
                  <p className="text-stone-400 text-[11px] font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En línea · {settings.companyName}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-800 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Navegación Interna en Grace */}
            <div className="flex bg-stone-100 dark:bg-stone-900 p-1.5 border-b border-stone-200 dark:border-stone-800 text-xs font-bold shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'chat' ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-black" : "text-stone-500 hover:text-stone-800"
                )}
              >
                <Bot className="w-3.5 h-3.5 text-amber-500" />
                <span>Chat Asistente</span>
              </button>

              <button
                onClick={() => setActiveTab('shortcuts')}
                className={cn(
                  "flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'shortcuts' ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-black" : "text-stone-500 hover:text-stone-800"
                )}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Métricas en Vivo</span>
              </button>

              {isOwner && (
                <button
                  onClick={() => setActiveTab('roles')}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer",
                    activeTab === 'roles' ? "bg-amber-500 text-stone-950 font-black shadow-xs" : "text-amber-700 dark:text-amber-400 hover:text-amber-900"
                  )}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Probar Roles</span>
                </button>
              )}
            </div>

            {/* ── TAB 1: CHAT PRINCIPAL ── */}
            {activeTab === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8f5] dark:bg-stone-950/60 custom-scrollbar">
                  
                  {ownerSimulatedRole && (
                    <div className="p-2.5 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-between text-xs text-amber-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-700" />
                        Probando como: <strong>{ownerSimulatedRole}</strong>
                      </span>
                      <button
                        onClick={() => setOwnerSimulatedRole(null)}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black transition cursor-pointer"
                      >
                        Restaurar
                      </button>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      key={msg.id} 
                      className={cn("flex flex-col max-w-[90%]", msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap shadow-xs leading-relaxed",
                        msg.sender === 'user' 
                          ? "bg-stone-900 text-white rounded-br-xs font-medium"
                          : "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 rounded-tl-xs"
                      )}>
                        {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className={msg.sender === 'user' ? "text-amber-300 font-black" : "text-amber-700 dark:text-amber-400 font-black"}>{part}</strong> : part)}
                      </div>

                      {/* Tarjeta de Datos Enriquecidos */}
                      {msg.richData && (
                        <div className="mt-2 w-full bg-white dark:bg-stone-900 rounded-2xl p-3 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-400">
                            <span>{msg.richData.badge || 'Resumen'}</span>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {msg.richData.metrics?.map((m, i) => (
                              <div key={i} className="bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl border border-stone-100 dark:border-stone-700/60">
                                <div className="text-[10px] text-stone-500 font-semibold">{m.label}</div>
                                <div className={cn("text-xs font-black mt-0.5", m.color || "text-stone-900 dark:text-white")}>{m.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Botón de Acción con Enrutamiento Seguro */}
                      {msg.action && (
                        <button
                          onClick={() => {
                            if (msg.action?.view) {
                              handleGraceNavigate(msg.action.view, msg.action.label);
                            }
                            if (msg.action?.onClick) {
                              msg.action.onClick();
                            }
                          }}
                          className="mt-2 w-full bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl px-4 py-2.5 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-98"
                        >
                          {msg.action.icon} {msg.action.label} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Quick Replies */}
                      {msg.quickReplies && idx === messages.length - 1 && !isTyping && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {msg.quickReplies.map((reply, i) => (
                            <button
                              key={i}
                              onClick={() => submitMessage(reply)}
                              className="px-2.5 py-1 bg-white dark:bg-stone-900 hover:bg-amber-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-amber-800 text-[11px] font-bold rounded-full transition shadow-2xs cursor-pointer"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-4 py-3 rounded-2xl rounded-tl-xs w-fit shadow-xs">
                      <motion.div className="w-1.5 h-1.5 bg-amber-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-amber-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-amber-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de Chat */}
                <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 shrink-0">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitMessage(input);
                    }} 
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <MessageCircleQuestion className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Pregúntale a Grace (ventas, stock, mesas)..."
                        className="w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold outline-none transition dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim() || isTyping}
                      className="w-11 h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-stone-950 flex items-center justify-center transition shadow-md cursor-pointer active:scale-95 shrink-0 font-black"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* ── TAB 2: MÉTRICAS EN VIVO & ACCESOS RÁPIDOS ── */}
            {activeTab === 'shortcuts' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-950/60 custom-scrollbar">
                
                {/* Métricas Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => handleGraceNavigate({ name: "cash_register" }, "Cierre de Caja")}
                    className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs cursor-pointer hover:border-amber-400 transition"
                  >
                    <div className="flex items-center justify-between text-emerald-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">Ventas</span>
                    </div>
                    <div className="text-base font-black text-stone-900 dark:text-white">{settings.currency} {todaysSalesTotal.toFixed(2)}</div>
                    <div className="text-[10px] text-stone-400 font-bold mt-0.5">{todaysOrders.length} pedidos hoy</div>
                  </div>

                  <div 
                    onClick={() => handleGraceNavigate({ name: "pos" }, "Punto de Venta")}
                    className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs cursor-pointer hover:border-amber-400 transition"
                  >
                    <div className="flex items-center justify-between text-amber-600 mb-1">
                      <Utensils className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">Salón</span>
                    </div>
                    <div className="text-base font-black text-stone-900 dark:text-white">{activeTablesCount} mesas</div>
                    <div className="text-[10px] text-stone-400 font-bold mt-0.5">Comandas activas</div>
                  </div>
                </div>

                {/* Accesos Rápidos Guiados */}
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Acciones Rápidas con Grace</div>
                  
                  {[
                    { label: "Punto de Venta POS & Salón", view: { name: "pos" as const }, icon: Utensils, desc: "Toma comandas y administra mesas" },
                    { label: "Monitor Cocina KDS", view: { name: "kds" as const }, icon: ChefHat, desc: "Visualiza preparación en tiempo real" },
                    { label: "Arqueo & Cierre de Caja", view: { name: "cash_register" as const }, icon: Receipt, desc: "Concilia el efectivo del día" },
                    { label: "Facturación Electrónica SUNAT", view: { name: "sunat" as const }, icon: CheckCircle2, desc: "Emite boletas y facturas B001/F001" },
                    { label: "Gobernanza de Roles & Permisos", view: { name: "role_permissions" as const }, icon: Sliders, desc: "Configura visibilidad de pestañas" },
                    { label: "Reportes & Analítica BI", view: { name: "reports" as const }, icon: TrendingUp, desc: "Descarga reportes Excel y ranking" },
                  ].map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleGraceNavigate(act.view, act.label)}
                      className="w-full p-3 rounded-2xl bg-white dark:bg-stone-900 hover:bg-amber-50/60 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 text-left transition flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-stone-800 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <act.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-stone-900 dark:text-white truncate group-hover:text-amber-700">{act.label}</div>
                          <div className="text-[10px] text-stone-400 font-medium truncate">{act.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* ── TAB 3: PROBADOR DE ROLES (Exclusivo Owner) ── */}
            {activeTab === 'roles' && isOwner && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-950/60 custom-scrollbar">
                
                <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 p-4 rounded-2xl text-white border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> Consola del Owner
                    </span>
                    {ownerSimulatedRole && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-stone-950">
                        Simulando: {ownerSimulatedRole}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-300 font-medium leading-relaxed">
                    Cambia la vista para probar cómo experimenta la plataforma cada colaborador según sus pestañas asignadas:
                  </p>
                </div>

                {/* Grid de Roles */}
                <div className="space-y-2">
                  {[
                    { role: null, label: 'Owner (Modo Real)', desc: 'Acceso total y absoluto al 100% de los módulos', icon: Crown, active: !ownerSimulatedRole },
                    { role: 'Administrador' as RoleType, label: 'Administrador', desc: 'Gestión completa de sucursal y finanzas', icon: ShieldCheck, active: ownerSimulatedRole === 'Administrador' },
                    { role: 'Cajero' as RoleType, label: 'Cajera / Facturación', desc: 'Caja, POS, SUNAT y cobros', icon: Banknote, active: ownerSimulatedRole === 'Cajero' },
                    { role: 'Mozo' as RoleType, label: 'Mesera / Salón', desc: 'Comandas, pedidos y reservas', icon: UserCheck, active: ownerSimulatedRole === 'Mozo' },
                    { role: 'Cocinero' as RoleType, label: 'Chef / Cocinero', desc: 'Monitor KDS y recetarios', icon: ChefHat, active: ownerSimulatedRole === 'Cocinero' },
                    { role: 'Repartidor' as RoleType, label: 'Motorizado / Delivery', desc: 'Despacho de pedidos y rutas GPS', icon: Bike, active: ownerSimulatedRole === 'Repartidor' },
                  ].map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setOwnerSimulatedRole(r.role)}
                      className={cn(
                        "w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer select-none",
                        r.active
                          ? "bg-amber-500 text-stone-950 border-amber-300 font-black shadow-md scale-[1.01]"
                          : "bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800 hover:border-amber-400"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                          r.active ? "bg-stone-950 text-amber-400 border-stone-900" : "bg-stone-100 text-stone-700 border-stone-200"
                        )}>
                          <r.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{r.label}</div>
                          <div className={cn("text-[10px] font-medium truncate mt-0.5", r.active ? "text-stone-900" : "text-stone-400")}>
                            {r.desc}
                          </div>
                        </div>
                      </div>

                      {r.active && (
                        <CheckCircle2 className="w-5 h-5 text-stone-950 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>

                {ownerSimulatedRole && (
                  <button
                    onClick={() => setOwnerSimulatedRole(null)}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-amber-400 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Modo Owner Total</span>
                  </button>
                )}

              </div>
            )}

            {/* ── MODAL DE ACCESO RESTRINGIDO (SOLICITAR AL ADMINISTRADOR) ── */}
            {permissionDeniedModal && (
              <div className="absolute inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-stone-200 dark:border-stone-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-300">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-stone-900 dark:text-white">Acceso Restringido</h4>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 font-medium mt-1 leading-relaxed">
                      Tu rol actual (<strong className="text-amber-700 dark:text-amber-400">{permissionDeniedModal.roleName}</strong>) no tiene permisos asignados para acceder a <strong>"{permissionDeniedModal.moduleName}"</strong>.
                    </p>
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200 dark:border-stone-700 text-[10px] text-amber-900 dark:text-amber-300 font-bold">
                      💡 Solicita acceso a un <strong>Administrador</strong> o al <strong>Owner</strong> para activar esta pestaña.
                    </div>
                  </div>
                  <button
                    onClick={() => setPermissionDeniedModal(null)}
                    className="w-full py-2.5 bg-stone-900 hover:bg-black text-amber-400 font-black text-xs rounded-xl transition shadow-sm cursor-pointer active:scale-95"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
