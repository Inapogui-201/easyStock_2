const express = require('express');
const { protect } = require('../middleware/auth.js');
const SaleController = require('../controllers/saleController.js');
const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/sales
 * @desc    Récupérer toutes les ventes
 * @access  Private
 */
router.get('/', SaleController.getAllSales);

/**
 * @route   GET /api/sales/stats
 * @desc    Récupérer les statistiques des ventes
 * @access  Private
 */
router.get('/stats', SaleController.getSalesStats);

/**
 * @route   GET /api/sales/:id
 * @desc    Récupérer une vente par son ID
 * @access  Private
 */
router.get('/:id', SaleController.getSaleById);

/**
 * @route   POST /api/sales
 * @desc    Créer une nouvelle vente
 * @access  Private
 */
router.post('/', SaleController.createSale);

/**
 * @route   PUT /api/sales/:id
 * @desc    Mettre à jour une vente
 * @access  Private
 */
router.put('/:id', SaleController.updateSale);

/**
 * @route   DELETE /api/sales/:id
 * @desc    Supprimer une vente
 * @access  Private
 */
router.delete('/:id', SaleController.deleteSale);

module.exports = router;
