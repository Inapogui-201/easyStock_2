const express = require("express");
const { protect } = require("../middleware/auth.js");
const AuthController = require("../controllers/authController.js");
const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Connexion admin
 * @access  Public
 */
router.post("/login", AuthController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion admin
 * @access  Public
 */
router.post("/logout", AuthController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les infos de l'admin connecté
 * @access  Private
 */
router.get("/me", protect, AuthController.getMe);

module.exports = router;
