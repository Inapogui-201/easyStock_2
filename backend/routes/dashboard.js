const express = require('express');
const { protect } = require('../middleware/auth.js');
const DashboardController = require('../controllers/dashboardController.js');
const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/dashboard
 * @desc    Obtenir les statistiques du dashboard
 * @access  Private
 */
router.get('/', DashboardController.getDashboard);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Obtenir les statistiques détaillées
 * @access  Private
 */
router.get('/stats', DashboardController.getDetailedStats);

/**
 * @route   GET /api/dashboard/trends
 * @desc    Obtenir les tendances des ventes
 * @access  Private
 */
router.get('/trends', DashboardController.getSalesTrends);

module.exports = router;
