import React, { useState } from 'react';
import { Transaction, Settings } from '../../types';
import { formatMoney } from '../../lib/formatters';
import { Trash2, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomerTransactionsTableProps {
  transactions: Transaction[];
  settings: Settings;
  onDeleteTransaction: (id: string) => void;
}

export const CustomerTransactionsTable: React.FC<CustomerTransactionsTableProps> = ({
  transactions,
  settings,
  onDeleteTransaction,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;

  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-3">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <h4 className="font-black text-sm text-stone-900">Historial de Movimientos & Pagos</h4>
        <span className="text-xs text-stone-500 font-bold">{transactions.length} registros</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-900 text-white font-black text-[11px] uppercase tracking-wider">
              <th className="p-3.5 px-4">Fecha</th>
              <th className="p-3.5">Descripción / Concepto</th>
              <th className="p-3.5">Método de Pago</th>
              <th className="p-3.5 text-right">Consumo (+)</th>
              <th className="p-3.5 text-right">Abono (-)</th>
              <th className="p-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                  No hay movimientos registrados para este cliente.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50 transition">
                  <td className="p-3.5 px-4 font-mono text-stone-500">
                    {format(new Date(tx.date), "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="p-3.5 font-bold text-stone-900">{tx.description}</td>
                  <td className="p-3.5 text-stone-600 font-semibold">{tx.paymentMethod || '-'}</td>
                  <td className="p-3.5 text-right font-black font-mono text-rose-600">
                    {tx.type === 'charge' ? `+${formatMoney(tx.amount, settings.currency)}` : '-'}
                  </td>
                  <td className="p-3.5 text-right font-black font-mono text-emerald-600">
                    {tx.type === 'payment' ? `-${formatMoney(tx.amount, settings.currency)}` : '-'}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1 text-stone-300 hover:text-rose-600 transition"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-semibold">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
