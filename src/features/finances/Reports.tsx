import React, { useState, useMemo } from "react";
import { useAppStore } from "../../hooks/StoreContext";
import { Button } from "../../components/ui/Button";
import { 
  FileDown, MessageCircle, Calendar, TrendingUp, Trophy, 
  Printer, Award, Star, DollarSign, Download, Users, ChevronRight
} from "lucide-react";
import { format, startOfMonth, startOfDay, endOfMonth, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ThermalTicket } from "../tickets/ThermalTicket";
import { cn } from "../../lib/utils";

export default function Reports() {
  const { customers, transactions, settings, sales, users } = useAppStore();
  const [reportType, setReportType] = useState<"daily" | "monthly">("daily");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showThermalReport, setShowThermalReport] = useState(false);
  const [selectedSaleToPrint, setSelectedSaleToPrint] = useState<any | null>(null);

  const now = new Date();
  const periodStart = reportType === "daily" ? startOfDay(now) : startOfMonth(now);
  const periodEnd = reportType === "daily" ? endOfDay(now) : endOfMonth(now);

  const relevantSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = new Date(s.date);
      return sDate >= periodStart && sDate <= periodEnd;
    });
  }, [sales, periodStart, periodEnd]);

  // ── Ranking de Empleados / Mozos / Cajeros ──
  const employeeRanking = useMemo(() => {
    const map: Record<string, { name: string; role: string; salesTotal: number; ordersCount: number; tipsEstimated: number }> = {};
    
    // Inicializar con todos los usuarios registrados
    users.forEach(u => {
      map[u.name] = { name: u.name, role: u.role, salesTotal: 0, ordersCount: 0, tipsEstimated: 0 };
    });

    // Sumar ventas
    relevantSales.forEach(s => {
      const waiter = s.waiterName || s.cashierName || "Mesero";
      if (!map[waiter]) {
        map[waiter] = { name: waiter, role: "Mozo", salesTotal: 0, ordersCount: 0, tipsEstimated: 0 };
      }
      map[waiter].salesTotal += s.total;
      map[waiter].ordersCount += 1;
      map[waiter].tipsEstimated += Number((s.total * 0.05).toFixed(2)); // 5% de propina promedio
    });

    return Object.values(map).sort((a, b) => b.salesTotal - a.salesTotal);
  }, [sales, users, relevantSales]);

  // Gráfico de Tendencias
  const trendData = useMemo(() => {
    if (reportType === "daily") {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const pStart = startOfDay(d);
        const pEnd = endOfDay(d);

        const dailySales = sales
          .filter((s) => new Date(s.date) >= pStart && new Date(s.date) <= pEnd)
          .reduce((sum, s) => sum + s.total, 0);

        return { name: format(d, "EEE dd", { locale: es }), Ventas: dailySales };
      });
    } else {
      return Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const pStart = startOfMonth(d);
        const pEnd = endOfMonth(d);

        const monthlySales = sales
          .filter((s) => new Date(s.date) >= pStart && new Date(s.date) <= pEnd)
          .reduce((sum, s) => sum + s.total, 0);

        return { name: format(d, "MMM yy", { locale: es }), Ventas: monthlySales };
      });
    }
  }, [sales, reportType]);

  const totalPeriodSales = relevantSales.reduce((sum, s) => sum + s.total, 0);

  // ── Exportar a Excel / CSV ──
  const handleExportCSV = () => {
    const headers = ["ID Venta", "Fecha y Hora", "Mesa / Canal", "Mozo / Cajero", "Método de Pago", "Productos", "Total (S/)"];
    const rows = relevantSales.map(s => [
      s.id,
      format(new Date(s.date), "dd/MM/yyyy HH:mm"),
      s.tableNumber || "Venta Directa",
      s.waiterName || "Mesero",
      s.paymentMethod,
      `"${s.items.map(i => `${i.quantity}x ${i.productName}`).join('; ')}"`,
      s.total.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Ventas_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Exportar a PDF ──
  const handleExportPDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(settings.companyName.toUpperCase(), 14, 20);
      doc.setFontSize(12);
      doc.text(`REPORTE DE VENTAS - ${reportType === 'daily' ? 'DIARIO' : 'MENSUAL'}`, 14, 28);
      doc.setFontSize(10);
      doc.text(`Generado el: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 34);

      const tableData = relevantSales.map(s => [
        format(new Date(s.date), "dd/MM HH:mm"),
        s.tableNumber || "Venta",
        s.waiterName || "Mesero",
        s.paymentMethod,
        `${settings.currency} ${s.total.toFixed(2)}`
      ]);

      autoTable(doc, {
        head: [['Fecha/Hora', 'Mesa', 'Mesero', 'Método', 'Total']],
        body: tableData,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`TOTAL GENERAL: ${settings.currency} ${totalPeriodSales.toFixed(2)}`, 14, finalY);

      doc.save(`Reporte_${reportType}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-amber-500" />
            Reportes Diarios & Ranking de Desempeño
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-1">
            Análisis de ingresos, descarga de reportes e incentivos para el personal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector Diario / Mensual */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setReportType("daily")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                reportType === "daily" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                reportType === "monthly" ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Este Mes
            </button>
          </div>

          <button
            onClick={() => setShowThermalReport(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition"
            title="Imprimir ticket de cierre de caja en formato térmico"
          >
            <Printer className="w-4 h-4" />
            <span>Ticket Cierre</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPdf}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGeneratingPdf ? "Generando..." : "Descargar PDF"}</span>
          </button>
        </div>
      </div>

      {/* ── STATS RESUMEN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <span className="text-stone-500 text-xs font-bold uppercase tracking-wider block mb-1">Venta Total del Periodo</span>
          <div className="text-3xl font-black font-mono text-stone-900 mb-1">
            {settings.currency} {totalPeriodSales.toFixed(2)}
          </div>
          <p className="text-xs font-semibold text-stone-500">{relevantSales.length} comandas atendidas</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <span className="text-amber-800 text-xs font-bold uppercase tracking-wider block mb-1">Ticket Promedio por Mesa</span>
          <div className="text-3xl font-black font-mono text-amber-900 mb-1">
            {settings.currency} {relevantSales.length > 0 ? (totalPeriodSales / relevantSales.length).toFixed(2) : "0.00"}
          </div>
          <p className="text-xs font-bold text-amber-700">Consumo medio por comanda</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <span className="text-emerald-800 text-xs font-bold uppercase tracking-wider block mb-1">Total Colaboradores Activos</span>
          <div className="text-3xl font-black font-mono text-emerald-900 mb-1">
            {users.length}
          </div>
          <p className="text-xs font-bold text-emerald-700">Mozos, Cocineros y Cajeros</p>
        </div>
      </div>

      {/* ── GRÁFICO + RANKING DE COLABORADORES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Gráfico de Ventas */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg text-stone-900">
              {reportType === "daily" ? "Evolución Últimos 7 Días" : "Evolución Últimos 6 Meses"}
            </h3>
            <span className="text-xs font-bold text-stone-400">Total en soles</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11, fontWeight: 700 }} />
                <Tooltip
                  formatter={(value: number) => [`${settings.currency} ${value.toFixed(2)}`, "Ventas"]}
                  contentStyle={{ borderRadius: "16px", border: "1px solid #E5E7EB", fontWeight: 700 }}
                />
                <Bar dataKey="Ventas" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking de Empleados */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900">Ranking de Colaboradores</h3>
                <p className="text-[11px] font-semibold text-stone-500">Ventas & Propinas estimadas</p>
              </div>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
            {employeeRanking.map((emp, index) => {
              const rankNumber = `#${index + 1}`;
              const rankColor = 
                index === 0 ? "bg-amber-100 text-amber-900 border-amber-300" :
                index === 1 ? "bg-stone-200 text-stone-800 border-stone-300" :
                index === 2 ? "bg-orange-100 text-orange-900 border-orange-200" :
                "bg-stone-100 text-stone-600 border-stone-200";

              return (
                <div key={emp.name} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border shadow-xs", rankColor)}>
                      {rankNumber}
                    </span>
                    <div>
                      <h4 className="font-black text-xs text-stone-900">{emp.name}</h4>
                      <p className="text-[10px] text-stone-500 font-semibold">{emp.role} · {emp.ordersCount} órdenes</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-stone-900 block">
                      {settings.currency} {emp.salesTotal.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-amber-600">
                      Propina ~{settings.currency}{emp.tipsEstimated.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── HISTORIAL DE VENTAS DETALLADO ── */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 bg-stone-50/70 flex justify-between items-center">
          <h3 className="font-black text-base text-stone-900">Historial Detallado de Ventas</h3>
          <span className="text-xs text-stone-500 font-bold">{relevantSales.length} registros</span>
        </div>

        <div className="divide-y divide-stone-100 max-h-[400px] overflow-y-auto custom-scrollbar">
          {relevantSales.map((sale) => (
            <div key={sale.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 transition">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs text-stone-900">
                    {format(new Date(sale.date), "dd MMM, HH:mm", { locale: es })}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                    {sale.tableNumber || "Venta Directa"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    {sale.paymentMethod}
                  </span>
                  {sale.waiterName && (
                    <span className="text-[10px] text-stone-500 font-semibold">
                      Mozo: {sale.waiterName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedSaleToPrint(sale)}
                  className="px-2.5 py-1.5 bg-stone-100 hover:bg-amber-500 hover:text-stone-950 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Ver e Imprimir Ticket de esta Venta"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver Ticket</span>
                </button>
                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-base text-stone-900">
                    {settings.currency} {sale.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MODAL TICKET REPORTE DE VENTAS (Térmica 80mm) ═══ */}
      {showThermalReport && (
        <ThermalTicket
          order={{
            id: "rep-01",
            type: "salón",
            floor: 1,
            tableNumber: "REPORTE",
            status: "served",
            items: [],
            total: totalPeriodSales,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          ticketType="reporte_ventas"
          salesReportData={{
            date: format(new Date(), "dd/MM/yyyy"),
            time: format(new Date(), "hh:mm a"),
            orders: relevantSales.map(s => ({
              id: s.id.slice(-6),
              table: s.tableNumber || "Caja",
              waiter: s.waiterName || "Mesero",
              guests: 4,
              total: s.total
            })),
            totalSales: totalPeriodSales,
            totalOrders: relevantSales.length,
            totalGuests: relevantSales.length * 4
          }}
          onClose={() => setShowThermalReport(false)}
        />
      )}

      {/* ── MODAL VER / RE-IMPRIMIR TICKET DE VENTA SELECCIONADA ── */}
      {selectedSaleToPrint && (
        <ThermalTicket
          order={{
            id: selectedSaleToPrint.id || 'sale-tk',
            type: selectedSaleToPrint.tableNumber?.startsWith('D-') ? 'delivery' : 'salón',
            floor: 1,
            tableNumber: selectedSaleToPrint.tableNumber || 'Directa',
            status: 'paid',
            items: selectedSaleToPrint.items || [],
            total: selectedSaleToPrint.total || 0,
            waiterName: selectedSaleToPrint.waiterName || 'Caja',
            createdAt: selectedSaleToPrint.date || new Date().toISOString(),
            updatedAt: selectedSaleToPrint.date || new Date().toISOString(),
          }}
          settings={settings}
          ticketType="boleta_venta"
          paymentMethod={selectedSaleToPrint.paymentMethod || 'Efectivo'}
          onClose={() => setSelectedSaleToPrint(null)}
        />
      )}

    </div>
  );
}
