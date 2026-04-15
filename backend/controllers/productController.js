const Product = require("../models/Product.js");

/**
 * Controller pour la gestion des produits
 */
class ProductController {
  /**
   * Récupérer tous les produits
   * @route GET /api/products
   */
  static async getAllProducts(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Construire le filtre - uniquement les produits actifs
      const filter = { isActive: { $ne: false } };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ];
      }
      if (category) {
        filter.category = category;
      }

      // Construire le tri
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Pagination
      const skip = (page - 1) * limit;

      const products = await Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(filter);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("GetAllProducts error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des produits",
      });
    }
  }

  /**
   * Récupérer un produit par son ID
   * @route GET /api/products/:id
   */
  static async getProductById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé",
        });
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error("GetProductById error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du produit",
      });
    }
  }

  /**
   * Créer un nouveau produit
   * @route POST /api/products
   */
  static async createProduct(req, res, next) {
    try {
      const {
        name,
        description,
        price,
        category,
        stock,
        lowStockThreshold,
        image,
      } = req.body;

      // Vérifier si le produit existe déjà
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "Un produit avec ce nom existe déjà",
        });
      }

      const product = new Product({
        name,
        description,
        price,
        category,
        stock,
        lowStockThreshold: lowStockThreshold || 5,
        image,
      });

      await product.save();

      res.status(201).json({
        success: true,
        message: "Produit créé avec succès",
        data: product,
      });
    } catch (error) {
      console.error("CreateProduct error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création du produit",
      });
    }
  }

  /**
   * Mettre à jour un produit
   * @route PUT /api/products/:id
   */
  static async updateProduct(req, res, next) {
    try {
      const {
        name,
        description,
        price,
        category,
        stock,
        lowStockThreshold,
        image,
      } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé",
        });
      }

      // Vérifier si le nom est déjà utilisé par un autre produit
      if (name && name !== product.name) {
        const existingProduct = await Product.findOne({
          name,
          _id: { $ne: req.params.id },
        });
        if (existingProduct) {
          return res.status(400).json({
            success: false,
            message: "Un produit avec ce nom existe déjà",
          });
        }
      }

      // Mettre à jour les champs
      if (name) product.name = name;
      if (description !== undefined) product.description = description;
      if (price !== undefined) product.price = price;
      if (category) product.category = category;
      if (stock !== undefined) product.stock = stock;
      if (lowStockThreshold !== undefined)
        product.lowStockThreshold = lowStockThreshold;
      if (image !== undefined) product.image = image;

      await product.save();

      res.json({
        success: true,
        message: "Produit mis à jour avec succès",
        data: product,
      });
    } catch (error) {
      console.error("UpdateProduct error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du produit",
      });
    }
  }

  /**
   * Supprimer un produit
   * @route DELETE /api/products/:id
   */
  static async deleteProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Produit non trouvé",
        });
      }

      // Soft delete - marquer comme inactif au lieu de supprimer
      product.isActive = false;
      await product.save();

      res.json({
        success: true,
        message: "Produit supprimé avec succès",
      });
    } catch (error) {
      console.error("DeleteProduct error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression du produit",
      });
    }
  }

  /**
   * Récupérer les catégories de produits
   * @route GET /api/products/categories
   */
  static async getCategories(req, res, next) {
    try {
      const categories = await Product.distinct("category");

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error("GetCategories error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des catégories",
      });
    }
  }
}

module.exports = ProductController;
