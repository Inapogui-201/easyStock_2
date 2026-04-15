const express = require('express');
const Product = require('../models/Product.js');
const { validate } = require('../middleware/validator.js');
const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Liste tous les produits
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, category, lowStock, page = 1, limit = 50 } = req.query;
    
    // Construire le filtre
    let filter = { isActive: true };
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (category) {
      filter.category = category;
    }

    const query = Product.find(filter);
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const products = await query.skip(skip).limit(Number(limit)).sort({ createdAt: -1 });
    
    const total = await Product.countDocuments(filter);

    // Formater les données
    const formattedProducts = products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
      image: p.image,
      lowStockThreshold: p.lowStockThreshold,
      description: p.description,
      isLowStock: p.isLowStock(),
      createdAt: p.createdAt
    }));

    res.json({
      success: true,
      count: formattedProducts.length,
      total,
      data: formattedProducts
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/products/categories
 * @desc    Liste toutes les catégories
 * @access  Private
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Détails d'un produit
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image: product.image,
        lowStockThreshold: product.lowStockThreshold,
        description: product.description,
        isLowStock: product.isLowStock()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/products
 * @desc    Créer un nouveau produit
 * @access  Private (Admin)
 */
router.post('/', validate('product'), async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image: product.image,
        lowStockThreshold: product.lowStockThreshold,
        description: product.description
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Mettre à jour un produit
 * @access  Private (Admin)
 */
router.put('/:id', validate('productUpdate'), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Produit mis à jour',
      data: {
        id: product._id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image: product.image,
        lowStockThreshold: product.lowStockThreshold,
        description: product.description
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Supprimer un produit (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
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
      message: 'Produit supprimé'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
