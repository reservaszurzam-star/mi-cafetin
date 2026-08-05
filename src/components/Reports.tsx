import React, { useState, useMemo } from "react";
import { useAppStore } from "../hooks/StoreContext";
import { Button } from "./ui/Button";
import { FileDown, MessageCircle, Calendar, TrendingUp } from "lucide-react";
import {
  format,
  startOfMonth,
  startOfDay,
  endOfMonth,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Reports() {
  const { customers, transactions, settings, sales } = useAppStore();
  const [reportType, setReportType] = useState<"daily" | "monthly">("monthly");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const trendData = useMemo(() => {
    if (reportType === "daily") {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const pStart = startOfDay(d);
        const pEnd = endOfDay(d);

        const dailySales = transactions
          .filter(
            (t) =>
              t.type === "charge" &&
              new Date(t.date) >= pStart &&
              new Date(t.date) <= pEnd,
          )
          .reduce((sum, t) => sum + t.amount, 0);

        return { name: format(d, "EEE dd", { locale: es }), Ventas: dailySales };
      });
    } else {
      return Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const pStart = startOfMonth(d);
        const pEnd = endOfMonth(d);

        const dailySales = transactions
          .filter(
            (t) =>
              t.type === "charge" &&
              new Date(t.date) >= pStart &&
              new Date(t.date) <= pEnd,
          )
          .reduce((sum, t) => sum + t.amount, 0);

        return { name: format(d, "MMM yy", { locale: es }), Ventas: dailySales };
      });
    }
  }, [transactions, reportType]);

  const generateReportData = () => {
    const now = new Date();
    const periodStart =
      reportType === "daily" ? startOfDay(now) : startOfMonth(now);
    const periodEnd = reportType === "daily" ? endOfDay(now) : endOfMonth(now);

    const relevantTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= periodStart && txDate <= periodEnd;
    });

    const reportData = customers
      .map((customer) => {
        const customerTxs = relevantTransactions.filter(
          (t) => t.customerId === customer.id,
        );

        const charges = customerTxs
          .filter((t) => t.type === "charge")
          .reduce((sum, t) => sum + t.amount, 0);
        const payments = customerTxs
          .filter((t) => t.type === "payment")
          .reduce((sum, t) => sum + t.amount, 0);

        const allCustomerTxs = transactions.filter(
          (t) => t.customerId === customer.id,
        );
        const totalCharges = allCustomerTxs
          .filter((t) => t.type === "charge")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalPayments = allCustomerTxs
          .filter((t) => t.type === "payment")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalBalance = totalCharges - totalPayments;

        return {
          ...customer,
          periodCharges: charges,
          periodPayments: payments,
          totalBalance: totalBalance,
        };
      })
      .filter(
        (data) =>
          data.periodCharges > 0 ||
          data.periodPayments > 0 ||
          data.totalBalance > 0,
      );

    return reportData;
  };

  const exportGeneralPDF = () => {
    const data = generateReportData();
    setIsGeneratingPdf(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const isDaily = reportType === "daily";

        doc.setFillColor(250, 250, 249);
        doc.rect(0, 0, pageWidth, 45, "F");

        doc.setTextColor(87, 83, 78);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text(settings.companyName || "Mi Cafetín", 14, 24);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(168, 162, 158);
        doc.text("Reporte de Ventas", 15, 30);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(217, 119, 6);
        doc.text(
          isDaily ? "REPORTE DIARIO" : "REPORTE MENSUAL",
          pageWidth - 14,
          22,
          { align: "right" },
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 113, 108);
        doc.text(
          `Emitido: ${format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}`,
          pageWidth - 14,
          28,
          { align: "right" },
        );

        doc.setDrawColor(231, 229, 228);
        doc.line(14, 45, pageWidth - 14, 45);

        const totalPeriodCharges = data.reduce((sum, d) => sum + d.periodCharges, 0);
        const totalPeriodPayments = data.reduce((sum, d) => sum + d.periodPayments, 0);

        doc.setFontSize(9);
        doc.setTextColor(168, 162, 158);
        doc.setFont("helvetica", "normal");
        doc.text(isDaily ? "CONSUMOS DEL DÍA" : "CONSUMOS DEL MES", 14, 60);

        doc.setFontSize(18);
        doc.setTextColor(217, 119, 6);
        doc.setFont("helvetica", "bold");
        doc.text(`${settings.currency} ${totalPeriodCharges.toFixed(2)}`, 14, 68);

        doc.setFontSize(9);
        doc.setTextColor(168, 162, 158);
        doc.setFont("helvetica", "normal");
        doc.text(isDaily ? "PAGOS DEL DÍA" : "PAGOS DEL MES", pageWidth / 2, 60);

        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129);
        doc.setFont("helvetica", "bold");
        doc.text(`${settings.currency} ${totalPeriodPayments.toFixed(2)}`, pageWidth / 2, 68);

        const tableData = data.map((row) => [
          row.name,
          `${settings.currency} ${row.periodCharges.toFixed(2)}`,
          `${settings.currency} ${row.periodPayments.toFixed(2)}`,
          `${settings.currency} ${row.totalBalance.toFixed(2)}`,
        ]);

        autoTable(doc, {
          startY: 85,
          head: [["Cliente", "Consumos (Periodo)", "Pagos (Periodo)", "Deuda Total"]],
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
            fontSize: 9,
            textColor: [87, 83, 78],
            cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
            lineColor: [245, 245, 244],
            lineWidth: { bottom: 0.1 },
          },
        });

        doc.save(
          `Reporte_Ventas_${isDaily ? "Diario" : "Mensual"}_${format(new Date(), "yyyy-MM-dd")}.pdf`,
        );
      } catch (err) {
        console.error("Error al generar PDF:", err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 100);
  };

  const sendWhatsAppGeneral = (customer: any) => {
    const text = `Hola ${customer.name}, te enviamos tu estado de cuenta actual:\n\n*Deuda Total:* ${settings.currency} ${customer.totalBalance.toFixed(2)}\n\nGracias por tu preferencia.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const reportData = generateReportData();
  const now = new Date();
  const periodStart = reportType === "daily" ? startOfDay(now) : startOfMonth(now);
  const periodEnd = reportType === "daily" ? endOfDay(now) : endOfMonth(now);

  const relevantSales = sales
    .filter((s) => {
      const sDate = new Date(s.date);
      return sDate >= periodStart && sDate <= periodEnd;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 pb-20 md:pb-8">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Reportes & Análisis
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">
            Métricas de ventas e historial de cuentas de clientes.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex items-center shadow-inner">
            <button
              onClick={() => setReportType("daily")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                reportType === "daily"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                reportType === "monthly"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              Mes
            </button>
          </div>
          <button
            onClick={exportGeneralPDF}
            disabled={isGeneratingPdf}
            className="h-11 px-5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-stone-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-stone-900/20 dark:shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-stone-900/30 dark:border-t-stone-900 rounded-full animate-spin" />
            ) : (
              <FileDown className="w-5 h-5" />
            )}
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Gráfico de Tendencias */}
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm p-6 lg:p-8 flex flex-col group hover:border-amber-500/50 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black text-stone-900 dark:text-white tracking-tight">
              {reportType === "daily" ? "Ventas de los Últimos 7 Días" : "Ventas de los Últimos 6 Meses"}
            </h2>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 700 }} />
                <Tooltip
                  cursor={{ fill: "rgba(245, 158, 11, 0.05)" }}
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)", padding: "12px 16px", backgroundColor: "rgba(255, 255, 255, 0.95)", fontWeight: 700 }}
                  formatter={(value: number) => [`${settings.currency} ${value.toFixed(2)}`, "Consumos"]}
                  labelStyle={{ color: "#A8A29E", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
                />
                <Bar dataKey="Ventas" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historial de Ventas Caja */}
        <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 lg:p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
            <h3 className="font-black text-lg text-stone-900 dark:text-white tracking-tight">Historial de Ventas (Caja)</h3>
          </div>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800 flex-1 overflow-y-auto max-h-[320px] custom-scrollbar">
            {relevantSales.length > 0 ? (
              relevantSales.map((sale) => (
                <li key={sale.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                        {format(new Date(sale.date), "dd MMM, HH:mm", { locale: es })}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        sale.paymentMethod === "A crédito" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}>
                        {sale.paymentMethod}
                      </span>
                      {sale.customerId && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                          {customers.find((c) => c.id === sale.customerId)?.name || "Cliente"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1">
                      {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-base text-stone-900 dark:text-white">
                      {settings.currency} {sale.total.toFixed(2)}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8">
                <Calendar className="w-10 h-10 mb-3 opacity-20" />
                <span className="text-sm font-medium">No hay ventas de caja en este periodo.</span>
              </div>
            )}
          </ul>
        </div>
      </div>

      {/* Resumen por Cliente */}
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200/70 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
          <h3 className="font-black text-lg text-stone-900 dark:text-white tracking-tight">Cuentas por Cobrar (Clientes)</h3>
        </div>
        <ul className="divide-y divide-stone-100 dark:divide-stone-800 max-h-[500px] overflow-y-auto custom-scrollbar">
          {reportData.length > 0 ? (
            reportData.map((data) => (
              <li key={data.id} className="p-5 lg:px-6 lg:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="flex-1">
                  <span className="font-black text-stone-900 dark:text-white text-base">
                    {data.name}
                  </span>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-lg">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Consumos</span>
                      <span className="text-sm font-mono font-bold text-stone-700 dark:text-stone-300">{settings.currency} {data.periodCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-lg">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Pagos</span>
                      <span className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400">{settings.currency} {data.periodPayments.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-widest font-bold mb-1">
                      Deuda Total
                    </span>
                    <span className={`font-mono font-black text-lg ${data.totalBalance > 0 ? "text-rose-600 dark:text-rose-400" : "text-stone-400"}`}>
                      {settings.currency} {data.totalBalance.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => sendWhatsAppGeneral(data)}
                    className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                    title="Enviar estado de cuenta por WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))
          ) : (
            <div className="p-16 text-center text-stone-400 flex flex-col items-center justify-center">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <span className="text-sm font-medium">No hay movimientos de cuentas en este periodo.</span>
            </div>
          )}
        </ul>
      </div>
    </div>
  );
}
