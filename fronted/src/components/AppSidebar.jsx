import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  History,
  LogOut,
  Search,
} from "lucide-react";
import { useStore } from "../store/useStore.js";
import { authService } from "../services/authService.js";
import { toast } from "sonner";

const NAV_SECTIONS = [
  {
    label: "Navigation",
    items: [
      { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { to: "/products", label: "Produits", icon: Package },
      { to: "/stocks", label: "Stocks", icon: Warehouse },
    ],
  },
  {
    label: "Ventes",
    items: [
      { to: "/sales", label: "Nouvelle vente", icon: ShoppingCart },
      { to: "/history", label: "Historique ventes", icon: History },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, searchQuery, setSearchQuery } = useStore();

  const handleLogout = () => {
    authService.logout();
    toast.success("Déconnexion réussie");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 z-30 flex flex-col bg-white border-r border-gray-200">
      {/* ── Header ─────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shadow-sm">
            <Package className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">
              <span className="text-blue-600">Easy</span>Stock
            </span>
            <p className="text-xs text-gray-500 font-medium">
              Gestion de stock IT
            </p>
          </div>
        </div>
      </div>

      {/* ── Search ─────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* ── Navigation ─────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map(({ label, items }) => (
          <div key={label}>
            <p className="px-3 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {label}
            </p>
            <div className="space-y-1">
              {items.map(({ to, label: itemLabel, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${
                        active
                          ? "bg-blue-50 text-blue-600 shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? "text-blue-600" : "text-gray-400"
                      }`}
                      strokeWidth={2}
                    />
                    <span
                      className={`
                        text-sm font-medium transition-colors
                        ${
                          active
                            ? "text-blue-600 font-semibold"
                            : "text-gray-600"
                        }
                      `}
                    >
                      {itemLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-100 p-4 space-y-3">
        {/* User card */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shadow-sm">
            <span className="text-sm font-bold text-white">AD</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              Administrateur
            </p>
            <p className="text-xs text-gray-500">easystock@gmail.com</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
