import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { RestaurantOrder } from '../types';
import { useAppStore } from '../hooks/StoreContext';
import { X, Printer, Scissors, Users, User, Utensils, Flame, CheckCircle2, ChefHat } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  order: RestaurantOrder;
  stationName?: string;
  batchNumber?: number;
  onClose: () => void;
}

export default function ComandaTicket({ order, stationName, batchNumber, onClose }: Props) {
  const { settings, products } = useAppStore();
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Comanda_${order.id}`,
    onAfterPrint: onClose,
  });

  const orderDate = new Date(order.createdAt);
  const orderNo = order.id.replace(/\D/g, '').slice(-6) || Math.floor(Math.random() * 900000 + 100000).toString();

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={onClose}
          className="h-12 px-6 rounded-xl font-bold bg-white text-stone-900 hover:bg-stone-100 flex items-center gap-2 transition"
        >
          <X className="w-5 h-5" /> Cancelar
        </button>
        <button
          onClick={handlePrint}
          className="h-12 px-6 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-2 shadow-lg shadow-amber-500/30 transition"
        >
          <Printer className="w-5 h-5" /> Imprimir Comanda
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-stone-100 rounded-2xl w-full max-w-4xl p-6 shadow-2xl custom-scrollbar flex justify-center">
        
        {/* === PRINTABLE AREA === */}
        <div ref={componentRef} className="bg-white p-8 w-full max-w-[800px] shadow-sm relative text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
          
          {/* WATERMARK */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Watermark" className="w-96 h-96 object-contain" />
            ) : (
              <Utensils className="w-96 h-96 text-slate-900" />
            )}
          </div>

          <div className="relative z-10">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
              <div className="w-64">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-auto object-contain max-h-32" />
                ) : (
                  <div className="text-3xl font-black text-slate-900 leading-tight">
                    {settings.companyName.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 w-64">
                <div className="bg-slate-900 text-white text-2xl font-black tracking-widest uppercase text-center w-full py-2" style={{ clipPath: 'polygon(5% 0, 95% 0, 100% 50%, 95% 100%, 5% 100%, 0% 50%)' }}>
                  COMANDA
                </div>
                
                <div className="w-full mt-2">
                  <div className="flex items-center gap-2 text-sm font-bold mb-1">
                    <span className="w-16">FECHA:</span>
                    <span className="flex-1 border-b border-slate-300 text-center font-mono">
                      {format(orderDate, 'dd / MM / yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="w-16">HORA:</span>
                    <span className="flex-1 border-b border-slate-300 text-center font-mono">
                      {format(orderDate, 'HH:mm')}
                    </span>
                  </div>
                </div>

                <div className="border-2 border-slate-300 rounded-lg w-full text-center py-2 mt-2 bg-white">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-widest">N° ORDEN</div>
                  <div className="text-2xl font-black text-red-600 font-mono tracking-wider">{orderNo}</div>
                </div>
              </div>
            </div>

            {/* INFO ROW */}
            <div className="flex items-end justify-between gap-6 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1">
                  <Utensils className="w-4 h-4" /> MESA
                </div>
                <div className="border border-slate-400 rounded-lg h-10 w-full flex items-center justify-center font-black text-lg bg-white">
                  {order.tableNumber}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1">
                  <Users className="w-4 h-4" /> PERSONAS
                </div>
                <div className="border border-slate-400 rounded-lg h-10 w-full bg-white"></div>
              </div>
              
              <div className="flex-[1.5]">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-1">
                  <User className="w-4 h-4" /> MESERO
                </div>
                <div className="border border-slate-400 rounded-lg h-10 w-full flex items-center px-4 font-bold text-sm bg-white">
                  {order.waiterName || '..............................'}
                </div>
              </div>
            </div>

            {/* MAIN TABLE */}
            <div className="border-2 border-slate-900 rounded-lg overflow-hidden mb-6 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-white font-bold text-xs uppercase text-center">
                  <tr>
                    <th className="py-2.5 px-2 w-16 border-r border-slate-700">CANT.</th>
                    <th className="py-2.5 px-4 w-[35%] border-r border-slate-700">PLATO / BEBIDA</th>
                    <th className="py-2.5 px-4 w-[30%] border-r border-slate-700">OBSERVACIONES</th>
                    <th className="py-2.5 px-3 w-[12%] border-r border-slate-700">PRECIO</th>
                    <th className="py-2.5 px-3 w-[13%]">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800 font-semibold font-mono text-xs">
                  {order.items.map((item, idx) => (
                    <tr key={item.id + idx} className="border-b border-dashed border-slate-300 last:border-0 h-10">
                      <td className="py-1 px-2 text-center border-r border-dashed border-slate-300 align-middle">{item.quantity}</td>
                      <td className="py-1 px-4 border-r border-dashed border-slate-300 align-middle uppercase">{products.find(p => p.id === item.productId)?.name || 'Producto Desconocido'}</td>
                      <td className="py-1 px-4 border-r border-dashed border-slate-300 align-middle text-[10px] uppercase text-slate-500 italic">
                        {item.notes || ''}
                      </td>
                      <td className="py-1 px-3 text-right border-r border-dashed border-slate-300 align-middle">
                        {item.price.toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right align-middle">
                        {(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Empty rows to fill space */}
                  {Array.from({ length: Math.max(0, 8 - order.items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-dashed border-slate-300 last:border-0 h-10">
                      <td className="border-r border-dashed border-slate-300"></td>
                      <td className="border-r border-dashed border-slate-300"></td>
                      <td className="border-r border-dashed border-slate-300"></td>
                      <td className="border-r border-dashed border-slate-300"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BOTTOM SUMMARY */}
            <div className="flex gap-6 mb-8">
              
              {/* ESTADO DE LA ORDEN */}
              <div className="w-56">
                <div className="border border-slate-900 rounded-lg overflow-hidden bg-white">
                  <div className="bg-slate-100 border-b border-slate-900 py-1.5 px-3 text-[10px] font-bold text-center uppercase tracking-widest text-slate-800">
                    ESTADO DE LA ORDEN
                  </div>
                  <div className="p-2 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">PENDIENTE</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Flame className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">EN PREPARACIÓN</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">ENTREGADO</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES GENERALES */}
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">
                  OBSERVACIONES GENERALES
                </div>
                <div className="space-y-6">
                  <div className="border-b-2 border-dotted border-slate-400 w-full"></div>
                  <div className="border-b-2 border-dotted border-slate-400 w-full"></div>
                  <div className="border-b-2 border-dotted border-slate-400 w-full"></div>
                </div>
              </div>

              {/* TOTALS */}
              <div className="w-56">
                <div className="border border-slate-900 rounded-lg overflow-hidden bg-white">
                  <div className="flex border-b border-slate-900">
                    <div className="w-24 bg-slate-900 text-white text-[10px] font-bold flex items-center px-3 py-2 uppercase tracking-widest border-r border-slate-900">
                      SUBTOTAL
                    </div>
                    <div className="flex-1 font-mono font-bold text-slate-800 flex items-center px-3 text-sm">
                      {settings.currency} {order.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex border-b border-slate-900">
                    <div className="w-24 bg-slate-900 text-white text-[10px] font-bold flex items-center px-3 py-2 uppercase tracking-widest border-r border-slate-900">
                      DESCUENTO
                    </div>
                    <div className="flex-1 font-mono font-bold text-slate-800 flex items-center px-3 text-sm">
                      {settings.currency} 0.00
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-24 bg-orange-500 text-white text-xs font-black flex items-center px-3 py-3 uppercase tracking-widest border-r border-slate-900">
                      TOTAL
                    </div>
                    <div className="flex-1 font-mono font-black text-slate-900 flex items-center px-3 text-lg">
                      {settings.currency} {order.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FIRMAS */}
            <div className="flex items-end justify-between px-8 mb-8">
              <div className="w-48 text-center">
                <div className="border-t border-slate-400 pt-2 text-[10px] font-bold text-slate-600 uppercase">
                  FIRMA MESERO
                </div>
              </div>
              <div className="text-center font-bold text-slate-700 italic text-lg" style={{ fontFamily: 'serif' }}>
                ¡Gracias por su preferencia!
              </div>
              <div className="w-48 text-center">
                <div className="border-t border-slate-400 pt-2 text-[10px] font-bold text-slate-600 uppercase">
                  FIRMA COCINA
                </div>
              </div>
            </div>

            {/* CUT LINE */}
            <div className="flex items-center gap-4 my-6 opacity-60">
              <Scissors className="w-5 h-5 text-slate-800 shrink-0 -rotate-90" />
              <div className="flex-1 border-b-2 border-dashed border-slate-800"></div>
            </div>

            {/* DETACHABLE KITCHEN SECTION */}
            <div className="flex gap-6">
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-32">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-full h-auto object-contain max-h-16" />
                    ) : (
                      <div className="text-lg font-black text-slate-900 leading-tight">
                        {settings.companyName}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 text-white text-sm font-black tracking-widest uppercase text-center px-8 py-1.5" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                    COMANDA
                  </div>

                  <div className="border border-slate-300 rounded text-center px-4 py-1 bg-white">
                    <div className="text-[10px] font-bold text-slate-700 uppercase">N° ORDEN</div>
                    <div className="text-sm font-black text-red-600 font-mono">{orderNo}</div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4 text-xs font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-16">MESA:</span>
                    <span className="w-20 border border-slate-400 rounded h-6 flex items-center justify-center bg-white">{order.tableNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16">FECHA:</span>
                    <span className="w-40 border-b border-slate-400 font-mono text-center pb-0.5">{format(orderDate, 'dd / MM / yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16">MESERO:</span>
                    <span className="w-48 border-b border-slate-400 pb-0.5">{order.waiterName || ''}</span>
                  </div>
                </div>

                <div className="border-2 border-slate-900 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase text-center">
                      <tr>
                        <th className="py-1.5 px-2 w-12 border-r border-slate-700">CANT.</th>
                        <th className="py-1.5 px-3 w-[45%] border-r border-slate-700">PLATO / BEBIDA</th>
                        <th className="py-1.5 px-3">OBSERVACIONES</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-800 font-semibold font-mono text-[10px]">
                      {order.items.map((item, idx) => (
                        <tr key={item.id + idx} className="border-b border-dashed border-slate-300 last:border-0 h-6">
                          <td className="py-1 px-2 text-center border-r border-dashed border-slate-300">{item.quantity}</td>
                          <td className="py-1 px-3 border-r border-dashed border-slate-300 uppercase">{products.find(p => p.id === item.productId)?.name || 'Producto Desconocido'}</td>
                          <td className="py-1 px-3 uppercase text-slate-500 italic">{item.notes || ''}</td>
                        </tr>
                      ))}
                      {/* Empty rows */}
                      {Array.from({ length: Math.max(0, 5 - order.items.length) }).map((_, i) => (
                        <tr key={`empty2-${i}`} className="border-b border-dashed border-slate-300 last:border-0 h-6">
                          <td className="border-r border-dashed border-slate-300"></td>
                          <td className="border-r border-dashed border-slate-300"></td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* COCINA SIDEBOX */}
              <div className="w-48 border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-white shrink-0 self-end">
                <div className="flex items-center gap-2 text-orange-500 font-black uppercase text-sm mb-6 justify-center">
                  <ChefHat className="w-5 h-5" /> PARA COCINA
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-400 group-hover:border-orange-500 transition-colors"></div>
                    <span className="text-xs font-bold text-slate-600">PENDIENTE</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-400 group-hover:border-blue-500 transition-colors"></div>
                    <span className="text-xs font-bold text-slate-600">EN PREPARACIÓN</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-400 group-hover:border-emerald-500 transition-colors"></div>
                    <span className="text-xs font-bold text-slate-600">LISTO</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
