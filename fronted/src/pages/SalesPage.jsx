import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService.js";
import { saleService } from "../services/saleService.js";
import { ShoppingCart, Plus, Minus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export default function SalesPage() {
  // State pour produits de l'API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State pour le panier local
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState("1");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Charger les produits
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      toast.error("Erreur de chargement des produits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const cartTotal = cart.reduce(
    (s, item) => s + item.product.price * item.quantity,
    0,
  );

  // Ajouter au panier
  const addToCart = (product, quantity) => {
    const productId = product._id || product.id;
    setCart((prev) => {
      const existing = prev.find(
        (item) => (item.product._id || item.product.id) === productId,
      );
      if (existing) {
        return prev.map((item) =>
          (item.product._id || item.product.id) === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  // Mettre à jour quantité
  const updateCartQty = (productId, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        (item.product._id || item.product.id) === productId
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  // Retirer du panier
  const removeFromCart = (productId) => {
    setCart((prev) =>
      prev.filter(
        (item) => (item.product._id || item.product.id) !== productId,
      ),
    );
  };

  const handleAddToCart = () => {
    const product = products.find(
      (p) => p.id === selectedProduct || p._id === selectedProduct,
    );
    if (!product) {
      toast.error("Sélectionnez un produit");
      return;
    }
    const q = parseInt(qty) || 1;
    if (q > product.stock) {
      toast.error(`Stock insuffisant (${product.stock} dispo)`);
      return;
    }
    addToCart(product, q);
    toast.success(`${product.name} ajouté au panier`);
    setSelectedProduct("");
    setQty("1");
  };

  const handleValidateSale = async () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Nom du client requis");
      return;
    }

    try {
      const saleData = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        items: cart.map((item) => ({
          productId: item.product.id || item.product._id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      };

      const response = await saleService.create(saleData);

      if (response.success) {
        toast.success("Vente enregistrée !");
        // Afficher les alertes stock bas
        if (response.alerts && response.alerts.length > 0) {
          response.alerts.forEach((alert) =>
            toast.warning(alert, { duration: 5000 }),
          );
        }
        // Vider le panier et réinitialiser
        setCart([]);
        setClientName("");
        setClientPhone("");
        // Rafraîchir les produits pour voir les stocks mis à jour
        await fetchProducts();
      } else {
        toast.error(response.message || "Erreur lors de la vente");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur de connexion");
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500";

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* ── Header ─────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle Vente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Créez une vente et le stock se met à jour automatiquement
        </p>
      </div>

      {/* ── Main Content ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ── Add Product Section ─────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ajouter des produits
            </h2>
            <div className="flex gap-3">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className={`${inputClass} flex-1`}
              >
                <option value="">Choisir un produit...</option>
                {loading ? (
                  <option>Chargement...</option>
                ) : (
                  products
                    .filter((p) => p.stock > 0)
                    .map((p) => (
                      <option key={p.id || p._id} value={p.id || p._id}>
                        {p.name} — {p.price}DH (stock: {p.stock})
                      </option>
                    ))
                )}
              </select>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-20 px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddToCart}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Cart Section ─────────────────────────── */}
          {cart.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5" />
                Panier ({cart.length} article{cart.length > 1 ? "s" : ""})
              </h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id || item.product._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.product.price} DH / unité
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateCartQty(
                              item.product.id || item.product._id,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-3 w-3 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (item.quantity < item.product.stock)
                              updateCartQty(
                                item.product.id || item.product._id,
                                item.quantity + 1,
                              );
                            else toast.error("Stock max atteint");
                          }}
                          className="p-1.5 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                      <span className="w-20 text-right font-semibold text-gray-900">
                        {(item.product.price * item.quantity).toLocaleString(
                          "fr-FR",
                        )}{" "}
                        DH
                      </span>
                      <button
                        onClick={() =>
                          removeFromCart(item.product.id || item.product._id)
                        }
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Summary Sidebar ─────────────────────── */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Récapitulatif
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nom du client *
                </label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Mamadou Diallo"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="620000000"
                  className={inputClass}
                />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total TTC</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {cartTotal.toLocaleString("fr-FR")} DH
                  </span>
                </div>
              </div>
              <button
                onClick={handleValidateSale}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Check className="h-4 w-4" />
                Valider la vente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
