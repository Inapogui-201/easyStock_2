const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin.js');

// Vérifier token JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Récupérer token du header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    try {
      // Vérifier token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Vérifier si admin existe toujours
      const admin = await Admin.findById(decoded.id);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Non autorisé - Admin non trouvé'
        });
      }

      // Ajouter admin à la requête
      req.admin = admin;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token invalide'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Générer JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};
