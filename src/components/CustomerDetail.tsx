import React, { useState } from "react";
import { useAppStore } from "../hooks/StoreContext";
import { ViewState } from "../App";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  Clock,
  FileDown,
  MessageCircle,
  Trash2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    products,
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

  const [isAddingCharge, setIsAddingCharge] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<import("../types").PaymentMethod>("Efectivo");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const PAYMENT_METHODS: import("../types").PaymentMethod[] = [
    "Efectivo",
    "Yape",
    "Plin",
    "Tarjeta",
    "Transferencia",
    "Otro",
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(customerTransactions.length / itemsPerPage);
  const paginatedTransactions = customerTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-stone-100">
          Cliente no encontrado
        </h2>
        <Button
          className="mt-4"
          onClick={() => onNavigate({ name: "customers" })}
        >
          Volver a clientes
        </Button>
      </div>
    );
  }

  const handleTransaction = (
    e: React.FormEvent,
    type: "charge" | "payment",
  ) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Por favor ingrese un monto válido mayor a 0");
      return;
    }

    let desc = description.trim();
    if (type === "payment" && !desc) desc = "Pago / Settle";
    if (type === "charge" && !desc) {
      alert("Por favor ingrese una descripción para el consumo");
      return;
    }

    addTransaction(
      customerId,
      type,
      numAmount,
      desc,
      undefined,
      type === "payment" ? paymentMethod : undefined,
    );

    setIsAddingCharge(false);
    setIsAddingPayment(false);
    setAmount("");
    setDescription("");
    setPaymentMethod("Efectivo");
    setCurrentPage(1); // Reset page on new transaction
  };

  const handleSettleFull = () => {
    if (balance <= 0) return;
    addTransaction(
      customerId,
      "payment",
      balance,
      "Liquidación total del saldo",
      undefined,
      "Efectivo",
    );
  };

  const sendWhatsApp = () => {
    if (!customer) return;
    if (!customer.phone) {
      alert("El cliente no tiene un número de teléfono registrado.");
      return;
    }

    // Remove non-numeric chars from phone
    const cleanPhone = customer.phone.replace(/\D/g, "");

    let text = `Hola ${customer.name},\n\n`;
    text += `Aquí tienes el resumen de tu cuenta en *${settings.companyName}*:\n\n`;

    const chronologicalTx = [...customerTransactions].reverse();

    if (chronologicalTx.length > 0) {
      text += `*Detalle de movimientos:*\n`;
      chronologicalTx.forEach((tx) => {
        const dateStr = format(new Date(tx.date), "dd/MM", { locale: es });
        if (tx.type === "charge") {
          text += `🔹 ${dateStr} - ${tx.description}: ${settings.currency} ${tx.amount.toFixed(2)}\n`;
        } else {
          text += `✅ ${dateStr} - Pago${tx.paymentMethod ? ` (${tx.paymentMethod})` : ""}: -${settings.currency} ${tx.amount.toFixed(2)}\n`;
        }
      });
      text += `\n`;
    }

    text += `*Deuda Total Actual:* ${settings.currency} ${balance.toFixed(2)}\n\n`;
    text += `¡Gracias por tu preferencia! ☕`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
  };

  const deleteCustomerWithConfirmation = () => {
    // Custom inline confirmation for deleting customer could be added here,
    // but a safe modal approach is better due to iframe blocking window.confirm.
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Cliente",
      message:
        "¿Seguro que deseas eliminar a este cliente y todo su historial de transacciones? Esta acción no se puede deshacer.",
      onConfirm: () => {
        deleteCustomer(customerId);
        onNavigate({ name: "customers" });
      },
    });
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleDeleteCustomer = deleteCustomerWithConfirmation;

  const exportPDF = () => {
    if (!customer) return;
    setIsGeneratingPdf(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Sleek Header Area with soft background
        doc.setFillColor(250, 250, 249); // stone-50 warm background
        doc.rect(0, 0, pageWidth, 45, "F");

        // Logo / Brand Name
        doc.setTextColor(87, 83, 78); // stone-600
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text(settings.companyName || "Mi Cafetín", 14, 24);

        // Subtitle or Tagline
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(168, 162, 158); // stone-400
        doc.text("Estado de Cuenta de Cliente", 15, 30);

        // Document Type & Date (Right aligned)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(217, 119, 6); // amber-600
        doc.text("ESTADO DE CUENTA", pageWidth - 14, 22, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 113, 108); // stone-500
        doc.text(
          `Emitido: ${format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}`,
          pageWidth - 14,
          28,
          { align: "right" },
        );

        // Separator line
        doc.setDrawColor(231, 229, 228); // stone-200
        doc.line(14, 45, pageWidth - 14, 45);

        // 2. Client Information details
        doc.setFontSize(9);
        doc.setTextColor(168, 162, 158); // stone-400
        doc.setFont("helvetica", "normal");
        doc.text("CLIENTE", 14, 60);

        doc.setFontSize(14);
        doc.setTextColor(87, 83, 78); // stone-600
        doc.setFont("helvetica", "bold");
        doc.text(customer.name, 14, 68);

        if (customer.phone) {
          doc.setFontSize(9);
          doc.setTextColor(168, 162, 158);
          doc.setFont("helvetica", "normal");
          doc.text(`Tel: ${customer.phone}`, 14, 74);
        }

        // 3. Balance Summary Box
        doc.setFontSize(9);
        doc.setTextColor(168, 162, 158);
        doc.setFont("helvetica", "normal");
        doc.text("DEUDA TOTAL", pageWidth - 14, 60, { align: "right" });

        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        if (balance > 0) {
          doc.setTextColor(217, 119, 6); // amber-600 for debt
        } else {
          doc.setTextColor(16, 185, 129); // emerald-500 for paid
        }
        doc.text(
          `${settings.currency} ${balance.toFixed(2)}`,
          pageWidth - 14,
          68,
          { align: "right" },
        );

        // 4. Transactions Table (with Running Balance)
        // Calculate running balance from oldest to newest
        const chronological = [...customerTransactions].reverse();
        let currentBalance = 0;
        const txWithBalance = chronological.map(tx => {
          if (tx.type === "charge") {
            currentBalance += tx.amount;
          } else {
            currentBalance -= tx.amount;
          }
          return { ...tx, runningBalance: currentBalance };
        });
        
        // Reverse back to newest first for display
        const displayData = txWithBalance.reverse();

        const tableData = displayData.map((tx) => {
          let description = tx.description;
          if (tx.type === "payment" && tx.paymentMethod) {
            description += ` (${tx.paymentMethod})`;
          }
          return [
            format(new Date(tx.date), "dd/MM"),
            description,
            tx.type === "charge"
              ? `${settings.currency} ${tx.amount.toFixed(2)}`
              : "",
            tx.type === "payment"
              ? `${settings.currency} ${tx.amount.toFixed(2)}`
              : "",
            `${settings.currency} ${tx.runningBalance.toFixed(2)}`
          ];
        });

        autoTable(doc, {
          startY: 85,
          head: [["Fecha", "Descripción", "Consumo", "Pago", "Saldo"]],
          body: tableData,
          theme: "plain",
          headStyles: {
            fillColor: [250, 250, 249],
            textColor: [120, 113, 108],
            fontStyle: "bold",
            lineWidth: 0.1,
            lineColor: [245, 245, 244],
          },
          styles: {
            fontSize: 8,
            textColor: [87, 83, 78],
            cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
            lineColor: [245, 245, 244],
            lineWidth: { bottom: 0.1 },
          },
          alternateRowStyles: {
            fillColor: [255, 255, 255],
          },
          columnStyles: {
            0: { cellWidth: 16 }, // Fecha
            2: { halign: "right", textColor: [87, 83, 78], fontStyle: "bold", cellWidth: 20 }, // Consumo
            3: { halign: "right", textColor: [16, 185, 129], fontStyle: "bold", cellWidth: 20 }, // Pago
            4: { halign: "right", textColor: [217, 119, 6], fontStyle: "bold", cellWidth: 22 }, // Saldo
          },
        });

        // Add payment details if balance > 0
        if (balance > 0 && settings.paymentDetails) {
          let finalY = (doc as any).lastAutoTable.finalY || 85;
          if (finalY + 40 > pageHeight - 20) {
            doc.addPage();
            finalY = 20;
          }
          
          finalY += 15;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(87, 83, 78);
          doc.text("Medios de Pago Disponibles:", 14, finalY);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(120, 113, 108);
          
          let yPos = finalY + 8;
          if (settings.paymentDetails.yape) {
            doc.text(`• Yape: ${settings.paymentDetails.yape}`, 14, yPos);
            yPos += 6;
          }
          if (settings.paymentDetails.plin) {
            doc.text(`• Plin: ${settings.paymentDetails.plin}`, 14, yPos);
            yPos += 6;
          }
          if (settings.paymentDetails.transferencia) {
            doc.text(`• Cta. Bancaria: ${settings.paymentDetails.transferencia}`, 14, yPos);
          }
        }

        // 5. Elegant Footer (Pagination and Note)
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);

          // Footer Line
          doc.setDrawColor(231, 229, 228);
          doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

          // Footer Text
          doc.setFontSize(8);
          doc.setTextColor(168, 162, 158);
          doc.setFont("helvetica", "normal");
          doc.text(
            "Gracias por su preferencia en Mi Cafetín. Este documento es de control interno.",
            14,
            pageHeight - 12,
          );
          doc.text(
            `Página ${i} de ${pageCount}`,
            pageWidth - 14,
            pageHeight - 12,
            { align: "right" },
          );
        }

        doc.save(
          `Cuenta_${customer.name.replace(/\s+/g, "_")}_${format(new Date(), "dd-MM-yyyy")}.pdf`,
        );
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 100); // 100ms delay to allow UI to render the loading state
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate({ name: "customers" })}
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl lg:text-4xl font-display text-stone-800 tracking-tight">
              {customer.name}
            </h1>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-stone-500 text-sm flex items-center">
                <span className="font-medium mr-1.5">Fecha de registro:</span>{" "}
                {format(new Date(customer.createdAt), "dd 'de' MMMM yyyy", {
                  locale: es,
                })}
              </p>
              {customerTransactions.length > 0 && (
                <p className="text-stone-500 text-sm flex items-center">
                  <span className="font-medium mr-1.5">
                    Última transacción:
                  </span>{" "}
                  {format(
                    new Date(customerTransactions[0].date),
                    "dd 'de' MMMM yyyy, HH:mm",
                    { locale: es },
                  )}
                </p>
              )}
              {customer.phone && (
                <p className="text-stone-500 text-sm flex items-center">
                  <span className="font-medium mr-1.5">Teléfono:</span>{" "}
                  {customer.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={sendWhatsApp}
            className="w-full sm:w-auto border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 dark:bg-emerald-900/20 dark:border-emerald-800"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            disabled={isGeneratingPdf}
            className="w-full sm:w-auto text-stone-600 bg-white dark:bg-stone-800 dark:text-stone-200"
          >
            {isGeneratingPdf ? (
              <span className="w-4 h-4 mr-2 border-2 border-stone-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            {isGeneratingPdf ? "Exportando..." : "Exportar PDF"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteCustomer}
            className="w-full sm:w-auto text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100 dark:hover:bg-rose-900/40 dark:bg-rose-900/20 dark:border-rose-800"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/60 dark:border-stone-800 shadow-sm p-6">
            <h2 className="text-sm font-medium text-stone-500 mb-2">
              Deuda Total
            </h2>
            <div
              className={`text-4xl lg:text-5xl font-display tracking-tight ${balance > 0 ? "text-amber-600" : "text-stone-800 dark:text-stone-100"}`}
            >
              {settings.currency} {balance.toFixed(2)}
            </div>
            {balance > 0 && (
              <Button
                onClick={handleSettleFull}
                variant="outline"
                className="w-full mt-6 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Liquidar Todo
              </Button>
            )}
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/60 dark:border-stone-800 shadow-sm p-6 space-y-3">
            <Button
              onClick={() => {
                setIsAddingCharge(true);
                setIsAddingPayment(false);
              }}
              className="w-full"
              disabled={isAddingCharge}
            >
              <Plus className="w-4 h-4 mr-2" />
              Añadir Consumo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddingPayment(true);
                setIsAddingCharge(false);
              }}
              className="w-full"
              disabled={isAddingPayment || balance <= 0}
            >
              Registrar Pago
            </Button>
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Action Forms */}
          {(isAddingCharge || isAddingPayment) && (
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/60 dark:border-stone-800 shadow-sm p-6 mb-8 border border-amber-100 dark:border-stone-800 bg-amber-50/30 dark:bg-stone-800/50">
              <h3 className="font-medium text-lg text-stone-800 dark:text-stone-100 mb-6">
                {isAddingCharge ? "Nuevo Consumo" : "Registrar Pago"}
              </h3>
              <form
                onSubmit={(e) =>
                  handleTransaction(e, isAddingCharge ? "charge" : "payment")
                }
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                      Descripción{" "}
                      {isAddingCharge ? "(Ej. Menú, Café)" : "(Opcional)"}
                    </label>
                    <Input
                      placeholder={
                        isAddingCharge ? "Café + Empanada" : "A cuenta..."
                      }
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required={isAddingCharge}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                      Monto ({settings.currency})
                    </label>
                    <Input
                      type="number"
                      step="0.10"
                      min="0.10"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  {isAddingPayment && (
                    <div>
                      <label className="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                        Método de Pago
                      </label>
                      <select
                        className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-2.5 text-stone-800 dark:text-stone-100 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-shadow"
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as any)
                        }
                        required
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {isAddingCharge && products && products.length > 0 && (
                  <div className="pt-6 border-t border-amber-100 dark:border-stone-800 mt-6">
                    <label className="block text-sm font-medium text-amber-800 dark:text-amber-500 mb-4">
                      Añadir del Menú:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {products.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const newDesc = description
                              ? description + " + " + p.name
                              : p.name;
                            const currentAmount = parseFloat(amount) || 0;
                            const newAmount = currentAmount + p.price;
                            setDescription(newDesc);
                            setAmount(newAmount.toFixed(2));
                          }}
                          className="bg-white dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-stone-700 text-sm px-4 py-2 rounded-full transition-all font-medium shadow-sm hover:shadow"
                        >
                          {p.name}{" "}
                          <span className="opacity-80 ml-1 font-normal">
                            ({settings.currency} {p.price.toFixed(2)})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingCharge(false);
                      setIsAddingPayment(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className={
                      isAddingPayment
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : ""
                    }
                  >
                    {isAddingCharge ? "Agregar a la cuenta" : "Guardar Pago"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Activity List */}
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/60 dark:border-stone-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
              <h3 className="font-medium text-stone-800 dark:text-stone-100">
                Historial
              </h3>
            </div>
            {customerTransactions.length > 0 ? (
              <>
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {paginatedTransactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors group gap-3"
                    >
                      <div className="flex flex-col flex-1 min-w-0 pr-4">
                        <span className="font-medium text-stone-800 dark:text-stone-100 break-words">
                          {tx.description}
                          {tx.type === "payment" && tx.paymentMethod && (
                            <span className="ml-2 text-xs font-normal bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-300 px-2 py-0.5 rounded-full inline-block">
                              {tx.paymentMethod}
                            </span>
                          )}
                        </span>
                        <span className="text-stone-500 dark:text-stone-400 text-sm mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1.5 shrink-0" />
                          {format(new Date(tx.date), "dd MMM yyyy, p", {
                            locale: es,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6">
                        <div
                          className={`font-medium text-lg text-right truncate ${tx.type === "charge" ? "text-stone-800 dark:text-stone-100" : "text-emerald-600 dark:text-emerald-500"}`}
                        >
                          {tx.type === "charge" ? "+" : "-"}{" "}
                          {settings?.currency || "S/"} {tx.amount.toFixed(2)}
                        </div>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: "Eliminar Registro",
                              message:
                                "¿Seguro que deseas eliminar este registro?",
                              onConfirm: () => deleteTransaction(tx.id),
                            });
                          }}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-2 bg-white border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-rose-50 dark:hover:bg-stone-800 shadow-sm shrink-0"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {totalPages > 1 && (
                  <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/30 dark:bg-stone-800/10">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-sm"
                    >
                      Anterior
                    </Button>
                    <span className="text-stone-500 dark:text-stone-400 text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="text-sm"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-stone-400 dark:text-stone-500 text-sm flex flex-col items-center">
                <Clock className="w-10 h-10 mb-4 opacity-50" />
                Aún no hay movimientos.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-stone-100 dark:border-stone-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-display text-stone-800 dark:text-stone-100 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Cancelar
              </Button>
              <Button
                variant="default"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
