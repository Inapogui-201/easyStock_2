import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboardService.js";
import { Package, TrendingUp, AlertTriangle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

/* ── KPI config ──────────────────────────────────────────── */
const buildKpis = (stats) => [
  {
    label: "Stock total",
    value: stats.totalStock.toLocaleString("fr-FR"),
    sub: "unités en inventaire",
    icon: Package,
    iconStyle: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
    },
  },
  {
    label: "Chiffre d'affaires",
    value: `${stats.totalRevenue.toLocaleString("fr-FR")} DH`,
    sub: "cumulé sur la période",
    icon: TrendingUp,
    iconStyle: {
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      color: "white",
    },
  },
  {
    label: "Ventes",
    value: stats.totalSales.toLocaleString("fr-FR"),
    sub: "transactions réalisées",
    icon: ShoppingCart,
    iconStyle: {
      background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      color: "white",
    },
  },
  {
    label: "Alertes stock",
    value: stats.lowStock.length,
    sub: `produit${stats.lowStock.length !== 1 ? "s" : ""} sous le seuil`,
    icon: AlertTriangle,
    iconStyle: {
      background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      color: "white",
    },
    isAlert: stats.lowStock.length > 0,
  },
];

/* ── Custom Tooltip ──────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-900 font-medium mb-1">{label}</p>
      <p className="text-gray-600">
        {payload[0].value.toLocaleString("fr-FR")} DH
      </p>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les données du dashboard depuis l'API
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      toast.error("Erreur de chargement du dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Recharger quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchDashboard]);

  // Fallback si données non disponibles
  const stats = dashboardData || {
    stats: {
      totalStock: 0,
      totalSales: 0,
      revenueThisMonth: 0,
      revenueThisYear: 0,
    },
    lowStockProducts: [],
    topProducts: [],
    chartData: [],
  };

  // Formater les données pour les graphiques
  const monthlyRevenue = (dashboardData?.chartData || []).map((d) => ({
    month: d.day || d.date,
    total: d.total,
  }));

  const topProducts = (dashboardData?.topProducts || []).map((p) => ({
    name: p.name,
    revenue: p.revenue,
  }));

  const totalRevenue = dashboardData?.stats?.revenueThisMonth || 0;
  const totalStock = dashboardData?.stats?.totalStock || 0;
  const totalSales = dashboardData?.stats?.totalSales || 0;
  const lowStock = dashboardData?.lowStockProducts || [];

  const kpis = buildKpis({
    totalStock,
    lowStock,
    totalRevenue,
    totalSales,
  });

  /* current month label */
  const monthLabel = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        <span className="text-sm text-gray-600 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
          {monthLabel}
        </span>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, iconStyle, isAlert }) => (
          <div
            key={label}
            className={`
              relative bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all
              ${
                isAlert
                  ? "border-l-4 border-red-600"
                  : "border border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              {label}
            </p>
            <p
              className={`
              text-2xl font-bold leading-none
              ${isAlert ? "text-red-600" : "text-gray-900"}
            `}
            >
              {value}
            </p>
            <p className="text-xs text-gray-500 mt-2">{sub}</p>

            {/* icon */}
            <span className="absolute right-4 top-4 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-gray-100">
              <Icon size={18} color="#6B7280" strokeWidth={2} />
            </span>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 mt-4">Chargement...</span>
        </div>
      )}

      {/* ── Charts ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Chiffre d'affaires (7 derniers jours)
            </h3>
            <p className="text-sm text-gray-500">Évolution sur la période</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyRevenue}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}kDH`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                  activeDot={{ r: 6, fill: "#8b5cf6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top 5 produits
            </h3>
            <p className="text-sm text-gray-500">
              Par chiffre d'affaires généré
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                barSize={20}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}kDH`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Low-stock Alerts ───────────────────────────────── */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-white border-l-4 border-red-500 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={20} color="#ef4444" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Alertes de stock bas
              </h3>
              <p className="text-sm text-gray-500">
                {lowStock.length} produit
                {lowStock.length > 1 ? "s" : ""} sous le seuil minimal
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {lowStock.map((p) => (
              <div
                key={p.id || p._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-900">
                  {p.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">
                    Seuil :{" "}
                    <span className="font-medium text-gray-700">
                      {p.threshold || p.lowStockThreshold || 5}
                    </span>
                  </span>
                  <span className="text-sm font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">
                    {p.stock} en stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
