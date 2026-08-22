import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { Settings as SettingsType, StationPrinter, OrderStation } from "../../types";
import { cn } from "../../lib/utils";
import { 
  Settings, Image as ImageIcon, QrCode, Printer, AlertTriangle, 
  CheckCircle2, Store, CreditCard, Building2, Smartphone, 
  Plus, Trash2, Edit3, Wifi, Usb, Bluetooth, Bell, Volume2, 
  Clock, DollarSign, Receipt, Sparkles, Check, X, Sliders,
  HelpCircle, ShieldCheck
} from 'lucide-react';

const AVAILABLE_CATEGORIES = [
  "Combos & Promos",
  "Pollos a la Brasa",
  "Parrillas & Mostros",
  "Entradas & Chaufa",
  "Guarniciones & Salsas",
  "Bebidas & Refrescos",
  "Postres",
  "Otros",
];

const ORDER_STATIONS: OrderStation[] = [
  "Horno & Pollos",
  "Cocina & Parrilla",
  "Barra & Bebidas",
  "Estación Postres",
  "Caja & Facturación"
];

export default function SettingsView() {
  const { settings, updateSettings, printers, updatePrinters } = useAppStore();
  
  const [formData, setFormData] = useState<SettingsType>(() => ({
    ...settings,
    slogan: settings.slogan || (settings.companyName.includes('Paradero') ? 'Barra Cevichera' : 'Restaurante & Grill'),
    companyRuc: settings.companyRuc || '20601234567',
    address: settings.address || 'Av. Los Frutales 104, Lima',
    phone: settings.phone || '987-654-321',
    kitchenDelayThresholdMins: settings.kitchenDelayThresholdMins || 20,
    deliveryDelayThresholdMins: settings.deliveryDelayThresholdMins || 35,
    soundAlertsEnabled: settings.soundAlertsEnabled ?? true,
    enablePreCountPrint: settings.enablePreCountPrint ?? true,
    showPaymentQR: settings.showPaymentQR ?? true,
    printBankDetailsOnTicket: settings.printBankDetailsOnTicket ?? true,
    defaultDeliveryCost: settings.defaultDeliveryCost ?? 5.00,
    paymentDetails: {
      yape: settings.paymentDetails?.yape || '987-654-321',
      yapeHolder: settings.paymentDetails?.yapeHolder || settings.companyName,
      yapeActive: settings.paymentDetails?.yapeActive ?? true,
      yapeImage: settings.paymentDetails?.yapeImage || '',
      plin: settings.paymentDetails?.plin || '987-654-321',
      plinHolder: settings.paymentDetails?.plinHolder || settings.companyName,
      plinActive: settings.paymentDetails?.plinActive ?? true,
      plinImage: settings.paymentDetails?.plinImage || '',
      bankName: settings.paymentDetails?.bankName || 'BCP',
      bankAccount: settings.paymentDetails?.bankAccount || '191-98765432-0-01',
      bankCci: settings.paymentDetails?.bankCci || '0021910098765432001',
      bankHolder: settings.paymentDetails?.bankHolder || settings.companyName,
      bankActive: settings.paymentDetails?.bankActive ?? true,
      transferencia: settings.paymentDetails?.transferencia || 'BCP: 191-98765432-0-01 (CCI: 0021910098765432001)',
      posProvider: settings.paymentDetails?.posProvider || 'IziPay / Niubiz',
      posTerminalCode: settings.paymentDetails?.posTerminalCode || 'POS-TERM-01',
      posCommissionRate: settings.paymentDetails?.posCommissionRate ?? 3.5,
      posActive: settings.paymentDetails?.posActive ?? true,
      cashActive: settings.paymentDetails?.cashActive ?? true,
    }
  }));

  const [printerList, setPrinterList] = useState<StationPrinter[]>(printers);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  const [showAddPrinterModal, setShowAddPrinterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'restaurant' | 'alerts'>('general');
  const [testPrintSuccess, setTestPrintSuccess] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Nueva impresora temporal para el modal
  const [newPrinter, setNewPrinter] = useState<Omit<StationPrinter, 'id'>>({
    name: '',
    station: 'Cocina & Parrilla',
    categories: ['Parrillas & Mostros'],
    connectionType: 'network',
    ipAddress: '192.168.1.200:9100',
    status: 'online',
    autoPrint: true,
    paperWidth: '80mm',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    updatePrinters(printerList);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

  const handleAddPrinter = () => {
    if (!newPrinter.name.trim()) return;
    const printer: StationPrinter = {
      ...newPrinter,
      id: `print-${Date.now()}`
    };
    setPrinterList([...printerList, printer]);
    setShowAddPrinterModal(false);
    setNewPrinter({
      name: '',
      station: 'Cocina & Parrilla',
      categories: ['Parrillas & Mostros'],
      connectionType: 'network',
      ipAddress: '192.168.1.200:9100',
      status: 'online',
      autoPrint: true,
      paperWidth: '80mm',
    });
  };

  const handleDeletePrinter = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta estación de impresión?')) {
      setPrinterList(printerList.filter(p => p.id !== id));
    }
  };

  const handleTestPrint = (p: StationPrinter) => {
    setTestPrintSuccess(p.id);
    setTimeout(() => setTestPrintSuccess(null), 2500);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-amber-500" />
            Centro de Configuración Global
          </h1>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Personaliza métodos de pago, ruteo de impresoras, alertas operativas y apariencia.
          </p>
        </div>
        <button 
          onClick={handleSubmit} 
          className={cn(
            "h-11 px-6 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-md",
            savedSuccess 
              ? "bg-emerald-600 text-white shadow-emerald-500/30" 
              : "bg-stone-900 hover:bg-black text-white active:scale-95 shadow-stone-900/20"
          )}
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-200" /> : <CheckCircle2 className="w-4 h-4 text-amber-400" />}
          <span>{savedSuccess ? '¡Cambios Guardados!' : 'Guardar Todo'}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ── SIDEBAR TABS ── */}
        <div className="lg:w-64 shrink-0">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
            
            <button 
              onClick={() => setActiveTab('general')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap", 
                activeTab === 'general' 
                  ? "bg-stone-900 text-white shadow-md shadow-stone-900/20" 
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80 shadow-2xs"
              )}
            >
              <Store className={cn("w-4 h-4", activeTab === 'general' ? "text-amber-400" : "text-stone-400")} /> 
              <span>General & Marca</span>
            </button>

            <button 
              onClick={() => setActiveTab('payments')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap", 
                activeTab === 'payments' 
                  ? "bg-stone-900 text-white shadow-md shadow-stone-900/20" 
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80 shadow-2xs"
              )}
            >
              <CreditCard className={cn("w-4 h-4", activeTab === 'payments' ? "text-amber-400" : "text-stone-400")} /> 
              <span>Medios de Pago</span>
            </button>

            <button 
              onClick={() => setActiveTab('restaurant')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap", 
                activeTab === 'restaurant' 
                  ? "bg-stone-900 text-white shadow-md shadow-stone-900/20" 
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80 shadow-2xs"
              )}
            >
              <Printer className={cn("w-4 h-4", activeTab === 'restaurant' ? "text-amber-400" : "text-stone-400")} /> 
              <span>Cocina & Impresoras</span>
            </button>

            <button 
              onClick={() => setActiveTab('alerts')} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all whitespace-nowrap", 
                activeTab === 'alerts' 
                  ? "bg-stone-900 text-white shadow-md shadow-stone-900/20" 
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80 shadow-2xs"
              )}
            >
              <AlertTriangle className={cn("w-4 h-4", activeTab === 'alerts' ? "text-amber-400" : "text-stone-400")} /> 
              <span>Alertas & Umbrales</span>
            </button>

          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="flex-1 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 shadow-sm overflow-hidden p-6 lg:p-8 min-h-[520px]">
          
          {/* ══════════════ TAB 1: GENERAL & MARCA ══════════════ */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-black text-stone-900">Información del Negocio & Marca</h2>
                  <p className="text-xs text-stone-500 mt-0.5">Configura los datos fiscales, moneda y presentación corporativa del restaurante.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Nombre Comercial</label>
                  <input 
                    type="text" 
                    value={formData.companyName} 
                    onChange={e => setFormData({...formData, companyName: e.target.value})} 
                    required 
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Slogan / Rubro</label>
                  <input 
                    type="text" 
                    value={formData.slogan || ''} 
                    onChange={e => setFormData({...formData, slogan: e.target.value})} 
                    placeholder="Ej. Restaurante & Grill" 
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Moneda Principal</label>
                  <input 
                    type="text" 
                    value={formData.currency} 
                    onChange={e => setFormData({...formData, currency: e.target.value})} 
                    required 
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-4 py-2.5 font-mono font-black text-sm outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">RUC / Identificación Fiscal</label>
                  <input 
                    type="text" 
                    value={formData.companyRuc || ''} 
                    onChange={e => setFormData({...formData, companyRuc: e.target.value})} 
                    placeholder="Ej. 20601234567" 
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs md:text-sm font-mono font-bold outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Dirección del Local</label>
                  <input 
                    type="text" 
                    value={formData.address || ''} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Ej. Av. Los Frutales 104" 
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Teléfono de Contacto</label>
                  <input 
                    type="text" 
                    value={formData.phone || ''} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Ej. 987654321" 
                    className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold outline-none transition-all" 
                  />
                </div>
              </div>

              {/* Logotipo */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Logotipo del Restaurante</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl border border-stone-200 bg-stone-50/50">
                  {formData.logoUrl ? (
                    <div className="relative group shrink-0">
                      <img src={formData.logoUrl} alt="Logo" className="w-20 h-20 rounded-2xl object-contain bg-white shadow-xs border border-stone-200 p-1" />
                      <button onClick={() => setFormData({...formData, logoUrl: undefined})} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow" title="Quitar logo">×</button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300 shrink-0">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-stone-900 file:text-white hover:file:bg-stone-800 cursor-pointer" />
                    
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-stone-400">Logos preestablecidos:</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '/Logo/logo-lomas-grill.png', companyName: 'Las Lomas Grill', slogan: 'Restaurante & Grill' })}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 transition"
                      >
                        Las Lomas Grill
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '/Logo/logo-paradero-104.png', companyName: 'Paradero 104', slogan: 'Barra Cevichera' })}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-bold border border-blue-200 transition"
                      >
                        Paradero 104
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '/LOGO OFICIAL.png' })}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold border border-stone-300 transition"
                      >
                        Logo Oficial
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2: MEDIOS DE PAGO ══════════════ */}
          {activeTab === 'payments' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 pb-4">
                <h2 className="text-lg md:text-xl font-black text-stone-900">Medios de Pago & Pasarelas</h2>
                <p className="text-xs text-stone-500 mt-0.5">Configura números, titulares, terminales POS físicos y códigos QR que se mostrarán al cobrar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* ── YAPE ── */}
                <div className="bg-purple-50/70 rounded-2xl p-5 border border-purple-200 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-purple-950 text-sm">Billetera Yape</h3>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] font-bold text-purple-900">{formData.paymentDetails?.yapeActive !== false ? 'Activo' : 'Inactivo'}</span>
                      <input 
                        type="checkbox" 
                        checked={formData.paymentDetails?.yapeActive !== false} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, yapeActive: e.target.checked }})} 
                        className="w-4 h-4 rounded accent-purple-600" 
                      />
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">Número de Celular Yape</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 987-654-321" 
                        value={formData.paymentDetails?.yape || ''} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, yape: e.target.value }})} 
                        className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold outline-none shadow-xs" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">Titular de la Cuenta Yape</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Juan Pérez / Don Grill" 
                        value={formData.paymentDetails?.yapeHolder || ''} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, yapeHolder: e.target.value }})} 
                        className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 font-bold outline-none shadow-xs" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">Imagen Código QR</label>
                      <input type="file" accept="image/*" onChange={handleYapeImageChange} className="block w-full text-[11px] text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:font-bold file:bg-purple-200 file:text-purple-800 cursor-pointer" />
                      {formData.paymentDetails?.yapeImage && (
                        <div className="mt-2 relative inline-block">
                          <img src={formData.paymentDetails.yapeImage} alt="QR Yape" className="h-20 w-20 object-contain rounded-xl bg-white shadow-xs border border-purple-200 p-1" />
                          <button type="button" onClick={() => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, yapeImage: '' }})} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow">×</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── PLIN ── */}
                <div className="bg-sky-50/70 rounded-2xl p-5 border border-sky-200 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-xs">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-sky-950 text-sm">Billetera Plin</h3>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] font-bold text-sky-900">{formData.paymentDetails?.plinActive !== false ? 'Activo' : 'Inactivo'}</span>
                      <input 
                        type="checkbox" 
                        checked={formData.paymentDetails?.plinActive !== false} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, plinActive: e.target.checked }})} 
                        className="w-4 h-4 rounded accent-sky-600" 
                      />
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Número de Celular Plin</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 987-654-321" 
                        value={formData.paymentDetails?.plin || ''} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, plin: e.target.value }})} 
                        className="w-full bg-white border border-sky-200 focus:border-sky-500 rounded-xl px-3 py-2 font-bold outline-none shadow-xs" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Titular de la Cuenta Plin</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Juan Pérez / Don Grill" 
                        value={formData.paymentDetails?.plinHolder || ''} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, plinHolder: e.target.value }})} 
                        className="w-full bg-white border border-sky-200 focus:border-sky-500 rounded-xl px-3 py-2 font-bold outline-none shadow-xs" 
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-sky-900 mb-1">Imagen Código QR</label>
                      <input type="file" accept="image/*" onChange={handlePlinImageChange} className="block w-full text-[11px] text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:font-bold file:bg-sky-200 file:text-sky-800 cursor-pointer" />
                      {formData.paymentDetails?.plinImage && (
                        <div className="mt-2 relative inline-block">
                          <img src={formData.paymentDetails.plinImage} alt="QR Plin" className="h-20 w-20 object-contain rounded-xl bg-white shadow-xs border border-sky-200 p-1" />
                          <button type="button" onClick={() => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, plinImage: '' }})} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow">×</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* ── TRANSFERENCIAS Y TARJETAS ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Transferencia Bancaria */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      Transferencias Bancarias
                    </h3>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.paymentDetails?.bankActive !== false} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, bankActive: e.target.checked }})} 
                        className="w-3.5 h-3.5 rounded accent-amber-600" 
                      />
                      <span className="font-bold text-stone-700">Habilitado</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Banco Principal</label>
                    <input 
                      type="text" 
                      value={formData.paymentDetails?.bankName || 'BCP'} 
                      onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, bankName: e.target.value }})} 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Número de Cuenta</label>
                    <input 
                      type="text" 
                      value={formData.paymentDetails?.bankAccount || ''} 
                      onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, bankAccount: e.target.value }})} 
                      placeholder="191-98765432-0-01" 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Código Interbancario (CCI)</label>
                    <input 
                      type="text" 
                      value={formData.paymentDetails?.bankCci || ''} 
                      onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, bankCci: e.target.value }})} 
                      placeholder="0021910098765432001" 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold outline-none" 
                    />
                  </div>
                </div>

                {/* POS / Tarjetas */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Terminal POS Físico / Tarjetas
                    </h3>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.paymentDetails?.posActive !== false} 
                        onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, posActive: e.target.checked }})} 
                        className="w-3.5 h-3.5 rounded accent-blue-600" 
                      />
                      <span className="font-bold text-stone-700">Habilitado</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Operador / Proveedor POS</label>
                    <input 
                      type="text" 
                      value={formData.paymentDetails?.posProvider || 'IziPay / Niubiz'} 
                      onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, posProvider: e.target.value }})} 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Código de Terminal</label>
                    <input 
                      type="text" 
                      value={formData.paymentDetails?.posTerminalCode || 'POS-TERM-01'} 
                      onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, posTerminalCode: e.target.value }})} 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Comisión del Terminal (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formData.paymentDetails?.posCommissionRate ?? 3.5} 
                      onChange={e => setFormData({...formData, paymentDetails: { ...formData.paymentDetails, posCommissionRate: parseFloat(e.target.value) || 0 }})} 
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none" 
                    />
                  </div>
                </div>

              </div>

              {/* Opciones Adicionales de Pago */}
              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.showPaymentQR ?? true} 
                    onChange={e => setFormData({...formData, showPaymentQR: e.target.checked})} 
                    className="w-4 h-4 rounded accent-amber-600" 
                  />
                  <div>
                    <p className="font-bold text-xs text-stone-900">Mostrar QR en Cobro POS</p>
                    <p className="text-[11px] text-stone-500">Muestra el código QR grande en la pantalla al elegir Yape/Plin.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.printBankDetailsOnTicket ?? true} 
                    onChange={e => setFormData({...formData, printBankDetailsOnTicket: e.target.checked})} 
                    className="w-4 h-4 rounded accent-amber-600" 
                  />
                  <div>
                    <p className="font-bold text-xs text-stone-900">Imprimir Datos en Ticket</p>
                    <p className="text-[11px] text-stone-500">Imprime el número de cuenta y celular Yape al pie del ticket térmico.</p>
                  </div>
                </label>
              </div>

            </div>
          )}

          {/* ══════════════ TAB 3: RESTAURANTE & IMPRESORAS ══════════════ */}
          {activeTab === 'restaurant' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-black text-stone-900">Flujo de Comandas & Red de Impresoras</h2>
                  <p className="text-xs text-stone-500 mt-0.5">Controla la emisión de pre-cuentas, envío a cocina y ruteo a impresoras térmicas.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAddPrinterModal(true)} 
                  className="px-3.5 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Agregar Impresora</span>
                </button>
              </div>

              {/* Opciones de Flujo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-stone-900">Modo Comandas en Borrador</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">Permite abrir pedidos y acumular platos antes de enviarlos a cocina.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={!formData.autoSendToKitchen} 
                      onChange={(e) => setFormData({ ...formData, autoSendToKitchen: !e.target.checked })} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-stone-900">Pre-cuenta de Verificación</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">Habilita imprimir el resumen de consumo antes del cobro final.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={formData.enablePreCountPrint !== false} 
                      onChange={(e) => setFormData({ ...formData, enablePreCountPrint: e.target.checked })} 
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* Terminal y Delivery Base */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Identificador del Terminal POS</label>
                  <input 
                    type="text" 
                    value={formData.posTerminalId || ''} 
                    onChange={e => setFormData({...formData, posTerminalId: e.target.value})} 
                    placeholder="POS-CAJA-01" 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold text-xs outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Costo Delivery Base ({formData.currency})</label>
                  <input 
                    type="number" 
                    step="0.50" 
                    value={formData.defaultDeliveryCost ?? 5.00} 
                    onChange={e => setFormData({...formData, defaultDeliveryCost: parseFloat(e.target.value) || 0})} 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold text-xs outline-none" 
                  />
                </div>
              </div>

              {/* Lista de Impresoras */}
              <div>
                <h3 className="font-black text-sm text-stone-900 mb-3 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-500" />
                  <span>Estaciones de Impresión Configuradas ({printerList.length})</span>
                </h3>

                <div className="grid gap-3">
                  {printerList.map((p) => {
                    const isEditing = editingPrinterId === p.id;
                    const isTesting = testPrintSuccess === p.id;

                    return (
                      <div key={p.id} className={cn("p-4 rounded-2xl border transition-all", isEditing ? "bg-amber-50/50 border-amber-300" : "bg-white border-stone-200 hover:border-stone-300")}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 shrink-0">
                              <Printer className="w-5 h-5 text-stone-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-xs md:text-sm text-stone-900">{p.name}</h4>
                                <span className={cn("w-2 h-2 rounded-full", p.status === 'online' ? "bg-emerald-500" : "bg-stone-400")} />
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                                <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{p.station}</span>
                                <span>•</span>
                                <span className="font-mono text-stone-600">{p.ipAddress || 'USB Local'}</span>
                                <span>•</span>
                                <span className="font-medium">{p.paperWidth || '80mm'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleTestPrint(p)} 
                              className={cn(
                                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1",
                                isTesting ? "bg-emerald-600 text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                              )}
                            >
                              {isTesting ? <Check className="w-3 h-3 text-white" /> : <Printer className="w-3 h-3" />}
                              <span>{isTesting ? '¡Imprimiendo!' : 'Test'}</span>
                            </button>

                            <button 
                              type="button" 
                              onClick={() => setEditingPrinterId(isEditing ? null : p.id)} 
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 transition"
                              title="Configurar categorías"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button 
                              type="button" 
                              onClick={() => handleDeletePrinter(p.id)} 
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition"
                              title="Eliminar impresora"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Ruteo de categorías */}
                        {!isEditing && (
                          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-stone-100">
                            {p.categories.map(cat => (
                              <span key={cat} className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                                {cat}
                              </span>
                            ))}
                            {p.categories.length === 0 && <span className="text-xs text-stone-400 italic">No imprime ninguna categoría.</span>}
                          </div>
                        )}

                        {isEditing && (
                          <div className="mt-4 pt-3 border-t border-amber-200 space-y-3 animate-in fade-in">
                            <p className="text-[11px] font-black text-amber-900 uppercase tracking-wider">Categorías que debe imprimir:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {AVAILABLE_CATEGORIES.map(cat => {
                                const isChecked = p.categories.includes(cat);
                                return (
                                  <label key={cat} className={cn("p-2 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center gap-2", isChecked ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white border-stone-200 text-stone-600")}>
                                    <input 
                                      type="checkbox" 
                                      checked={isChecked} 
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setPrinterList(prev => prev.map(item => {
                                          if (item.id !== p.id) return item;
                                          const nextCats = checked ? [...item.categories, cat] : item.categories.filter(c => c !== cat);
                                          return { ...item, categories: nextCats };
                                        }));
                                      }} 
                                      className="rounded w-3.5 h-3.5 accent-amber-600" 
                                    />
                                    <span className="truncate text-[11px]">{cat}</span>
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

          {/* ══════════════ TAB 4: ALERTAS & NOTIFICACIONES ══════════════ */}
          {activeTab === 'alerts' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-stone-100 pb-4">
                <h2 className="text-lg md:text-xl font-black text-stone-900">Alertas Operativas & Umbrales</h2>
                <p className="text-xs text-stone-500 mt-0.5">Personaliza los avisos de stock bajo, cuentas morosas y demoras en cocina y repartos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Stock Bajo */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                  <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Umbral de Inventario / Stock Bajo
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Mostrar notificación de advertencia en el menú y panel cuando el stock de un plato o insumo baje de:
                  </p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1" 
                      value={formData.lowStockThreshold} 
                      onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value) || 1})} 
                      required 
                      className="w-28 bg-white border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 font-mono font-black text-base outline-none text-center" 
                    />
                    <span className="text-xs font-bold text-stone-600">Unidades disponibles</span>
                  </div>
                </div>

                {/* Antigüedad de Fiados */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                  <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-500" />
                    Antigüedad de Cuentas por Cobrar (Fiados)
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Notificar como cuenta vencida si el cliente tiene consumos a crédito pendientes por más de:
                  </p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="1" 
                      value={formData.overdueDaysThreshold} 
                      onChange={e => setFormData({...formData, overdueDaysThreshold: Number(e.target.value) || 1})} 
                      required 
                      className="w-28 bg-white border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 font-mono font-black text-base outline-none text-center" 
                    />
                    <span className="text-xs font-bold text-stone-600">Días transcurridos</span>
                  </div>
                </div>

                {/* Demora en Cocina */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                  <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Alerta de Demora en Cocina (KDS)
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Marcar la comanda con borde rojo y alarma en pantalla cuando una orden lleve en preparación más de:
                  </p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="5" 
                      value={formData.kitchenDelayThresholdMins ?? 20} 
                      onChange={e => setFormData({...formData, kitchenDelayThresholdMins: Number(e.target.value) || 20})} 
                      className="w-28 bg-white border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 font-mono font-black text-base outline-none text-center" 
                    />
                    <span className="text-xs font-bold text-stone-600">Minutos en espera</span>
                  </div>
                </div>

                {/* Demora en Reparto */}
                <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                  <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-500" />
                    Alerta de Tiempo en Ruta (Delivery)
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Avisar al administrador si un motorizado continúa en viaje tras haber despachado hace más de:
                  </p>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="10" 
                      value={formData.deliveryDelayThresholdMins ?? 35} 
                      onChange={e => setFormData({...formData, deliveryDelayThresholdMins: Number(e.target.value) || 35})} 
                      className="w-28 bg-white border border-stone-200 focus:border-amber-500 rounded-xl px-3 py-2 font-mono font-black text-base outline-none text-center" 
                    />
                    <span className="text-xs font-bold text-stone-600">Minutos en trayecto</span>
                  </div>
                </div>

              </div>

              {/* Switch de Alertas Sonoras */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-black text-xs text-stone-900">Alertas y Efectos Sonoros</p>
                    <p className="text-[11px] text-stone-500 font-medium">Reproducir aviso auditivo al llegar nuevo pedido o cuando una comanda se retrase.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input 
                    type="checkbox" 
                    checked={formData.soundAlertsEnabled !== false} 
                    onChange={e => setFormData({...formData, soundAlertsEnabled: e.target.checked})} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ── MODAL PARA AGREGAR IMPRESORA ── */}
      {showAddPrinterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-500" />
                Agregar Estación de Impresión
              </h3>
              <button onClick={() => setShowAddPrinterModal(false)} className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nombre Descriptivo</label>
                <input 
                  type="text" 
                  placeholder="Ej. Ticketera Barra / Parrilla Central" 
                  value={newPrinter.name} 
                  onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Estación de Trabajo</label>
                  <select 
                    value={newPrinter.station} 
                    onChange={e => setNewPrinter({...newPrinter, station: e.target.value as OrderStation})} 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none"
                  >
                    {ORDER_STATIONS.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ancho de Papel</label>
                  <select 
                    value={newPrinter.paperWidth || '80mm'} 
                    onChange={e => setNewPrinter({...newPrinter, paperWidth: e.target.value as any})} 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none"
                  >
                    <option value="80mm">80 mm (Estándar Térmico)</option>
                    <option value="58mm">58 mm (Ticket Compacto)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Dirección IP o Puerto</label>
                <input 
                  type="text" 
                  placeholder="192.168.1.200:9100 / USB001" 
                  value={newPrinter.ipAddress} 
                  onChange={e => setNewPrinter({...newPrinter, ipAddress: e.target.value})} 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-mono font-bold outline-none" 
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-2">Categorías Asociadas:</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1 border border-stone-100 rounded-xl">
                  {AVAILABLE_CATEGORIES.map(cat => {
                    const isChecked = newPrinter.categories.includes(cat);
                    return (
                      <label key={cat} className={cn("p-1.5 rounded-lg border text-[11px] font-bold cursor-pointer flex items-center gap-1.5", isChecked ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-stone-200 text-stone-600")}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const next = checked ? [...newPrinter.categories, cat] : newPrinter.categories.filter(c => c !== cat);
                            setNewPrinter({ ...newPrinter, categories: next });
                          }} 
                          className="rounded w-3 h-3 accent-amber-600" 
                        />
                        <span className="truncate">{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-100">
              <button 
                type="button" 
                onClick={handleAddPrinter} 
                disabled={!newPrinter.name.trim()} 
                className="flex-1 py-2.5 bg-stone-900 hover:bg-black disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Agregar Estación
              </button>
              <button 
                type="button" 
                onClick={() => setShowAddPrinterModal(false)} 
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
