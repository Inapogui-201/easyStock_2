const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nom du produit requis'],
    trim: true,
    maxlength: [100, 'Nom trop long (max 100 caractères)']
  },
  price: {
    type: Number,
    required: [true, 'Prix requis'],
    min: [0, 'Prix ne peut pas être négatif']
  },
  stock: {
    type: Number,
    required: [true, 'Stock requis'],
    min: [0, 'Stock ne peut pas être négatif'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Catégorie requise'],
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 1
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description trop longue']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour recherche
productSchema.index({ name: 'text', category: 'text' });

// Méthode pour vérifier si stock est bas
productSchema.methods.isLowStock = function() {
  return this.stock <= this.lowStockThreshold;
};

module.exports = mongoose.model('Product', productSchema);
