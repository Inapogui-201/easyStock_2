const express = require('express');
const Product = require('../models/Product.js');
const router = express.Router();

/**
 * @route   GET /api/stock
 * @desc    Liste les stocks avec alertes
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const { lowStockOnly, category } = req.query;
    
    let filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter).sort({ stock: 1 });

    // Formater les données
    let stockData = products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
      image: p.image,
      lowStockThreshold: p.lowStockThreshold,
      isLowStock: p.isLowStock(),
      status: p.stock === 0 ? 'out_of_stock' : p.isLowStock() ? 'low' : 'ok'
    }));

    // Filtrer uniquement les stocks bas si demandé
    if (lowStockOnly === 'true') {
      stockData = stockData.filter(p => p.isLowStock);
    }

    // Statistiques
    const stats = {
      totalProducts: stockData.length,
      outOfStock: stockData.filter(p => p.stock === 0).length,
      lowStock: stockData.filter(p => p.isLowStock && p.stock > 0).length,
      healthy: stockData.filter(p => !p.isLowStock).length
    };

    res.json({
      success: true,
      stats,
      count: stockData.length,
      data: stockData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/stock/alerts
 * @desc    Alertes de stock bas
 * @access  Private
 */
router.get('/alerts', async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).sort({ stock: 1 });

    const alerts = products.map(p => ({
      id: p._id,
      name: p.name,
      stock: p.stock,
      threshold: p.lowStockThreshold,
      category: p.category,
      severity: p.stock === 0 ? 'critical' : 'warning',
      message: p.stock === 0 
        ? `Rupture de stock: ${p.name}` 
        : `Stock bas: ${p.name} (${p.stock} restant${p.stock > 1 ? 's' : ''})`
    }));

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/stock/restock/:id
 * @desc    Réapprovisionner un produit
 * @access  Private (Admin)
 */
router.post('/restock/:id', async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: quantity } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      message: `Stock mis à jour: +${quantity} unités`,
      data: {
        id: product._id,
        name: product.name,
        stock: product.stock,
        isLowStock: product.isLowStock()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/stock/adjust/:id
 * @desc    Ajuster le stock manuellement
 * @access  Private (Admin)
 */
router.put('/adjust/:id', async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock invalide'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Stock ajusté',
      data: {
        id: product._id,
        name: product.name,
        stock: product.stock,
        isLowStock: product.isLowStock()
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
