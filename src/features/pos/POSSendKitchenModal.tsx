import React, { useState } from 'react';
import { 
  X, ChefHat, Send, Printer, CheckCircle2, 
  Layers, ArrowRight, Sparkles, Monitor, Utensils
} from 'lucide-react';
import { RestaurantOrder, KitchenScreen } from '../../types';
import { useAppStore } from '../../hooks/StoreContext';

interface POSSendKitchenModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RestaurantOrder | null;
  onConfirmSend: (options: { targetStation: string; printTicket: boolean }) => void;
}

export const POSSendKitchenModal: React.FC<POSSendKitchenModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmSend,
}) => {
  const { kitchenScreens } = useAppStore();
  const [selectedScreenOption, setSelectedScreenOption] = useState<string>('auto');
  const [printTicket, setPrintTicket] = useState<boolean>(true);

  if (!isOpen || !order) return null;

  const unsentItems = order.items.filter(i => !i.sentToKitchen);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSend({
      targetStation: selectedScreenOption,
      printTicket,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[105] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">Enviar Comanda a Cocina</h3>
              <p className="text-xs font-semibold text-stone-500">
                Mesa / Pedido: <strong className="text-amber-600">{order.tableNumber}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-400 hover:bg-stone-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConfirm} className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          
          {/* Resumen de Platos a Despachar */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                Platos a Enviar ({unsentItems.length})
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full">
                Tanda #{((order.items.filter(i => i.sentToKitchen).length > 0) ? (Math.max(0, ...order.items.map(i => i.batchNumber || 1)) + 1) : 1)}
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {unsentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-white border border-amber-100 font-bold">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-amber-600">{item.quantity}x</span>
                    <span className="text-stone-900 truncate">{item.productName}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-stone-400 shrink-0 ml-2">
                    {item.station || 'Cocina'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selector de Pantalla de Destino */}
          <div>
            <label className="block text-xs font-black text-stone-700 uppercase tracking-wider mb-2">
              Seleccionar Pantalla KDS de Destino
            </label>
            
            <div className="space-y-2">
              {/* Opción Automática */}
              <button
                type="button"
                onClick={() => setSelectedScreenOption('auto')}
                className={`w-full p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                  selectedScreenOption === 'auto'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-xs font-black">⚡ Enrutamiento Inteligente Automático</div>
                    <div className="text-[10px] opacity-85">Cada plato va a su pantalla según su categoría (Horno, Cocina, Barra...)</div>
                  </div>
                </div>
                {selectedScreenOption === 'auto' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
              </button>

              {/* Opciones por Pantalla Específica */}
              <div className="pt-2">
                <span className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  O Forzar Envío a una Pantalla Específica:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {kitchenScreens.map((screen) => {
                    const isSelected = selectedScreenOption === screen.station;
                    return (
                      <button
                        key={screen.id}
                        type="button"
                        onClick={() => setSelectedScreenOption(screen.station)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-stone-900 text-amber-400 border-stone-900 font-black shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Monitor className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{screen.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Opción de Impresión de Ticket Térmico */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between cursor-pointer" onClick={() => setPrintTicket(!printTicket)}>
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-stone-600" />
              <div>
                <p className="text-xs font-black text-stone-900">Imprimir Comanda Física (Ticketeras Bienex TCP)</p>
                <p className="text-[10px] text-stone-500 font-medium">Ruteo automático por estación (Cocina, Horno, Barra) en puerto 9100</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${printTicket ? 'bg-amber-500 border-amber-500 text-stone-950' : 'border-stone-300 bg-white'}`}>
              {printTicket && <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Confirmar Envío a Cocina</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
