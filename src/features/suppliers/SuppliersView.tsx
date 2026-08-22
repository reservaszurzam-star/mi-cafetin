import React, { useState, useEffect } from 'react';
import { 
  Building2, ShoppingCart, Plus
} from 'lucide-react';
import { cn } from "../../lib/utils";
import { Supplier, PurchaseOrder, INITIAL_SUPPLIERS, INITIAL_ORDERS } from "./supplierTypes";
import { SuppliersListTab } from "./SuppliersListTab";
import { PurchaseOrdersTab } from "./PurchaseOrdersTab";
import { SupplierFormModal } from "./SupplierFormModal";
import { PurchaseOrderModal } from "./PurchaseOrderModal";

export default function SuppliersView() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('suppliers');

  // Estado persistido en LocalStorage
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('cafetin_suppliers_list');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [orders, setOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('cafetin_purchase_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Modales
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('cafetin_suppliers_list', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('cafetin_purchase_orders', JSON.stringify(orders));
  }, [orders]);

  // Handlers Proveedores
  const handleSaveSupplier = (data: Omit<Supplier, 'id'>) => {
    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? { ...data, id: editingSupplier.id } : s));
    } else {
      const newSup: Supplier = {
        ...data,
        id: `sup-${Date.now()}`
      };
      setSuppliers(prev => [newSup, ...prev]);
    }
    setShowSupplierModal(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  // Handlers Órdenes de Compra
  const handleSaveOrder = (orderData: Omit<PurchaseOrder, 'id'>) => {
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: `po-${Date.now()}`
    };
    setOrders(prev => [newOrder, ...prev]);
    setShowOrderModal(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: PurchaseOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  return (
    <div className="space-y-6">
      {/* Header Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
              Compras & Abastecimiento
            </span>
            <span className="text-xs text-stone-400 font-bold">· Módulo de Insumos</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-amber-500" />
            Proveedores & Órdenes de Compra
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-0.5">
            Directorio comercial de distribuidores, condiciones de crédito y generación de pedidos de compra
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5",
                activeTab === 'suppliers' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Proveedores ({suppliers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5",
                activeTab === 'orders' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Órdenes de Compra ({orders.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'suppliers') {
                setEditingSupplier(null);
                setShowSupplierModal(true);
              } else {
                setShowOrderModal(true);
              }
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'suppliers' ? 'Nuevo Proveedor' : 'Nueva Orden'}</span>
          </button>
        </div>
      </div>

      {/* Contenido por Tab */}
      {activeTab === 'suppliers' && (
        <SuppliersListTab
          suppliers={suppliers}
          onOpenCreate={() => {
            setEditingSupplier(null);
            setShowSupplierModal(true);
          }}
          onOpenEdit={(sup) => {
            setEditingSupplier(sup);
            setShowSupplierModal(true);
          }}
          onDelete={handleDeleteSupplier}
        />
      )}

      {activeTab === 'orders' && (
        <PurchaseOrdersTab
          orders={orders}
          suppliers={suppliers}
          onOpenCreate={() => setShowOrderModal(true)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {/* Modales */}
      <SupplierFormModal
        isOpen={showSupplierModal}
        onClose={() => {
          setShowSupplierModal(false);
          setEditingSupplier(null);
        }}
        onSave={handleSaveSupplier}
        editingSupplier={editingSupplier}
      />

      <PurchaseOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onSave={handleSaveOrder}
        suppliers={suppliers}
      />
    </div>
  );
}
