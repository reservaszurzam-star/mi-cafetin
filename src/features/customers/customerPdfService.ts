import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Customer, Transaction, Settings } from "../../types";

export function generateCustomerPdf(
  customer: Customer,
  transactions: Transaction[],
  balance: number,
  settings: Settings
) {
  const doc = new jsPDF();

  // Encabezado
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(settings.companyName || "Cafetín Don Grill", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("Estado de Cuenta de Cliente", 14, 28);

  // Info del Cliente
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Cliente: ${customer.name}`, 14, 40);
  doc.text(
    `Documento: ${customer.docType || "DNI"}: ${customer.docNumber || "-"}`,
    14,
    46
  );
  doc.text(`Teléfono: ${customer.phone || "-"}`, 14, 52);
  doc.text(
    `Fecha de Emisión: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`,
    14,
    58
  );

  // Balance
  doc.setFontSize(12);
  if (balance > 0) {
    doc.setTextColor(225, 29, 72); // Rose
    doc.text(
      `Saldo Deudor Pendiente: ${settings.currency} ${balance.toFixed(2)}`,
      14,
      68
    );
  } else {
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`Saldo al Día / Sin Deuda Pendiente`, 14, 68);
  }

  // Tabla de Transacciones
  const tableData = transactions.map((t) => [
    format(new Date(t.date), "dd/MM/yyyy HH:mm", { locale: es }),
    t.description,
    t.type === "charge" ? "Consumo (Cargo)" : "Abono (Pago)",
    t.paymentMethod || "-",
    t.type === "charge" ? `+${settings.currency} ${t.amount.toFixed(2)}` : "-",
    t.type === "payment" ? `-${settings.currency} ${t.amount.toFixed(2)}` : "-",
  ]);

  autoTable(doc, {
    startY: 75,
    head: [
      [
        "Fecha",
        "Descripción",
        "Tipo",
        "Método",
        `Cargo (+${settings.currency})`,
        `Abono (-${settings.currency})`,
      ],
    ],
    body: tableData,
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8 },
  });

  doc.save(
    `Estado_Cuenta_${customer.name.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`
  );
}
