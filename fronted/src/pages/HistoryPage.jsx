import { useState, useMemo, useEffect, useCallback } from "react";
import { saleService } from "../services/saleService.js";
import Modal from "../components/Modal.jsx";
import { Download, Eye, FileText, Search } from "lucide-react";
import { toast } from "sonner";

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailSale, setDetailSale] = useState(null);
  const [filterDate, setFilterDate] = useState("");

  // Charger les ventes depuis l'API
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await saleService.getAll();
      setSales(response.data || []);
    } catch (error) {
      toast.error("Erreur de chargement des ventes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const filtered = useMemo(() => {
    return sales
      .filter((s) => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || s.clientName.toLowerCase().includes(q);
        const matchDate = !filterDate || s.date.startsWith(filterDate);
        return matchSearch && matchDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchQuery, filterDate]);

  const selectedSale = sales.find(
    (s) => s.id === detailSale || s._id === detailSale,
  );

  const exportCSV = () => {
    const header = "Date,Client,Téléphone,Produits,Total\n";
    const rows = filtered
      .map((s) => {
        const prods = s.items
          .map((i) => `${i.productName}x${i.quantity}`)
          .join(" | ");
        return `${new Date(s.date).toLocaleDateString("fr-FR")},${s.clientName},${s.clientPhone},"${prods}",${s.total}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ventes_easystock.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("EasyStock - Historique des Ventes", 14, 22);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["Date", "Client", "Produits", "Total (DH)"]],
      body: filtered.map((s) => [
        new Date(s.date).toLocaleDateString("fr-FR"),
        s.clientName,
        s.items.map((i) => `${i.productName} x${i.quantity}`).join(", "),
        s.total.toLocaleString("fr-FR"),
      ]),
    });

    doc.save("ventes_easystock.pdf");
    toast.success("Export PDF téléchargé");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historique des Ventes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Chargement..."
              : `${sales.length} vente(s) enregistrée(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────── */}
      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64"
          />
        </div>
        <div className="relative">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Client
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Produits
                </th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">
                  Total
                </th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id || s._id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 text-sm text-gray-900">
                    {new Date(s.date).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-950">
                      {s.clientName}
                    </p>
                    <p className="text-xs text-gray-500">{s.clientPhone}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {s.items.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          {item.productName} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold text-gray-900">
                    {s.total.toLocaleString("fr-FR")} DH
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setDetailSale(s.id || s._id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <Eye className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <span>Aucune vente trouvée</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ─────────────────────────────── */}
      <Modal
        open={!!detailSale}
        onClose={() => setDetailSale(null)}
        title="Détails de la vente"
        maxWidth="max-w-md"
      >
        {selectedSale && (
          <div className="space-y-4">
            {/* Header Info */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500">ID: #{selectedSale.id}</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(selectedSale.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Client
              </h3>
              <p className="font-medium text-gray-900">
                {selectedSale.clientName}
              </p>
              <p className="text-sm text-gray-500">
                {selectedSale.clientPhone || "Non renseigné"}
              </p>
            </div>

            {/* Products List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Produits ({selectedSale.items.length})
              </h3>
              <div className="space-y-2">
                {selectedSale.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qté: {item.quantity} ×{" "}
                        {item.unitPrice.toLocaleString("fr-FR")} DH
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {(item.unitPrice * item.quantity).toLocaleString("fr-FR")}{" "}
                      DH
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Section */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total TTC</span>
                <span className="text-lg font-bold text-blue-600">
                  {selectedSale.total.toLocaleString("fr-FR")} DH
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
