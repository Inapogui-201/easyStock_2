const Joi = require('joi');

// Schémas de validation
const schemas = {
  // Validation login
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email invalide',
      'any.required': 'Email requis'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Mot de passe trop court (min 6 caractères)',
      'any.required': 'Mot de passe requis'
    })
  }),

  // Validation produit
  product: Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nom trop court',
      'string.max': 'Nom trop long',
      'any.required': 'Nom requis'
    }),
    price: Joi.number().min(0).required().messages({
      'number.min': 'Prix ne peut pas être négatif',
      'any.required': 'Prix requis'
    }),
    stock: Joi.number().min(0).default(0),
    category: Joi.string().required().messages({
      'any.required': 'Catégorie requise'
    }),
    image: Joi.string().allow(null, ''),
    lowStockThreshold: Joi.number().min(1).default(5),
    description: Joi.string().max(500).allow('', null),
    isActive: Joi.boolean().default(true)
  }),

  // Validation mise à jour produit
  productUpdate: Joi.object({
    name: Joi.string().min(2).max(100),
    price: Joi.number().min(0),
    stock: Joi.number().min(0),
    category: Joi.string(),
    image: Joi.string().allow(null, ''),
    lowStockThreshold: Joi.number().min(1),
    description: Joi.string().max(500).allow('', null),
    isActive: Joi.boolean()
  }).min(1),

  // Validation vente
  sale: Joi.object({
    clientName: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nom client trop court',
      'any.required': 'Nom client requis'
    }),
    clientPhone: Joi.string().allow(null, ''),
    products: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        qty: Joi.number().min(1).required()
      })
    ).min(1).required().messages({
      'array.min': 'Au moins un produit requis',
      'any.required': 'Produits requis'
    }),
    total: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'card', 'transfer').default('cash')
  })
};

// Middleware de validation
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Schéma de validation '${schemaName}' non trouvé`));
    }

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const messages = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: messages
      });
    }

    next();
  };
};

module.exports = { validate, schemas };
