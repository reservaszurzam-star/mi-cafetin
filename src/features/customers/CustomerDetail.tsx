import React, { useState } from 'react';
import { useAppStore } from "../../hooks/StoreContext";
import { ViewState } from "../../App";
import { ArrowLeft } from 'lucide-react';
import { PaymentMethod } from "../../types";
import { CustomerSummaryCard } from "./CustomerSummaryCard";
import { CustomerTransactionsTable } from "./CustomerTransactionsTable";
import { CustomerTransactionModal } from "./CustomerTransactionModal";
import { generateCustomerPdf } from "./customerPdfService";

export default function CustomerDetail({
  customerId,
  onNavigate,
}: {
  customerId: string;
  onNavigate: (v: ViewState) => void;
}) {
  const {
    customers,
    transactions,
    getCustomerBalance,
    addTransaction,
    deleteTransaction,
    deleteCustomer,
    settings,
  } = useAppStore();

  const customer = customers.find((c) => c.id === customerId);
  const balance = getCustomerBalance(customerId);
  const customerTransactions = transactions
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'charge' | 'payment';
  }>({ isOpen: false, type: 'charge' });

  if (!customer) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl p-8 border border-stone-200 shadow-sm max-w-md mx-auto">
        <h2 className="text-lg font-black text-stone-900">Cliente no encontrado</h2>
        <p className="text-xs text-stone-500 mt-1">El cliente solicitado fue eliminado o no existe.</p>
        <button
          className="mt-4 px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl shadow-sm"
          onClick={() => onNavigate({ name: "customers" })}
        >
          Volver a Clientes
        </button>
      </div>
    );
  }

  const handleConfirmTransaction = (
    numAmount: number,
    desc: string,
    paymentMethod?: PaymentMethod
  ) => {
    addTransaction(
      customerId,
      modalState.type,
      numAmount,
      desc,
      undefined,
      modalState.type === 'payment' ? paymentMethod : undefined
    );
    setModalState({ isOpen: false, type: 'charge' });
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar permanentemente al cliente "${customer.name}" y todo su historial de crédito?`)) {
      deleteCustomer(customerId);
      onNavigate({ name: "customers" });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Botón Volver */}
      <button
        onClick={() => onNavigate({ name: "customers" })}
        className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Clientes
      </button>

      {/* Tarjeta de Resumen y Acciones */}
      <CustomerSummaryCard
        customer={customer}
        balance={balance}
        settings={settings}
        onOpenCharge={() => setModalState({ isOpen: true, type: 'charge' })}
        onOpenPayment={() => setModalState({ isOpen: true, type: 'payment' })}
        onDownloadPdf={() => generateCustomerPdf(customer, customerTransactions, balance, settings)}
        onDeleteCustomer={handleDelete}
      />

      {/* Historial de Movimientos */}
      <CustomerTransactionsTable
        transactions={customerTransactions}
        settings={settings}
        onDeleteTransaction={(id) => {
          if (confirm('¿Eliminar este movimiento?')) deleteTransaction(id);
        }}
      />

      {/* Modal Cargo / Abono */}
      <CustomerTransactionModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={() => setModalState({ isOpen: false, type: 'charge' })}
        onConfirm={handleConfirmTransaction}
      />

    </div>
  );
}
