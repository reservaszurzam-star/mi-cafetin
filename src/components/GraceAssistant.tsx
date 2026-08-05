import React, { useState, useRef, useEffect } from 'react';
import { Cat, X, Send, TrendingUp, Receipt, Package, ExternalLink, Sparkles, Utensils, MessageCircleQuestion, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../hooks/StoreContext';
import { ViewState } from '../App';
import { cn } from '../lib/utils';

type Message = {
  id: string;
  sender: 'user' | 'grace';
  text: string;
  action?: {
    label: string;
    view?: ViewState;
    onClick?: () => void;
    icon: React.ReactNode;
  };
  quickReplies?: string[];
};

export default function GraceAssistant({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const { transactions, orders, products, inventoryItems, reservations, settings } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'grace',
      text: '¡Hola! Soy **GRACE** ✨ tu asistente inteligente. Estoy aquí para ayudarte a controlar tu restaurante.',
      quickReplies: ['¿Cuánto hemos vendido hoy?', '¿Cuántas mesas hay ocupadas?', '¿Qué productos faltan?']
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  const processQuery = (query: string) => {
    const q = query.toLowerCase();
    const today = new Date().toLocaleDateString('en-CA');
    const todaysOrders = orders.filter(o => o.createdAt.startsWith(today));
    
    let responseText = '';
    let action: Message['action'] = undefined;
    let quickReplies: string[] | undefined = undefined;

    if (q.includes('venta') || q.includes('vendido') || q.includes('ingreso') || q.includes('dinero') || q.includes('caja')) {
      const sales = todaysOrders.filter(o => o.status === 'served' || o.status === 'completed').reduce((a, b) => a + b.total, 0);
      responseText = `Hasta el momento, las ventas de hoy suman **${settings.currency} ${sales.toFixed(2)}**.\n\n¿Quieres realizar el arqueo de caja o ver el reporte detallado?`;
      action = { label: "Ir a Cierre de Caja", view: { name: "cash_register" }, icon: <Receipt className="w-4 h-4" /> };
      quickReplies = ['Ver reporte de ventas', 'Ver mesas activas'];
    } 
    else if (q.includes('reporte') || q.includes('estadistica') || q.includes('grafico')) {
      responseText = `Tengo listos los gráficos de ingresos y productos más vendidos.`;
      action = { label: "Abrir Reportes BI", view: { name: "reports" }, icon: <TrendingUp className="w-4 h-4" /> };
    }
    else if (q.includes('stock') || q.includes('inventario') || q.includes('falta') || q.includes('agotado')) {
      const lowStock = products.filter(p => p.stock !== undefined && p.stock <= (settings.lowStockThreshold || 5));
      if (lowStock.length > 0) {
        const names = lowStock.map(p => p.name).slice(0, 3).join(', ');
        responseText = `⚠️ Tienes **${lowStock.length} productos** con stock crítico (Ej: ${names}${lowStock.length > 3 ? ', etc' : ''}). Deberías reabastecerlos pronto.`;
      } else {
        responseText = `✅ Todo excelente. Ningún producto está por debajo del stock mínimo.`;
      }
      action = { label: "Gestionar Inventario", view: { name: "products" }, icon: <Package className="w-4 h-4" /> };
    }
    else if (q.includes('mesa') || q.includes('comanda') || q.includes('pedido') || q.includes('ocupada')) {
      const openOrders = orders.filter(o => o.status === 'active' || o.status === 'pending');
      if (openOrders.length > 0) {
        const tables = openOrders.map(o => o.tableNumber).join(', ');
        responseText = `Actualmente hay **${openOrders.length} mesas ocupadas** (${tables}).`;
        action = { label: "Ver Plano de Mesas", view: { name: "pos" }, icon: <Utensils className="w-4 h-4" /> };
      } else {
        responseText = `En este momento no hay mesas ocupadas. ¡Esperemos que lleguen clientes pronto!`;
        action = { label: "Ir al Módulo POS", view: { name: "pos" }, icon: <Utensils className="w-4 h-4" /> };
      }
    }
    else if (q.includes('hola') || q.includes('saludo') || q.includes('buen') || q.includes('qué tal')) {
      responseText = "¡Hola! Soy Grace 😺. Siempre a tu servicio. ¿Qué necesitas revisar hoy en el restaurante?";
      quickReplies = ['¿Cuánto hemos vendido hoy?', 'Ver stock de insumos', 'Ver reservas'];
    }
    // Sumas matemáticas (e.g., "suma 20 + 30", "cuanto es 5 + 10")
    else if (q.includes('+') || q.includes('suma')) {
      const match = q.match(/(\d+)\s*\+\s*(\d+)/);
      if (match) {
        const num1 = parseInt(match[1]);
        const num2 = parseInt(match[2]);
        responseText = `El resultado de sumar ${num1} + ${num2} es **${num1 + num2}**. ¡Las matemáticas no fallan! 🤓`;
      } else {
        responseText = "Parece que quieres sumar algo, intenta usar el formato '20 + 30'.";
      }
    }
    // Kardex / Insumos
    else if (q.includes('insumo') || q.includes('kardex') || q.includes('pollo') || q.includes('limón') || q.includes('limon') || q.includes('ingrediente')) {
      const lowInv = inventoryItems.filter(i => i.currentStock <= i.minStock);
      if (lowInv.length > 0) {
        const names = lowInv.map(i => i.name).slice(0, 3).join(', ');
        responseText = `Revisé el Kardex. Ojo, tenemos **${lowInv.length} insumos** con stock bajo (Ej: ${names}). Deberíamos comprar más.`;
      } else {
        responseText = `Revisé el Kardex. ¡Todo el inventario de insumos está en niveles óptimos! 🥦🥩`;
      }
      action = { label: "Ir al Kardex", view: { name: "inventory" }, icon: <Package className="w-4 h-4" /> };
    }
    // Reservas
    else if (q.includes('reserva') || q.includes('agenda') || q.includes('calendario')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRes = reservations.filter(r => r.date === todayStr);
      const pendingRes = todayRes.filter(r => r.status === 'pending');
      if (todayRes.length > 0) {
        responseText = `Para hoy tenemos **${todayRes.length} reservas** en total, de las cuales **${pendingRes.length}** aún están pendientes por confirmar.`;
      } else {
        responseText = `He revisado la agenda y **no tenemos reservas** para el día de hoy.`;
      }
      action = { label: "Ver Calendario", view: { name: "reservations" }, icon: <Calendar className="w-4 h-4" /> };
    }
    else {
      responseText = "Mmm... aún estoy aprendiendo y no entendí bien eso. 😺\n\nPuedes intentar preguntarme:\n- *¿Cuánto hemos vendido hoy?*\n- *¿Cómo está el inventario?*\n- *¿Tenemos reservas hoy?*\n- *Suma 15 + 45*";
      quickReplies = ['Ver ventas', 'Ver reservas', 'Revisar inventario'];
    }

    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'grace',
      text: responseText,
      action,
      quickReplies
    }]);
  };

  const submitMessage = (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
    setInput('');
    setIsTyping(true);
    
    // Simular tiempo de "pensar"
    setTimeout(() => {
      processQuery(text);
    }, 800);
  };

  return (
    <>
      {/* Botón flotante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl flex items-center justify-center group bg-gradient-to-r from-amber-500 to-orange-500 text-white"
          >
            <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[calc(100vh-6rem)] bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 dark:from-black dark:to-stone-900 px-5 py-4 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Cat className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-base flex items-center gap-1.5">
                    GRACE <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-stone-400 text-[10px] font-bold tracking-widest uppercase">Inteligencia Artificial</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-700 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-stone-950/50 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
              <div className="text-center pb-2">
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest bg-stone-200 dark:bg-stone-800 px-3 py-1 rounded-full">Hoy</span>
              </div>
              
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={msg.id} 
                  className={cn("flex flex-col max-w-[88%]", msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
                >
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm",
                    msg.sender === 'user' 
                      ? "bg-amber-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-tl-sm"
                  )}>
                    {/* Render bold text properly */}
                    {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className={msg.sender === 'user' ? "text-white" : "text-amber-600 dark:text-amber-400"}>{part}</strong> : part)}
                  </div>
                  
                  {/* Action Button */}
                  {msg.action && (
                    <button
                      onClick={() => {
                        if (msg.action?.view) onNavigate(msg.action.view);
                        if (msg.action?.onClick) msg.action.onClick();
                        setIsOpen(false);
                      }}
                      className="mt-2 w-full bg-stone-900 hover:bg-stone-800 text-amber-400 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      {msg.action.icon} {msg.action.label}
                    </button>
                  )}

                  {/* Quick Replies */}
                  {msg.quickReplies && idx === messages.length - 1 && !isTyping && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => submitMessage(reply)}
                          className="px-3 py-1.5 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-amber-200 dark:border-stone-700 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full transition-colors shadow-sm"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-4 py-3 rounded-2xl rounded-tl-sm w-fit shadow-sm">
                  <motion.div className="w-1.5 h-1.5 bg-amber-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-amber-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                  <motion.div className="w-1.5 h-1.5 bg-amber-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex-shrink-0 z-10 relative">
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
                    placeholder="Escribe tu consulta..."
                    className="w-full bg-stone-100 dark:bg-stone-800/50 border border-transparent focus:border-amber-500 focus:bg-white dark:focus:bg-stone-900 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none transition-all dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-md"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
