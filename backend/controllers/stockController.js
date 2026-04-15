const Product = require("../models/Product.js");

/**
 * Controller pour la gestion des stocks
 */
class StockController {
  /**
   * Récupérer tous les stocks
   * @route GET /api/stock
   */
  static async getAllStock(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        lowStock = false,
        sortBy = "name",
        sortOrder = "asc",
      } = req.query;

      // Construire le filtre - uniquement les produits actifs
      const filter = { isActive: { $ne: false } };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ];
      }
      if (category) {
        filter.category = category;
      }
      if (lowStock === "true") {
        filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
      }

      // Construire le tri
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Pagination
      const skip = (page - 1) * limit;

      const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(filter);

      // Calculer les statistiques (uniquement les produits actifs)
      const stats = await Product.aggregate([
        { $match: { isActive: { $ne: false } } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stock" },
            totalProducts: { $sum: 1 },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ["$stock", "$lowStockThreshold"] }, 1, 0],
              },
            },
            totalValue: { $sum: { $multiply: ["$stock", "$price"] } },
          },
        },
      ]);

      res.json({
        success: true,
        data: products,
        stats: stats[0] || {
          totalStock: 0,
          totalProducts: 0,
          lowStockCount: 0,
          totalValue: 0,
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("GetAllStock error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des stocks",
      });
    }
  }

  /**
   * Récupérer un produit de stock par son ID
   * @route GET /api/stock/:id
   */
  static async getStockById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("GetStockById error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du stock",
      });
    }
  }

  /**
   * Réapprovisionner le stock
   * @route POST /api/stock/restock
   */
  static async restock(req, res, next) {
    try {
      const { productId, quantity } = req.body;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID du produit et quantité valides requis",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé",
        });
      }

      // Ajouter la quantité au stock
      product.stock += parseInt(quantity);
      await product.save();

      res.json({
        success: true,
        message: `Stock réapprovisionné avec succès. +${quantity} unités ajoutées.`,
        data: {
          productId: product._id,
          productName: product.name,
          newStock: product.stock,
          addedQuantity: quantity,
        },
      });
    } catch (error) {
      console.error("Restock error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du réapprovisionnement",
      });
    }
  }

  /**
   * Ajuster le stock (ajout ou retrait)
   * @route PUT /api/stock/:id/adjust
   */
  static async adjustStock(req, res, next) {
    try {
      const { quantity, reason } = req.body;

      if (!quantity || quantity === 0) {
        return res.status(400).json({
          success: false,
          message: "Quantité valide requise (positive ou négative)",
        });
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé",
        });
      }

      const newStock = product.stock + quantity;

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock insuffisant pour cette opération",
        });
      }

      // Ancienne valeur pour le retour
      const oldStock = product.stock;

      // Mettre à jour le stock
      product.stock = newStock;
      await product.save();

      res.json({
        success: true,
        message: "Stock ajusté avec succès",
        data: {
          productId: product._id,
          productName: product.name,
          oldStock,
          newStock,
          adjustment: quantity,
          reason: reason || "Ajustement manuel",
        },
      });
    } catch (error) {
      console.error("AdjustStock error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'ajustement du stock",
      });
    }
  }

  /**
   * Récupérer les alertes de stock bas
   * @route GET /api/stock/alerts
   */
  static async getStockAlerts(req, res, next) {
    try {
      const lowStockProducts = await Product.find({
        isActive: { $ne: false },
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }).sort({ stock: 1 });

      res.json({
        success: true,
        data: lowStockProducts,
        count: lowStockProducts.length,
      });
    } catch (error) {
      console.error("GetStockAlerts error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des alertes",
      });
    }
  }

  /**
   * Récupérer l'historique des mouvements de stock
   * @route GET /api/stock/movements
   */
  static async getStockMovements(req, res, next) {
    try {
      const products = await Product.find({ isActive: { $ne: false } }).select(
        "name stock lowStockThreshold lastRestock",
      );

      const movements = products.map((product) => ({
        productId: product._id,
        productName: product.name,
        currentStock: product.stock,
        lastRestock: product.lastRestock || new Date(),
        status: product.stock <= product.lowStockThreshold ? "low" : "normal",
      }));

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      console.error("GetStockMovements error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des mouvements",
      });
    }
  }

  /**
   * Mettre à jour le seuil de stock bas
   * @route PUT /api/stock/:id/threshold
   */
  static async updateThreshold(req, res, next) {
    try {
      const { lowStockThreshold } = req.body;

      if (!lowStockThreshold || lowStockThreshold < 0) {
        return res.status(400).json({
          success: false,
          message: "Seuil de stock valide requis",
        });
      }

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé",
        });
      }

      const oldThreshold = product.lowStockThreshold;
      product.lowStockThreshold = lowStockThreshold;
      await product.save();

      res.json({
        success: true,
        message: "Seuil de stock mis à jour avec succès",
        data: {
          productId: product._id,
          productName: product.name,
          oldThreshold,
          newThreshold: lowStockThreshold,
          isLowStock: product.stock <= lowStockThreshold,
        },
      });
    } catch (error) {
      console.error("UpdateThreshold error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du seuil",
      });
    }
  }
}

module.exports = StockController;
