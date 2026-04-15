const Sale = require("../models/Sale.js");
const Product = require("../models/Product.js");

/**
 * Controller pour le dashboard
 */
class DashboardController {
  /**
   * Obtenir les statistiques du dashboard
   * @route GET /api/dashboard
   */
  static async getDashboard(req, res, next) {
    try {
      // Stats générales - uniquement les produits actifs
      const totalStock = await Product.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: null, total: { $sum: "$stock" } } },
      ]);

      const totalSales = await Sale.countDocuments();

      // Chiffre d'affaires ce mois
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const revenueThisMonth = await Sale.aggregate([
        {
          $match: {
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);

      // Chiffre d'affaires cette année
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);

      const revenueThisYear = await Sale.aggregate([
        {
          $match: {
            date: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]);

      // Produits en stock bas (uniquement actifs)
      const lowStockProducts = await Product.find({
        isActive: { $ne: false },
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }).select("name stock lowStockThreshold category image");

      // Top 5 produits par chiffre d'affaires
      const topProducts = await Sale.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.productName" },
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            name: 1,
            revenue: 1,
            quantity: 1,
          },
        },
      ]);

      // Données pour le graphique (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const chartData = await Sale.aggregate([
        {
          $match: {
            date: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            day: "$_id",
            total: 1,
            count: 1,
          },
        },
      ]);

      // Statistiques par catégorie
      const categoryStats = await Sale.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.category",
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
            quantity: { $sum: "$items.quantity" },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      // Ventes récentes (dernières 5)
      const recentSales = await Sale.find()
        .sort({ date: -1 })
        .limit(5)
        .select("clientName total date items");

      const stats = {
        totalStock: totalStock[0]?.total || 0,
        totalSales,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        revenueThisYear: revenueThisYear[0]?.total || 0,
      };

      res.json({
        success: true,
        data: {
          stats,
          lowStockProducts,
          topProducts,
          chartData,
          categoryStats,
          recentSales,
        },
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des données du dashboard",
      });
    }
  }

  /**
   * Obtenir les statistiques détaillées
   * @route GET /api/dashboard/stats
   */
  static async getDetailedStats(req, res, next) {
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

      // Stats ventes
      const salesStats = await Sale.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            totalSales: { $sum: 1 },
            avgSaleValue: { $avg: "$total" },
            maxSale: { $max: "$total" },
            minSale: { $min: "$total" },
          },
        },
      ]);

      // Stats produits (uniquement actifs)
      const productStats = await Product.aggregate([
        { $match: { isActive: { $ne: false } } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            totalValue: { $sum: { $multiply: ["$stock", "$price"] } },
            lowStockProducts: {
              $sum: {
                $cond: [{ $lte: ["$stock", "$lowStockThreshold"] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Top clients
      const topClients = await Sale.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: "$clientName",
            totalSpent: { $sum: "$total" },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: "$total" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]);

      res.json({
        success: true,
        data: {
          salesStats: salesStats[0] || {
            totalRevenue: 0,
            totalSales: 0,
            avgSaleValue: 0,
            maxSale: 0,
            minSale: 0,
          },
          productStats: productStats[0] || {
            totalProducts: 0,
            totalStock: 0,
            totalValue: 0,
            lowStockProducts: 0,
          },
          topClients,
          period,
        },
      });
    } catch (error) {
      console.error("GetDetailedStats error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques détaillées",
      });
    }
  }

  /**
   * Obtenir les tendances des ventes
   * @route GET /api/dashboard/trends
   */
  static async getSalesTrends(req, res, next) {
    try {
      const { period = "30days" } = req.query;
      let days = 30;

      switch (period) {
        case "7days":
          days = 7;
          break;
        case "30days":
          days = 30;
          break;
        case "90days":
          days = 90;
          break;
        case "1year":
          days = 365;
          break;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trends = await Sale.aggregate([
        {
          $match: {
            date: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            revenue: { $sum: "$total" },
            count: { $sum: 1 },
            avgValue: { $avg: "$total" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        {
          $project: {
            _id: 0,
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                    day: "$_id.day",
                  },
                },
              },
            },
            revenue: 1,
            count: 1,
            avgValue: 1,
          },
        },
      ]);

      res.json({
        success: true,
        data: trends,
        period,
      });
    } catch (error) {
      console.error("GetSalesTrends error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des tendances",
      });
    }
  }
}

module.exports = DashboardController;
