const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin.js');
const { generateToken } = require('../middleware/auth.js');

/**
 * Controller pour l'authentification
 */
class AuthController {
  /**
   * Connexion admin
   * @route POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Créer admin par défaut si aucun n'existe
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0) {
        const defaultAdmin = new Admin({
          email: 'admin@easystock.com',
          password: 'admin123',
          role: 'admin'
        });
        await defaultAdmin.save();
        console.log('Admin par défaut créé: admin@easystock.com / admin123');
      }

      // Vérifier si admin existe
      const admin = await Admin.findOne({ email }).select('+password');
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier mot de passe
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Générer token
      const token = generateToken(admin._id);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          token,
          admin: {
            id: admin._id,
            email: admin.email,
            role: admin.role
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion'
      });
    }
  }

  /**
   * Déconnexion
   * @route POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion'
      });
    }
  }

  /**
   * Vérifier le token
   * @route GET /api/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const admin = await Admin.findById(req.admin.id);
      res.json({
        success: true,
        data: {
          admin: {
            id: admin._id,
            email: admin.email,
            role: admin.role
          }
        }
      });
    } catch (error) {
      console.error('GetMe error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des informations'
      });
    }
  }
}

module.exports = AuthController;
