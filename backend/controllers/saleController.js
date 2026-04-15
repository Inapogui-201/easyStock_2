const Sale = require("../models/Sale.js");
const Product = require("../models/Product.js");

/**
 * Controller pour la gestion des ventes
 */
class SaleController {
  /**
   * Récupérer toutes les ventes
   * @route GET /api/sales
   */
  static async getAllSales(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        startDate,
        endDate,
        sortBy = "date",
        sortOrder = "desc",
      } = req.query;

      // Construire le filtre
      const filter = {};
      if (search) {
        filter.$or = [
          { clientName: { $regex: search, $options: "i" } },
          { clientPhone: { $regex: search, $options: "i" } },
          { "items.productName": { $regex: search, $options: "i" } },
        ];
      }

      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      // Construire le tri
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Pagination
      const skip = (page - 1) * limit;

      const sales = await Sale.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Sale.countDocuments(filter);

      res.json({
        success: true,
        data: sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("GetAllSales error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des ventes",
      });
    }
  }

  /**
   * Récupérer une vente par son ID
   * @route GET /api/sales/:id
   */
  static async getSaleById(req, res, next) {
    try {
      const sale = await Sale.findById(req.params.id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Vente non trouvée",
        });
      }

      res.json({
        success: true,
        data: sale,
      });
    } catch (error) {
      console.error("GetSaleById error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la vente",
      });
    }
  }

  /**
   * Créer une nouvelle vente
   * @route POST /api/sales
   */
  static async createSale(req, res, next) {
    try {
      const { clientName, clientPhone, items } = req.body;

      // Validation
      if (!clientName || !items || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Nom du client et articles requis",
        });
      }

      // Vérifier le stock et calculer le total
      let total = 0;
      const alerts = [];
      const updatedProducts = [];

      for (const item of items) {
        const product = await Product.findOne({
          _id: item.productId,
          isActive: { $ne: false },
        });

        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Produit ${item.productName} non trouvé ou inactif`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}, Demandé: ${item.quantity}`,
          });
        }

        // Mettre à jour le stock
        product.stock -= item.quantity;
        updatedProducts.push(product);

        // Vérifier si le stock est bas
        if (product.stock <= product.lowStockThreshold) {
          alerts.push(
            `Alerte: ${product.name} a un stock bas (${product.stock} restants)`,
          );
        }

        total += item.quantity * item.unitPrice;
      }

      // Sauvegarder les mises à jour de stock
      await Promise.all(updatedProducts.map((product) => product.save()));

      // Créer la vente
      const sale = new Sale({
        clientName,
        clientPhone,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
        total,
        date: new Date(),
      });

      await sale.save();

      res.status(201).json({
        success: true,
        message: "Vente créée avec succès",
        data: sale,
        alerts,
      });
    } catch (error) {
      console.error("CreateSale error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la vente",
      });
    }
  }

  /**
   * Mettre à jour une vente
   * @route PUT /api/sales/:id
   */
  static async updateSale(req, res, next) {
    try {
      const { clientName, clientPhone, items } = req.body;

      const sale = await Sale.findById(req.params.id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Vente non trouvée",
        });
      }

      // Note: La mise à jour d'une vente est complexe car elle affecte le stock
      // Pour simplifier, on autorise seulement la modification des infos client
      if (clientName) sale.clientName = clientName;
      if (clientPhone !== undefined) sale.clientPhone = clientPhone;

      await sale.save();

      res.json({
        success: true,
        message: "Vente mise à jour avec succès",
        data: sale,
      });
    } catch (error) {
      console.error("UpdateSale error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la vente",
      });
    }
  }

  /**
   * Supprimer une vente
   * @route DELETE /api/sales/:id
   */
  static async deleteSale(req, res, next) {
    try {
      const sale = await Sale.findById(req.params.id);

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Vente non trouvée",
        });
      }

      // Restituer le stock
      for (const item of sale.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }

      await Sale.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Vente supprimée avec succès et stock restitué",
      });
    } catch (error) {
      console.error("DeleteSale error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression de la vente",
      });
    }
  }

  /**
   * Récupérer les statistiques des ventes
   * @route GET /api/sales/stats
   */
  static async getSalesStats(req, res, next) {
    try {
      const { period = "month" } = req.query;
      let startDate;

      switch (period) {
        case "day":
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date();
          startDate.setDate(1);
          break;
        case "year":
          startDate = new Date();
          startDate.setMonth(0, 1);
          break;
        default:
          startDate = new Date();
          startDate.setDate(1);
      }

      const stats = await Sale.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            count: { $sum: 1 },
            avgSale: { $avg: "$total" },
          },
        },
      ]);

      res.json({
        success: true,
        data: stats[0] || { totalSales: 0, count: 0, avgSale: 0 },
      });
    } catch (error) {
      console.error("GetSalesStats error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
      });
    }
  }
}

module.exports = SaleController;
