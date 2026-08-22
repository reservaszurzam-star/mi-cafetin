import React, { useState } from 'react';
import { 
  BookOpen, HelpCircle, X, ChevronRight, CheckCircle2, 
  Sparkles, UtensilsCrossed, ChefHat, Bike, FileText, 
  Boxes, TrendingUp, Calendar, Users, Zap
} from 'lucide-react';
import { cn } from "../../lib/utils";

export interface TutorialModule {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  summary: string;
  steps: { title: string; desc: string; tip?: string }[];
}

export const MODULE_TUTORIALS: TutorialModule[] = [
  {
    id: "pos",
    title: "Punto de Venta (POS) & Comandas",
    category: "Operaciones",
    icon: <UtensilsCrossed className="w-5 h-5 text-amber-500" />,
    summary: "Aprende a abrir mesas, añadir platos, enviar comandas a cocina y generar pre-cuentas.",
    steps: [
      {
        title: "1. Seleccionar o Crear Mesa",
        desc: "Elige el piso (Piso 1, 2, 3, Terraza o Delivery) y toca el número de mesa, o pulsa '+ Cuenta / Cliente' para asignar un nombre personalizado.",
        tip: "Para atención rápida en barra sin asignar mesa, usa el botón 'Venta Libre'."
      },
      {
        title: "2. Agregar Platos y Combos",
        desc: "Navega por las categorías de la carta o usa el buscador para agregar platos a la comanda activa.",
        tip: "Puedes pulsar '+ Nota' en cualquier ítem para observaciones de cocina (ej: 'Sin cebolla', 'Término medio')."
      },
      {
        title: "3. Enviar a Cocina / Horno",
        desc: "Presiona 'Enviar a Cocina'. Solo los nuevos ítems en borrador se enviarán e imprimirán en la comanda de la estación correspondiente.",
        tip: "Si agregas nuevos platos más tarde, se enviarán con un nuevo número de Lote (#2, #3) sin duplicar los anteriores."
      },
      {
        title: "4. Pre-cuenta y Cobro",
        desc: "Pulsa 'Pre-cuenta' para imprimir el ticket de verificación del cliente. Al terminar, pulsa 'Cobrar' para elegir método de pago, dividir la cuenta o emitir Boleta/Factura.",
      }
    ]
  },
  {
    id: "kds",
    title: "Monitor KDS de Cocina & Horno",
    category: "Cocina",
    icon: <ChefHat className="w-5 h-5 text-orange-500" />,
    summary: "Visualización en pantalla táctil de comandas pendientes y tiempos de preparación.",
    steps: [
      {
        title: "1. Recepción en Tiempo Real",
        desc: "Las comandas enviadas desde el POS aparecen automáticamente ordenadas por tiempo transcurrido.",
        tip: "Los pedidos con más de 15 minutos en espera se resaltan en color rojo para atención prioritaria."
      },
      {
        title: "2. Despacho y Cambio a 'Servido'",
        desc: "Cuando los platos estén listos para salir a salón, el cocinero pulsa 'Marcar Servido'.",
        tip: "Esto actualizará el estado en el POS del mozo y en el monitor general."
      }
    ]
  },
  {
    id: "delivery",
    title: "Control de Delivery & Flota",
    category: "Delivery",
    icon: <Bike className="w-5 h-5 text-blue-500" />,
    summary: "Gestión de pedidos para llevar, asignación de motorizados y despacho por WhatsApp.",
    steps: [
      {
        title: "1. Tomar Pedido Delivery",
        desc: "Selecciona el canal 'Delivery' en el POS y registra la dirección, teléfono y nombre del cliente.",
      },
      {
        title: "2. Asignar Motorizado",
        desc: "Cuando la cocina despache el pedido, ve al Tablero Delivery y asigna un repartidor disponible.",
        tip: "Pulsa el ícono de WhatsApp para enviarle la dirección, link de Google Maps y total a cobrar directamente al motorizado."
      },
      {
        title: "3. Confirmar Entrega",
        desc: "Al regresar el motorizado con el dinero o voucher, marca el pedido como 'Entregado'."
      }
    ]
  },
  {
    id: "sunat",
    title: "Facturación Electrónica SUNAT",
    category: "Administración",
    icon: <FileText className="w-5 h-5 text-emerald-500" />,
    summary: "Emisión de Boletas B001, Facturas F001 con cálculo automático de IGV y validación RUC/DNI.",
    steps: [
      {
        title: "1. Emisión Automática desde Caja",
        desc: "Al cobrar una mesa, selecciona si el cliente solicita Boleta, Factura o Nota de Venta e ingresa el DNI o RUC.",
      },
      {
        title: "2. Consulta y CDR SUNAT",
        desc: "En el módulo SUNAT puedes revisar todos los comprobantes emitidos, su código Hash, y el estado de aceptación.",
        tip: "Puedes volver a imprimir cualquier comprobante en ticket térmico de 80mm en cualquier momento."
      }
    ]
  },
  {
    id: "reservations",
    title: "Reservas & Pre-pedidos",
    category: "Salón",
    icon: <Calendar className="w-5 h-5 text-purple-500" />,
    summary: "Organización de mesas reservadas, tiempo de llegada y adelanto de platos.",
    steps: [
      {
        title: "1. Registrar Reserva",
        desc: "Ingresa el nombre del cliente, fecha, hora, cantidad de personas y adelanto en dinero si aplica.",
        tip: "Puedes agregar platos pre-ordenados para que la cocina los tenga previstos antes de la llegada del cliente."
      },
      {
        title: "2. Confirmación por WhatsApp",
        desc: "Usa el botón de WhatsApp para enviarle al comensal la confirmación formal con los detalles de su reserva."
      }
    ]
  },
  {
    id: "reports",
    title: "Reportes Diarios & Ranking",
    category: "Finanzas",
    icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
    summary: "Descarga de balances diarios en Excel/PDF, cierre de caja e incentivos para el personal.",
    steps: [
      {
        title: "1. Cierre Diario de Caja",
        desc: "Pulsa 'Ticket Cierre' para imprimir en tu ticketera el reporte consolidado de ventas del día.",
      },
      {
        title: "2. Descarga en Excel o PDF",
        desc: "Exporta el detalle completo de comandas y métodos de pago para contabilidad.",
      },
      {
        title: "3. Ranking de Mozos",
        desc: "Revisa qué colaboradores atendieron más mesas y generaron mayores ventas y propinas estimadas."
      }
    ]
  }
];

interface Props {
  initialModuleId?: string;
  onClose: () => void;
}

export function ModuleTutorialModal({ initialModuleId = "pos", onClose }: Props) {
  const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId);
  const currentModule = MODULE_TUTORIALS.find(m => m.id === selectedModuleId) || MODULE_TUTORIALS[0];

  return (
    <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* ── MENÚ LATERAL IZQUIERDA ── */}
        <div className="md:w-72 bg-stone-50 border-r border-stone-200 p-5 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900 leading-tight">Guías & Tutoriales</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Manual de Operación</p>
              </div>
            </div>

            <div className="space-y-1.5">
              {MODULE_TUTORIALS.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-2xl transition flex items-center justify-between gap-2 text-xs font-bold",
                    selectedModuleId === mod.id
                      ? "bg-stone-900 text-white shadow-sm"
                      : "text-stone-700 hover:bg-stone-200/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn(
                      "p-1.5 rounded-lg",
                      selectedModuleId === mod.id ? "bg-stone-800 text-amber-400" : "bg-white text-stone-700 shadow-xs"
                    )}>
                      {mod.icon}
                    </span>
                    <span className="truncate">{mod.title}</span>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 shrink-0 opacity-60", selectedModuleId === mod.id && "opacity-100")} />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 mt-4 text-center">
            <span className="text-[11px] font-bold text-stone-400">Sistema Mi Cafetín v3.0</span>
          </div>
        </div>

        {/* ── CONTENIDO DEL TUTORIAL DERECHA ── */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-white">
          <div>
            <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md mb-2 inline-block">
                  {currentModule.category}
                </span>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">{currentModule.title}</h2>
                <p className="text-xs font-semibold text-stone-500 mt-1">{currentModule.summary}</p>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pasos */}
            <div className="space-y-4">
              {currentModule.steps.map((step, idx) => (
                <div key={idx} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {idx + 1}
                    </span>
                    <h4 className="font-black text-sm text-stone-900">{step.title}</h4>
                  </div>
                  <p className="text-xs text-stone-600 font-medium pl-8 leading-relaxed">
                    {step.desc}
                  </p>
                  {step.tip && (
                    <div className="ml-8 p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 font-bold flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs rounded-xl shadow-md transition"
            >
              Entendido
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
