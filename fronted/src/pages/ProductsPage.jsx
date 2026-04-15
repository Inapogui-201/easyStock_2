import { useState, useMemo, useEffect, useCallback } from "react";
import { productService } from "../services/productService.js";
import Modal from "../components/Modal.jsx";
import ImageUpload from "../components/ImageUpload.jsx";
import { Plus, Edit, Trash2, ArrowUpDown, Search } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Électronique",
  "Informatique",
  "Audio",
  "Accessoires",
  "Test",
];

export default function ProductsPage() {
  // State pour les produits de l'API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const perPage = 8;

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Électronique",
    stock: "",
    lowStockThreshold: "5",
    image: "", // URL de l'image Cloudinary
  });

  // Charger les produits depuis l'API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      toast.error("Erreur de chargement des produits");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchCat = filterCat === "all" || p.category === filterCat;
      return matchSearch && matchCat;
    });
    list.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * mul;
      if (sortField === "createdAt") {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        // Pour desc (récent d'abord): dateB - dateA
        // Pour asc (ancien d'abord): dateA - dateB
        return sortDir === "desc" ? dateB - dateA : dateA - dateB;
      }
      return (a[sortField] - b[sortField]) * mul;
    });
    return list;
  }, [products, searchQuery, filterCat, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      category: "Électronique",
      stock: "",
      lowStockThreshold: "5",
      image: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      category: p.category,
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold || 5),
      image: p.image,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      stock: parseInt(form.stock),
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
      image: form.image,
    };
    try {
      if (editing) {
        await productService.update(editing._id, data);
        toast.success("Produit mis à jour");
      } else {
        await productService.create(data);
        toast.success("Produit ajouté");
      }
      await fetchProducts();
      setPage(1); // Revenir à la première page pour voir le nouveau produit
      setDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de sauvegarde");
    }
  };

  const handleDelete = async (id) => {
    try {
      await productService.delete(id);
      toast.success("Produit supprimé");
      await fetchProducts();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de suppression");
    }
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* ── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Chargement..."
              : `${products.length} produits au catalogue`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </button>
      </div>

      {/* ── Filters ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-64"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => {
            setFilterCat(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Image
                </th>
                <th
                  className="text-left p-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSort("name")}
                >
                  <span className="flex items-center gap-2">
                    Produit <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </span>
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Catégorie
                </th>
                <th
                  className="text-right p-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSort("price")}
                >
                  <span className="flex items-center justify-end gap-2">
                    Prix <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </span>
                </th>
                <th
                  className="text-right p-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSort("stock")}
                >
                  <span className="flex items-center justify-end gap-2">
                    Stock <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </span>
                </th>
                <th
                  className="text-right p-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSort("createdAt")}
                >
                  <span className="flex items-center justify-end gap-2">
                    Date <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  </span>
                </th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                      {p.description}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 text-right font-semibold text-gray-900">
                    {p.price.toLocaleString("fr-FR")} DH
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.stock <= (p.lowStockThreshold || 5)
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-gray-600">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("fr-FR")
                      : "-"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <Edit className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-600 transition-colors" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Plus className="h-8 w-8 text-gray-300" />
                      <span>Aucun produit trouvé</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500 px-3">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Modifier le produit" : "Ajouter un produit"}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ex: MacBook Pro 16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="1299.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alerte stock
              </label>
              <input
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm({ ...form, lowStockThreshold: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="5"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Description détaillée du produit..."
            />
          </div>

          {/* Champ Image du produit - à la fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image du produit
            </label>
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              className="max-w-md"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setDialogOpen(false)}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editing ? "Mettre à jour" : "Ajouter"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-900">
              Êtes-vous sûr de vouloir supprimer{" "}
              <strong className="text-red-600">{deleteConfirm?.name}</strong> ?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Cette action est irréversible.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm._id)}
              className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
