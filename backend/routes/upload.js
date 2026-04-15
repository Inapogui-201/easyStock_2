const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth.js');
const { storage } = require('../config/cloudinary.js');
const router = express.Router();

// Configuration Multer avec Cloudinary
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier les formats acceptés
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou WebP.'), false);
    }
  }
});

/**
 * @route   POST /api/upload/image
 * @desc    Uploader une image de produit
 * @access  Private
 */
router.post('/image', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier image fourni'
      });
    }

    // Retourner l'URL de l'image uploadée
    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        url: req.file.path, // URL Cloudinary
        publicId: req.file.filename, // ID public Cloudinary
        originalName: req.file.originalname,
        size: req.file.size,
        format: req.file.format
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'image'
    });
  }
});

/**
 * @route   DELETE /api/upload/image/:publicId
 * @desc    Supprimer une image de Cloudinary
 * @access  Private
 */
router.delete('/image/:publicId', protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'ID public requis'
      });
    }

    // Supprimer l'image de Cloudinary
    const result = await require('../config/cloudinary.js').cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image supprimée avec succès'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image non trouvée ou déjà supprimée'
      });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image'
    });
  }
});

module.exports = router;
