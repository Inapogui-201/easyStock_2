import { useState, useEffect, useCallback } from "react";
import { stockService } from "../services/stockService.js";
import Modal from "../components/Modal.jsx";
import { Plus, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

export default function StocksPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState(null);

  const [restockOpen, setRestockOpen] = useState(false);
  const [restockId, setRestockId] = useState("");
  const [restockQty, setRestockQty] = useState("");

  // Charger les stocks depuis l'API
  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stockService.getAll();
      setProducts(response.data || []);
      setStats(response.stats || null);
    } catch (error) {
      toast.error("Erreur de chargement des stocks");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const lowStock = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 5),
  );

  const handleRestock = async () => {
    const qty = parseInt(restockQty);
    if (!qty || qty <= 0) {
      toast.error("Quantité invalide");
      return;
    }
    try {
      await stockService.restock(restockId, qty);
      toast.success(`+${qty} unités ajoutées`);
      await fetchStocks(); // Rafraîchir les données
      setRestockOpen(false);
      setRestockQty("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur de réapprovisionnement",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Stocks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Chargement..."
              : `Suivi en temps réel de vos inventaires`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64"
          />
        </div>
      </div>

      {/* ── Low Stock Alert ─────────────────────── */}
      {lowStock.length > 0 && (
        <div className="bg-white border-l-4 border-red-500 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={20} color="#ef4444" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {lowStock.length} produit(s) en stock bas
              </h2>
              <p className="text-sm text-gray-500">
                Ces produits nécessitent un réapprovisionnement urgent
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <button
                key={p.id || p._id}
                onClick={() => {
                  setRestockId(p.id || p._id);
                  setRestockOpen(true);
                }}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors border border-red-200"
              >
                {p.name}: {p.stock} restants
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stock Cards Grid ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 mt-4">Chargement...</span>
          </div>
        )}
        {!loading &&
          filtered.map((p) => {
            const isLow = p.stock <= (p.lowStockThreshold || 5);
            const stockPercentage = Math.min(
              (p.stock / ((p.lowStockThreshold || 5) * 4)) * 100,
              100,
            );

            return (
              <div
                key={p.id || p._id}
                className={`
                relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-5
                ${isLow ? "border-l-4 border-red-500" : "border border-gray-200"}
              `}
              >
                {/* Header avec Image */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {p.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{p.category}</p>
                    </div>
                  </div>
                  {isLow && (
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                  )}
                </div>

                {/* Stock Info */}
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {p.stock}
                    </p>
                    <p className="text-sm text-gray-500">
                      Seuil : {p.lowStockThreshold || 5}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRestockId(p.id || p._id);
                      setRestockOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-3 w-3" />
                    Entrée
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Niveau de stock</span>
                    <span>{Math.round(stockPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isLow ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* ── Restock Modal ─────────────────────────── */}
      <Modal
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
        title="Entrée de stock"
        maxWidth="max-w-sm"
      >
        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Produit sélectionné</p>
            <p className="font-semibold text-gray-900">
              {products.find((p) => (p.id || p._id) === restockId)?.name ||
                "Chargement..."}
            </p>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quantité à ajouter
            </label>
            <input
              type="number"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="Ex: 10"
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleRestock}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Confirmer l'entrée
          </button>
        </div>
      </Modal>
    </div>
  );
}
