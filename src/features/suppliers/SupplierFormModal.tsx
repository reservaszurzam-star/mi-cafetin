import React, { useState, useEffect } from 'react';
import { Building2, X } from 'lucide-react';
import { Supplier } from './supplierTypes';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Supplier, 'id'>) => void;
  editingSupplier?: Supplier | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSupplier,
}) => {
  const [name, setName] = useState('');
  const [ruc, setRuc] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<Supplier['category']>('Carnes & Aves');
  const [paymentTerms, setPaymentTerms] = useState<Supplier['paymentTerms']>('Contado');

  useEffect(() => {
    if (editingSupplier) {
      setName(editingSupplier.name);
      setRuc(editingSupplier.ruc);
      setContactName(editingSupplier.contactName);
      setPhone(editingSupplier.phone);
      setEmail(editingSupplier.email || '');
      setAddress(editingSupplier.address || '');
      setCategory(editingSupplier.category);
      setPaymentTerms(editingSupplier.paymentTerms);
    } else {
      setName('');
      setRuc('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCategory('Carnes & Aves');
      setPaymentTerms('Contado');
    }
  }, [editingSupplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      ruc: ruc.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      category,
      paymentTerms,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-stone-200 shadow-2xl animate-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 leading-tight">
                {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
              </h3>
              <p className="text-xs text-stone-500 font-semibold">Datos comerciales y condiciones de pago</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Razón Social / Nombre Comercial *
            </label>
            <input
              type="text"
              placeholder="Ej: Distribuidora Avícola San Fernando"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                RUC (11 dígitos)
              </label>
              <input
                type="text"
                maxLength={11}
                placeholder="20100154371"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-mono font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Contacto Asesor
              </label>
              <input
                type="text"
                placeholder="Ej: Carlos Mendoza"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="text"
                placeholder="987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="ventas@proveedor.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Rubro / Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                <option value="Carnes & Aves">Carnes & Aves</option>
                <option value="Verduras & Frutas">Verduras & Frutas</option>
                <option value="Abarrotes">Abarrotes & Insumos</option>
                <option value="Bebidas & Licores">Bebidas & Licores</option>
                <option value="Pescados & Mariscos">Pescados & Mariscos</option>
                <option value="Descartables & Limpieza">Descartables & Limpieza</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
                Condición de Pago
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
              >
                <option value="Contado">Al Contado</option>
                <option value="Crédito 7 días">Crédito 7 días</option>
                <option value="Crédito 15 días">Crédito 15 días</option>
                <option value="Crédito 30 días">Crédito 30 días</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-stone-700 uppercase tracking-wider mb-1">
              Dirección de Almacén / Local
            </label>
            <input
              type="text"
              placeholder="Ej: Mercado Mayorista de Lima, Pabellón C"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs hover:bg-stone-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-stone-900 text-white font-black rounded-xl text-xs hover:bg-stone-800 transition shadow-md"
            >
              {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
