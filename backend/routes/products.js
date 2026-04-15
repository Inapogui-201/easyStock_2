const express = require('express');
const { protect } = require('../middleware/auth.js');
const ProductController = require('../controllers/productController.js');
const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/products
 * @desc    Récupérer tous les produits
 * @access  Private
 */
router.get('/', ProductController.getAllProducts);

/**
 * @route   GET /api/products/categories
 * @desc    Récupérer les catégories de produits
 * @access  Private
 */
router.get('/categories', ProductController.getCategories);

/**
 * @route   GET /api/products/:id
 * @desc    Récupérer un produit par son ID
 * @access  Private
 */
router.get('/:id', ProductController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Créer un nouveau produit
 * @access  Private
 */
router.post('/', ProductController.createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Mettre à jour un produit
 * @access  Private
 */
router.put('/:id', ProductController.updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Supprimer un produit
 * @access  Private
 */
router.delete('/:id', ProductController.deleteProduct);

module.exports = router;
