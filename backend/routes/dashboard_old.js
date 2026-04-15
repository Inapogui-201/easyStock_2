const express = require('express');
const { protect } = require('../middleware/auth.js');
const Sale = require('../models/Sale.js');
const Product = require('../models/Product.js');

const router = express.Router();

// Obtenir les statistiques du dashboard
router.get('/', protect, async (req, res) => {
  try {
    // Stats générales
    const totalStock = await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$stock' } } }
    ]);

    const totalSales = await Sale.countDocuments();
    
    // Chiffre d'affaires ce mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const revenueThisMonth = await Sale.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Chiffre d'affaires cette année
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    
    const revenueThisYear = await Sale.aggregate([
      {
        $match: {
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Produits en stock bas
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).select('name stock lowStockThreshold');

    // Top 5 produits par chiffre d'affaires
    const topProducts = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: 1,
          revenue: 1
        }
      }
    ]);

    // Données pour le graphique (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const chartData = await Sale.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$total' }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          _id: 0,
          day: '$_id',
          total: 1
        }
      }
    ]);

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
        chartData
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du dashboard'
    });
  }
});

module.exports = router;
