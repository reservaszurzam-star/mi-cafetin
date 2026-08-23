import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../hooks/StoreContext';
import { 
  Trophy, Flame, TrendingUp, DollarSign, Download, FileDown, 
  Search, Filter, Utensils, Star, Award, ChevronRight, BarChart2,
  PieChart as PieIcon, RefreshCw, Layers, CheckCircle2, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell 
} from 'recharts';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ViewState } from '../../App';
import { cn } from '../../lib/utils';
import { Product } from '../../types';

interface DishRankingViewProps {
  onNavigate?: (view: ViewState) => void;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

interface RankedDish {
  id: string;
  name: string;
  category: string;
  price: number;
  quantitySold: number;
  totalRevenue: number;
  percentOfTotal: number;
  classification: 'estrella' | 'volumen' | 'rentable' | 'baja_salida';
  demandLevel: '🔥 Muy Alta' | '⭐ Alta' | '⚡ Media' | '💤 Baja';
  isAvailable: boolean;
}

export default function DishRankingView({ onNavigate }: DishRankingViewProps) {
  const { products, sales, orders, settings } = useAppStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // 1. Obtener categorías de la carta
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return ['all', ...cats];
  }, [products]);

  // 2. Filtrar ventas y comandas según el rango de tiempo
  const filteredSalesData = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    if (timeRange === 'today') {
      startDate = startOfDay(now);
    } else if (timeRange === 'week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
    } else if (timeRange === 'month') {
      startDate = startOfMonth(now);
    }

    // Unir items de 'sales' históricas y 'orders' pagadas/atendidas
    const itemsFromSales = sales
      .filter(s => !startDate || new Date(s.date) >= startDate)
      .flatMap(s => s.items || []);

    const itemsFromOrders = orders
      .filter(o => o.status === 'served' || o.status === 'paid')
      .filter(o => !startDate || new Date(o.createdAt) >= startDate)
      .flatMap(o => o.items || []);

    return [...itemsFromSales, ...itemsFromOrders];
  }, [sales, orders, timeRange]);

  // 3. Consolidar ranking por cada plato
  const { rankedDishes, totalDishesSold, totalDishRevenue } = useMemo(() => {
    const dishMap: Record<string, { name: string; quantity: number; revenue: number; category: string; price: number; isAvailable: boolean }> = {};

    // Mapeo inicial de todos los platos registrados en la carta
    products.forEach(p => {
      dishMap[p.name.trim().toLowerCase()] = {
        name: p.name,
        quantity: 0,
        revenue: 0,
        category: p.category || 'Otros',
        price: p.price || 0,
        isAvailable: p.isAvailable !== false,
      };
    });

    let totalSold = 0;
    let totalRev = 0;

    filteredSalesData.forEach(item => {
      const key = (item.productName || '').trim().toLowerCase();
      const qty = item.quantity || 1;
      const price = item.price || 0;
      const rev = price * qty;

      if (!dishMap[key]) {
        dishMap[key] = {
          name: item.productName || 'Plato Desconocido',
          quantity: 0,
          revenue: 0,
          category: 'Otros',
          price: price,
          isAvailable: true,
        };
      }

      dishMap[key].quantity += qty;
      dishMap[key].revenue += rev;
      totalSold += qty;
      totalRev += rev;
    });

    const list: RankedDish[] = Object.entries(dishMap).map(([_, data], idx) => {
      const pct = totalSold > 0 ? (data.quantity / totalSold) * 100 : 0;
      
      // Clasificación de demanda
      let demand: RankedDish['demandLevel'] = '💤 Baja';
      if (pct >= 10 || data.quantity >= 20) demand = '🔥 Muy Alta';
      else if (pct >= 5 || data.quantity >= 10) demand = '⭐ Alta';
      else if (pct >= 1 || data.quantity >= 3) demand = '⚡ Media';

      // Matriz de Ingeniería de Menú
      let classification: RankedDish['classification'] = 'baja_salida';
      if (pct >= 6 && data.price >= 25) classification = 'estrella';
      else if (pct >= 6) classification = 'volumen';
      else if (data.price >= 25 && data.quantity > 0) classification = 'rentable';

      return {
        id: `dish-${idx}`,
        name: data.name,
        category: data.category,
        price: data.price,
        quantitySold: data.quantity,
        totalRevenue: data.revenue,
        percentOfTotal: Number(pct.toFixed(1)),
        classification,
        demandLevel: demand,
        isAvailable: data.isAvailable,
      };
    });

    // Ordenar de mayor a menor cantidad vendida
    list.sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) {
        return b.quantitySold - a.quantitySold;
      }
      return b.totalRevenue - a.totalRevenue;
    });

    return {
      rankedDishes: list,
      totalDishesSold: totalSold,
      totalDishRevenue: totalRev,
    };
  }, [products, filteredSalesData]);

  // 4. Filtrado para la tabla por búsqueda y categoría
  const displayedDishes = useMemo(() => {
    return rankedDishes.filter(d => {
      const matchCat = selectedCategory === 'all' || d.category === selectedCategory;
      const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [rankedDishes, selectedCategory, searchQuery]);

  // Top 3 del Podio
  const top1 = rankedDishes[0];
  const top2 = rankedDishes[1];
  const top3 = rankedDishes[2];

  // Top 10 para el Gráfico
  const topChartData = useMemo(() => {
    return rankedDishes.slice(0, 10).map(d => ({
      name: d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name,
      Vendidos: d.quantitySold,
      Recaudacion: d.totalRevenue,
      fullName: d.name,
    }));
  }, [rankedDishes]);

  // Plato más rentable
  const highestRevenueDish = useMemo(() => {
    if (rankedDishes.length === 0) return null;
    return [...rankedDishes].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  }, [rankedDishes]);

  // Categoría líder
  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    rankedDishes.forEach(d => {
      map[d.category] = (map[d.category] || 0) + d.quantitySold;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : { name: 'General', count: 0 };
  }, [rankedDishes]);

  // ── Exportar a Excel / CSV ──
  const handleExportCSV = () => {
    const headers = ["Posicion", "Plato", "Categoria", "Precio Unitario (S/)", "Unidades Vendidas", "% de Participacion", "Total Recaudado (S/)", "Demanda"];
    const rows = displayedDishes.map((d, i) => [
      i + 1,
      `"${d.name}"`,
      `"${d.category}"`,
      d.price.toFixed(2),
      d.quantitySold,
      `${d.percentOfTotal}%`,
      d.totalRevenue.toFixed(2),
      `"${d.demandLevel}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ranking_Platos_${settings.companyName.replace(/\s+/g, '_')}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Exportar a PDF ──
  const handleExportPDF = () => {
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`RANKING OFICIAL DE PLATOS — ${settings.companyName.toUpperCase()}`, 14, 18);
      doc.setFontSize(10);
      doc.text(`Periodo analizado: ${timeRange.toUpperCase()} | Fecha: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 25);
      doc.text(`Total Platos Vendidos: ${totalDishesSold} unidades | Recaudación Platos: ${settings.currency} ${totalDishRevenue.toFixed(2)}`, 14, 31);

      const tableRows = displayedDishes.map((d, i) => [
        `#${i + 1}`,
        d.name,
        d.category,
        `${settings.currency} ${d.price.toFixed(2)}`,
        `${d.quantitySold} un.`,
        `${d.percentOfTotal}%`,
        `${settings.currency} ${d.totalRevenue.toFixed(2)}`,
      ]);

      autoTable(doc, {
        head: [['Puesto', 'Plato / Producto', 'Categoría', 'Precio', 'Cant. Vendida', '% Salida', 'Recaudación']],
        body: tableRows,
        startY: 37,
        theme: 'striped',
        headStyles: { fillColor: [217, 119, 6] },
        styles: { fontSize: 9 },
      });

      doc.save(`Ranking_Platos_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── ENCABEZADO SUPERIOR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              Ingeniería de Menú & Popularidad
            </span>
            <span className="text-xs text-stone-400 font-bold">· {settings.companyName}</span>
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-500" />
            Ranking Oficial de Platos Más Vendidos
          </h2>
          <p className="text-xs font-semibold text-stone-500 mt-0.5">
            Descubre los platos favoritos de tus clientes, rentabilidad y demanda en tiempo real
          </p>
        </div>

        {/* Acciones de Filtro y Exportación */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Tiempo */}
          <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-black">
            <button
              onClick={() => setTimeRange('today')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition",
                timeRange === 'today' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              Hoy
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition",
                timeRange === 'week' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition",
                timeRange === 'month' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              Este Mes
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={cn(
                "px-3 py-1.5 rounded-xl transition",
                timeRange === 'all' ? "bg-stone-900 text-white shadow-sm" : "text-stone-600 hover:text-stone-900"
              )}
            >
              Histórico
            </button>
          </div>

          {/* Botones de Descarga */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExportingPdf ? "Generando..." : "Descargar PDF"}</span>
          </button>
        </div>
      </div>

      {/* ── 4 TARJETAS KPIS PRINCIPALES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Top 1 Plato Más Pedido */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 bg-black/20 px-2 py-0.5 rounded-full">
              👑 Plato #1 Más Vendido
            </span>
            <Flame className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>
          <div className="mt-3">
            <h3 className="font-black text-lg leading-tight line-clamp-2">{top1?.name || "Sin registro"}</h3>
            <p className="text-xs text-amber-100 mt-1 font-semibold">{top1?.category || "Carta"}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
            <span className="font-black text-2xl">{top1?.quantitySold || 0} <span className="text-xs font-bold text-amber-200">pedidos</span></span>
            <span className="font-mono font-black text-sm text-amber-100">{settings.currency} {top1?.totalRevenue.toFixed(2) || "0.00"}</span>
          </div>
        </div>

        {/* Mayor Recaudación */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              💰 Mayor Recaudación
            </span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <h3 className="font-black text-base text-stone-900 leading-tight line-clamp-2">{highestRevenueDish?.name || "Sin registro"}</h3>
            <p className="text-xs text-stone-500 font-semibold mt-1">Precio: {settings.currency} {highestRevenueDish?.price.toFixed(2)}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="font-mono font-black text-2xl text-emerald-700">{settings.currency} {highestRevenueDish?.totalRevenue.toFixed(2) || "0.00"}</span>
            <span className="text-xs font-bold text-stone-400">{highestRevenueDish?.quantitySold || 0} platos</span>
          </div>
        </div>

        {/* Total Platos Vendidos */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              🍽️ Platos Despachados
            </span>
            <Utensils className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-stone-900">{totalDishesSold}</div>
            <p className="text-xs text-stone-500 font-semibold mt-1">Unidades totales servidas</p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Recaudación Global:</span>
            <span className="font-mono font-black text-sm text-stone-900">{settings.currency} {totalDishRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Categoría Más Popular */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
              📊 Categoría Líder
            </span>
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3">
            <h3 className="font-black text-xl text-purple-900 leading-tight">{topCategory.name}</h3>
            <p className="text-xs text-stone-500 font-semibold mt-1">Mayor preferencia en pedidos</p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">Volumen:</span>
            <span className="font-black text-sm text-purple-800">{topCategory.count} platos</span>
          </div>
        </div>

      </div>

      {/* ── PODIO TOP 3 VISUAL ── */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-2xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-stone-900">Podio de Honor (Top 3 Favoritos)</h3>
              <p className="text-xs text-stone-500 font-semibold">Los platos preferidos con mayor volumen de salida</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Top Selección
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          
          {/* #2 PUESTO (PLATA) */}
          <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-5 text-center flex flex-col justify-between min-h-[220px] relative order-2 md:order-1">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-stone-300 text-stone-800 font-black text-xs px-3 py-1 rounded-full border border-stone-400 shadow-xs flex items-center gap-1">
              🥈 Puesto #2
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">{top2?.category || "Carta"}</span>
              <h4 className="font-black text-base text-stone-900 mt-1 leading-snug">{top2?.name || "Sin datos"}</h4>
              <p className="text-xs font-bold text-stone-500 mt-1">{settings.currency} {top2?.price.toFixed(2)}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-stone-200 mt-4">
              <div className="text-2xl font-black text-stone-800">{top2?.quantitySold || 0} <span className="text-xs font-bold text-stone-400">pedidos</span></div>
              <div className="text-xs font-mono font-black text-stone-600 mt-0.5">{settings.currency} {top2?.totalRevenue.toFixed(2) || "0.00"}</div>
            </div>
          </div>

          {/* #1 PUESTO (ORO - MÁS GRANDE) */}
          <div className="bg-gradient-to-b from-amber-50 to-orange-50 border-2 border-amber-400 rounded-3xl p-6 text-center flex flex-col justify-between min-h-[260px] relative order-1 md:order-2 shadow-lg shadow-amber-500/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white font-black text-xs px-4 py-1.5 rounded-full border border-amber-300 shadow-md flex items-center gap-1.5">
              👑 🥇 Campeón #1
            </div>
            <div className="mt-4">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">{top1?.category || "Carta"}</span>
              <h4 className="font-black text-lg text-amber-950 mt-1 leading-tight">{top1?.name || "Sin datos"}</h4>
              <p className="text-xs font-black text-amber-700 mt-1">{settings.currency} {top1?.price.toFixed(2)}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-amber-200 mt-4 shadow-sm">
              <div className="text-3xl font-black text-amber-900">{top1?.quantitySold || 0} <span className="text-xs font-bold text-amber-700">pedidos</span></div>
              <div className="text-xs font-mono font-black text-amber-800 mt-0.5">Recaudación: {settings.currency} {top1?.totalRevenue.toFixed(2) || "0.00"}</div>
            </div>
          </div>

          {/* #3 PUESTO (BRONCE) */}
          <div className="bg-stone-50 border-2 border-stone-200 rounded-3xl p-5 text-center flex flex-col justify-between min-h-[200px] relative order-3">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-200 text-orange-900 font-black text-xs px-3 py-1 rounded-full border border-orange-300 shadow-xs flex items-center gap-1">
              🥉 Puesto #3
            </div>
            <div className="mt-3">
              <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider block">{top3?.category || "Carta"}</span>
              <h4 className="font-black text-base text-stone-900 mt-1 leading-snug">{top3?.name || "Sin datos"}</h4>
              <p className="text-xs font-bold text-stone-500 mt-1">{settings.currency} {top3?.price.toFixed(2)}</p>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-stone-200 mt-4">
              <div className="text-2xl font-black text-stone-800">{top3?.quantitySold || 0} <span className="text-xs font-bold text-stone-400">pedidos</span></div>
              <div className="text-xs font-mono font-black text-stone-600 mt-0.5">{settings.currency} {top3?.totalRevenue.toFixed(2) || "0.00"}</div>
            </div>
          </div>

        </div>
      </div>

      {/* ── GRÁFICO DE BARRAS TOP 10 ── */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-base text-stone-900">Top 10 Platos con Mayor Demanda</h3>
          </div>
          <span className="text-xs font-bold text-stone-400">Cantidad de unidades vendidas</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                angle={-20} 
                textAnchor="end" 
                interval={0}
                tick={{ fontSize: 11, fontWeight: 700, fill: '#4b5563' }}
              />
              <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: '#9ca3af' }} />
              <Tooltip 
                formatter={(val: number, name: string) => [
                  name === 'Vendidos' ? `${val} unidades` : `${settings.currency} ${val.toFixed(2)}`,
                  name === 'Vendidos' ? 'Cantidad Vendida' : 'Total Recaudado'
                ]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', fontWeight: 700 }}
              />
              <Bar dataKey="Vendidos" fill="#f59e0b" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {topChartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#d97706' : index === 1 ? '#f59e0b' : index === 2 ? '#fbbf24' : '#fb923c'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── TABLA COMPLETA DE RANKING ── */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        
        {/* Header y Filtros de la Tabla */}
        <div className="p-5 border-b border-stone-100 bg-stone-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-base text-stone-900">Tabla Detallada de Todos los Platos</h3>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">
              {displayedDishes.length} platos listados ordenados por ventas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar plato o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-stone-200 text-xs font-bold text-stone-900 rounded-xl pl-9 pr-3 py-1.5 outline-none focus:border-amber-500 transition w-48 sm:w-60"
              />
            </div>

            {/* Selector de Categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Todas las Categorías ({categories.length - 1})</option>
              {categories.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contenido Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/90 text-[10px] font-black text-stone-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-16">Puesto</th>
                <th className="py-3 px-4">Plato / Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Precio Unit.</th>
                <th className="py-3 px-4 text-center">Cant. Vendida</th>
                <th className="py-3 px-4 text-center">% Salida</th>
                <th className="py-3 px-4 text-right">Recaudación</th>
                <th className="py-3 px-4 text-center">Nivel Demanda</th>
                <th className="py-3 px-4 text-center">Clasificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs font-semibold text-stone-700">
              {displayedDishes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-stone-400 font-bold">
                    No se encontraron platos en este periodo o filtro seleccionado.
                  </td>
                </tr>
              ) : (
                displayedDishes.map((dish, idx) => {
                  const rankNumber = idx + 1;
                  const isTop1 = rankNumber === 1;
                  const isTop2 = rankNumber === 2;
                  const isTop3 = rankNumber === 3;

                  return (
                    <tr key={dish.id} className="hover:bg-amber-50/30 transition">
                      
                      {/* Puesto */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="w-7 h-7 rounded-full bg-stone-300 text-stone-900 font-black text-xs inline-flex items-center justify-center shadow-xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="w-7 h-7 rounded-full bg-orange-200 text-orange-950 font-black text-xs inline-flex items-center justify-center shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-stone-400">
                            #{rankNumber}
                          </span>
                        )}
                      </td>

                      {/* Nombre */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-stone-900 text-xs block">{dish.name}</span>
                        {!dish.isAvailable && (
                          <span className="text-[9px] font-bold text-rose-500">· Agotado / Inactivo</span>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                          {dish.category}
                        </span>
                      </td>

                      {/* Precio */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-800">
                        {settings.currency} {dish.price.toFixed(2)}
                      </td>

                      {/* Cantidad Vendida */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-black",
                          dish.quantitySold > 0 ? "bg-amber-50 text-amber-900 border border-amber-200" : "text-stone-400"
                        )}>
                          {dish.quantitySold} un.
                        </span>
                      </td>

                      {/* Porcentaje */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full" 
                              style={{ width: `${Math.min(dish.percentOfTotal * 3, 100)}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-bold text-stone-600">{dish.percentOfTotal}%</span>
                        </div>
                      </td>

                      {/* Recaudación Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-stone-900">
                        {settings.currency} {dish.totalRevenue.toFixed(2)}
                      </td>

                      {/* Demanda */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          dish.demandLevel.includes('Muy Alta') ? "bg-rose-50 text-rose-800 border-rose-200 font-black" :
                          dish.demandLevel.includes('Alta') ? "bg-amber-50 text-amber-800 border-amber-200" :
                          dish.demandLevel.includes('Media') ? "bg-blue-50 text-blue-800 border-blue-200" :
                          "bg-stone-100 text-stone-500 border-stone-200"
                        )}>
                          {dish.demandLevel}
                        </span>
                      </td>

                      {/* Clasificación Matriz */}
                      <td className="py-3.5 px-4 text-center">
                        {dish.classification === 'estrella' && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            ⭐ Estrella
                          </span>
                        )}
                        {dish.classification === 'volumen' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            📦 Alto Volumen
                          </span>
                        )}
                        {dish.classification === 'rentable' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            💎 Alta Ganancia
                          </span>
                        )}
                        {dish.classification === 'baja_salida' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-500">
                            💡 Promocionar
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
