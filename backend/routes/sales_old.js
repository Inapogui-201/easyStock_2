const express = require('express');
const mongoose = require('mongoose');
const Sale = require('../models/Sale.js');
const Product = require('../models/Product.js');
const { validate } = require('../middleware/validator.js');
const router = express.Router();

/**
 * @route   GET /api/sales
 * @desc    Historique des ventes
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, dateFrom, dateTo } = req.query;
    
    let filter = {};
    
    if (search) {
      filter.clientName = { $regex: search, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const sales = await Sale.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Sale.countDocuments(filter);

    // Formater les données
    const formattedSales = sales.map(s => ({
      id: s._id,
      clientName: s.clientName,
      clientPhone: s.clientPhone,
      items: s.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total
      })),
      total: s.total,
      date: s.date,
      paymentMethod: s.paymentMethod,
      status: s.status
    }));

    res.json({
      success: true,
      count: formattedSales.length,
      total,
      data: formattedSales
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/sales/:id
 * @desc    Détails d'une vente
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Vente non trouvée'
      });
    }

    res.json({
      success: true,
      data: {
        id: sale._id,
        clientName: sale.clientName,
        clientPhone: sale.clientPhone,
        items: sale.items,
        total: sale.total,
        date: sale.date,
        paymentMethod: sale.paymentMethod,
        status: sale.status
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/sales
 * @desc    Créer une vente + mise à jour stock
 * @access  Private
 */
router.post('/', validate('sale'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { clientName, clientPhone, products, total, paymentMethod } = req.body;

    const saleItems = [];
    const alerts = [];

    // Vérifier et mettre à jour chaque produit
    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Produit non trouvé: ${item.productId}`
        });
      }

      if (product.stock < item.qty) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${product.name} (disponible: ${product.stock}, demandé: ${item.qty})`
        });
      }

      // Mettre à jour le stock
      product.stock -= item.qty;
      await product.save({ session });

      // Vérifier si stock bas après vente
      if (product.stock <= product.lowStockThreshold) {
        const alertMsg = `⚠️ STOCK BAS: ${product.name} - Il reste ${product.stock} unité(s)`;
        alerts.push(alertMsg);
        console.warn(alertMsg);
      }

      saleItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.qty,
        unitPrice: product.price,
        total: product.price * item.qty
      });
    }

    // Créer la vente
    const sale = await Sale.create([{
      clientName,
      clientPhone,
      items: saleItems,
      total,
      paymentMethod
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Vente enregistrée avec succès',
      alerts: alerts.length > 0 ? alerts : undefined,
      data: {
        id: sale[0]._id,
        clientName: sale[0].clientName,
        clientPhone: sale[0].clientPhone,
        items: saleItems,
        total: sale[0].total,
        date: sale[0].date
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @route   DELETE /api/sales/:id
 * @desc    Annuler une vente (remettre le stock)
 * @access  Private
 */
router.delete('/:id', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Vente non trouvée'
      });
    }

    if (sale.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Vente déjà annulée'
      });
    }

    // Remettre le stock
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    // Marquer comme annulée
    sale.status = 'cancelled';
    await sale.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Vente annulée et stock remis'
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

module.exports = router;
