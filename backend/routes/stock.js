const express = require('express');
const { protect } = require('../middleware/auth.js');
const StockController = require('../controllers/stockController.js');
const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/stock
 * @desc    Récupérer tous les stocks
 * @access  Private
 */
router.get('/', StockController.getAllStock);

/**
 * @route   GET /api/stock/alerts
 * @desc    Récupérer les alertes de stock bas
 * @access  Private
 */
router.get('/alerts', StockController.getStockAlerts);

/**
 * @route   GET /api/stock/movements
 * @desc    Récupérer l'historique des mouvements de stock
 * @access  Private
 */
router.get('/movements', StockController.getStockMovements);

/**
 * @route   POST /api/stock/restock
 * @desc    Réapprovisionner le stock
 * @access  Private
 */
router.post('/restock', StockController.restock);

/**
 * @route   GET /api/stock/:id
 * @desc    Récupérer un produit de stock par son ID
 * @access  Private
 */
router.get('/:id', StockController.getStockById);

/**
 * @route   PUT /api/stock/:id/adjust
 * @desc    Ajuster le stock
 * @access  Private
 */
router.put('/:id/adjust', StockController.adjustStock);

/**
 * @route   PUT /api/stock/:id/threshold
 * @desc    Mettre à jour le seuil de stock bas
 * @access  Private
 */
router.put('/:id/threshold', StockController.updateThreshold);

module.exports = router;
