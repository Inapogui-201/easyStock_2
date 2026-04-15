const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Nom du client requis'],
    trim: true
  },
  clientPhone: {
    type: String,
    trim: true,
    default: null
  },
  items: [saleItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    default: 'cash',
    enum: ['cash', 'card', 'transfer']
  },
  status: {
    type: String,
    default: 'completed',
    enum: ['completed', 'cancelled', 'refunded']
  }
}, {
  timestamps: true
});

// Index pour recherche par date
saleSchema.index({ date: -1 });
saleSchema.index({ clientName: 'text' });

module.exports = mongoose.model('Sale', saleSchema);
