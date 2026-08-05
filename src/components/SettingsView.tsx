import React, { useState } from 'react';
import { useAppStore } from '../hooks/StoreContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Settings as SettingsType } from '../types';
import { cn } from '../lib/utils';
import { Settings, Image as ImageIcon, QrCode, MonitorSmartphone, Printer, AlertTriangle, CheckCircle2, ChevronRight, Store, CreditCard } from 'lucide-react';

export default function SettingsView() {
  const { settings, updateSettings, printers, updatePrinters } = useAppStore();
  
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [printerList, setPrinterList] = useState(printers);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'restaurant' | 'alerts'>('general');

  const availableCategories = [
    "Combos & Promos",
    "Pollos a la Brasa",
    "Parrillas & Mostros",
    "Entradas & Chaufa",
    "Guarniciones & Salsas",
    "Bebidas & Refrescos",
    "Postres",
    "Otros",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    updatePrinters(printerList);
    alert('Ajustes y ruteo de impresoras guardados correctamente.');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, logoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleYapeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, paymentDetails: { ...formData.paymentDetails, yapeImage: reader.result as string } });
      reader.readAsDataURL(file);
    }
  };

  const handlePlinImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, paymentDetails: { ...formData.paymentDetails, plinImage: reader.result as string } });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-amber-500" />
            Configuración
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Personaliza el comportamiento, medios de pago y apariencia del sistema.
          </p>
        </div>
        <button onClick={handleSubmit} className="h-11 px-6 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-amber-500/30">
          <CheckCircle2 className="w-5 h-5" /> Guardar Cambios
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ── SIDEBAR TABS ── */}
        <div className="lg:w-64 shrink-0">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
            <button onClick={() => setActiveTab('general')} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap", activeTab === 'general' ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800")}>
              <Store className="w-5 h-5" /> General
            </button>
            <button onClick={() => setActiveTab('payments')} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap", activeTab === 'payments' ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800")}>
              <CreditCard className="w-5 h-5" /> Medios de Pago
            </button>
            <button onClick={() => setActiveTab('restaurant')} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap", activeTab === 'restaurant' ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800")}>
              <Printer className="w-5 h-5" /> Restaurante
            </button>
            <button onClick={() => setActiveTab('alerts')} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap", activeTab === 'alerts' ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800")}>
              <AlertTriangle className="w-5 h-5" /> Alertas
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="flex-1 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm overflow-hidden p-6 lg:p-8 min-h-[500px]">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <h2 className="text-xl font-black text-stone-900 dark:text-white">Información del Negocio</h2>
                <p className="text-sm text-stone-500 mt-1">Datos principales de la empresa y configuración visual.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nombre del Negocio</label>
                  <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-amber-500 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Moneda Principal</label>
                  <input type="text" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} required className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-amber-500 dark:border-stone-700 rounded-xl px-4 py-3 font-mono font-black text-lg outline-none transition-all dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Logo (Opcional)</label>
                <div className="flex items-center gap-6 p-4 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30">
                  {formData.logoUrl ? (
                    <div className="relative group shrink-0">
                      <img src={formData.logoUrl} alt="Logo" className="w-20 h-20 rounded-2xl object-cover bg-white shadow-sm border border-stone-100 dark:border-stone-600" />
                      <button onClick={() => setFormData({...formData, logoUrl: undefined})} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity" title="Quitar logo">×</button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-300 dark:text-stone-600 shrink-0">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 dark:file:bg-amber-900/40 dark:file:text-amber-400 cursor-pointer" />
                    <p className="text-xs text-stone-400 mt-2">Recomendado: 512x512px, PNG o JPG.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Tema de la Aplicación</label>
                <div className="flex gap-4">
                  <label className={cn("flex-1 cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center gap-3 transition-all", formData.theme === 'light' ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400" : "border-stone-200 dark:border-stone-700 hover:border-amber-300 text-stone-500")}>
                    <input type="radio" name="theme" value="light" checked={formData.theme === 'light'} onChange={() => setFormData({...formData, theme: 'light'})} className="sr-only" />
                    <MonitorSmartphone className="w-8 h-8" />
                    <span className="font-bold text-sm">Tema Claro</span>
                  </label>
                  <label className={cn("flex-1 cursor-pointer rounded-2xl border-2 p-4 flex flex-col items-center gap-3 transition-all", formData.theme === 'dark' ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400" : "border-stone-200 dark:border-stone-700 hover:border-amber-300 text-stone-500")}>
                    <input type="radio" name="theme" value="dark" checked={formData.theme === 'dark'} onChange={() => setFormData({...formData, theme: 'dark'})} className="sr-only" />
                    <MonitorSmartphone className="w-8 h-8" />
                    <span className="font-bold text-sm">Tema Oscuro</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <h2 className="text-xl font-black text-stone-900 dark:text-white">Billeteras Digitales</h2>
                <p className="text-sm text-stone-500 mt-1">Configura QRs y números que se mostrarán en los comprobantes y pantallas a clientes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* YAPE */}
                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-2xl p-6 border border-purple-100 dark:border-purple-900/30">
                  <h3 className="font-black text-purple-700 dark:text-purple-400 mb-4 flex items-center gap-2"><QrCode className="w-5 h-5" /> Yape</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider mb-2">Número de Celular</label>
                      <input type="text" placeholder="Ej. 987654321" value={formData.paymentDetails?.yape || ''} onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, yape: e.target.value }})} className="w-full bg-white dark:bg-stone-900 border-2 border-transparent focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition-all dark:text-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider mb-2">Código QR</label>
                      <input type="file" accept="image/*" onChange={handleYapeImageChange} className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-purple-200 file:text-purple-800 hover:file:bg-purple-300 cursor-pointer" />
                      {formData.paymentDetails?.yapeImage && (
                        <div className="mt-3 relative inline-block group">
                          <img src={formData.paymentDetails.yapeImage} alt="QR Yape" className="h-24 w-24 object-contain rounded-xl bg-white shadow-sm border border-purple-200" />
                          <button type="button" onClick={() => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, yapeImage: undefined }})} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PLIN */}
                <div className="bg-sky-50 dark:bg-sky-900/10 rounded-2xl p-6 border border-sky-100 dark:border-sky-900/30">
                  <h3 className="font-black text-sky-700 dark:text-sky-400 mb-4 flex items-center gap-2"><QrCode className="w-5 h-5" /> Plin</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wider mb-2">Número de Celular</label>
                      <input type="text" placeholder="Ej. 987654321" value={formData.paymentDetails?.plin || ''} onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, plin: e.target.value }})} className="w-full bg-white dark:bg-stone-900 border-2 border-transparent focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm font-bold outline-none transition-all dark:text-white shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wider mb-2">Código QR</label>
                      <input type="file" accept="image/*" onChange={handlePlinImageChange} className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-sky-200 file:text-sky-800 hover:file:bg-sky-300 cursor-pointer" />
                      {formData.paymentDetails?.plinImage && (
                        <div className="mt-3 relative inline-block group">
                          <img src={formData.paymentDetails.plinImage} alt="QR Plin" className="h-24 w-24 object-contain rounded-xl bg-white shadow-sm border border-sky-200" />
                          <button type="button" onClick={() => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, plinImage: undefined }})} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Cuenta Bancaria (Transferencias)</label>
                <input type="text" placeholder="Ej. BCP: 191-..." value={formData.paymentDetails?.transferencia || ''} onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, transferencia: e.target.value }})} className="w-full bg-stone-50 dark:bg-stone-800 border-2 border-transparent focus:border-amber-500 dark:border-stone-700 rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all dark:text-white" />
              </div>
            </div>
          )}

          {/* TAB: RESTAURANT & PRINTERS */}
          {activeTab === 'restaurant' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <h2 className="text-xl font-black text-stone-900 dark:text-white">Flujo de Cocina</h2>
                <p className="text-sm text-stone-500 mt-1">Reglas de impresión y ruteo de platos hacia diferentes estaciones.</p>
              </div>

              <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-6 border border-stone-200/60 dark:border-stone-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-white">Modo Comandas en Borrador</h3>
                    <p className="text-sm text-stone-500 mt-1">Actívalo si deseas registrar pedidos y enviarlos a cocina manualmente. Desactívalo para enviar automáticamente al cobrar.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input type="checkbox" checked={!formData.autoSendToKitchen} onChange={(e) => setFormData({ ...formData, autoSendToKitchen: !e.target.checked })} className="sr-only peer" />
                    <div className="w-14 h-8 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-stone-600 peer-checked:bg-amber-500 shadow-inner"></div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-stone-900 dark:text-white mb-4">Ruteo de Categorías por Estación</h3>
                <div className="grid gap-4">
                  {printerList.map(p => {
                    const isEditing = editingPrinterId === p.id;
                    return (
                      <div key={p.id} className={cn("p-5 rounded-2xl border transition-all", isEditing ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-200")}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500"><Printer className="w-5 h-5" /></div>
                            <div>
                              <h4 className="font-black text-stone-900 dark:text-white">{p.name}</h4>
                              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 mt-1 inline-block">{p.station}</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => setEditingPrinterId(isEditing ? null : p.id)} className="text-xs font-bold text-amber-600 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 px-3 py-1.5 rounded-lg transition-colors">
                            {isEditing ? "Cerrar" : "Configurar"}
                          </button>
                        </div>

                        {!isEditing && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {p.categories.map(cat => (
                              <span key={cat} className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                                {cat}
                              </span>
                            ))}
                            {p.categories.length === 0 && <span className="text-xs text-stone-400 italic">No imprime ninguna categoría.</span>}
                          </div>
                        )}

                        {isEditing && (
                          <div className="mt-6 pt-5 border-t border-amber-100 dark:border-amber-900/30 animate-in fade-in">
                            <p className="text-xs font-bold text-amber-800/60 dark:text-amber-400/60 uppercase tracking-widest mb-3">Categorías Asignadas</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                              {availableCategories.map(cat => {
                                const isChecked = p.categories.includes(cat);
                                return (
                                  <label key={cat} className={cn("p-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all flex items-center gap-2", isChecked ? "bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-200" : "bg-white dark:bg-stone-900 border-transparent text-stone-500")}>
                                    <input type="checkbox" checked={isChecked} onChange={(e) => {
                                      const checked = e.target.checked;
                                      setPrinterList(prev => prev.map(item => {
                                        if (item.id !== p.id) return item;
                                        const nextCats = checked ? [...item.categories, cat] : item.categories.filter(c => c !== cat);
                                        return { ...item, categories: nextCats };
                                      }));
                                    }} className="rounded w-4 h-4 text-amber-500 focus:ring-amber-500 border-stone-300" />
                                    <span className="truncate">{cat}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALERTS */}
          {activeTab === 'alerts' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
                <h2 className="text-xl font-black text-stone-900 dark:text-white">Alertas y Notificaciones</h2>
                <p className="text-sm text-stone-500 mt-1">Reglas automáticas para avisos en el dashboard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-6 border border-stone-200/60 dark:border-stone-700">
                  <h3 className="font-bold text-stone-900 dark:text-white mb-2">Umbral de Inventario Bajo</h3>
                  <p className="text-xs text-stone-500 mb-4">Avisar cuando un producto caiga debajo de esta cantidad en stock.</p>
                  <div className="relative">
                    <input type="number" min="0" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} required className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 focus:border-amber-500 dark:border-stone-700 rounded-xl pl-4 pr-12 py-3 font-mono font-black text-lg outline-none transition-all dark:text-white" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 uppercase">Unidades</span>
                  </div>
                </div>

                <div className="bg-stone-50 dark:bg-stone-800/40 rounded-2xl p-6 border border-stone-200/60 dark:border-stone-700">
                  <h3 className="font-bold text-stone-900 dark:text-white mb-2">Antigüedad de Deudas</h3>
                  <p className="text-xs text-stone-500 mb-4">Avisar si un cliente tiene deuda (fiado) más antigua que estos días.</p>
                  <div className="relative">
                    <input type="number" min="0" value={formData.overdueDaysThreshold} onChange={e => setFormData({...formData, overdueDaysThreshold: Number(e.target.value)})} required className="w-full bg-white dark:bg-stone-900 border-2 border-stone-200 focus:border-amber-500 dark:border-stone-700 rounded-xl pl-4 pr-12 py-3 font-mono font-black text-lg outline-none transition-all dark:text-white" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 uppercase">Días</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
