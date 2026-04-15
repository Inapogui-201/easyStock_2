require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db.js");
const Admin = require("./models/Admin.js");
const Product = require("./models/Product.js");

// Données de test
const sampleProducts = [
  {
    name: "iPhone 15 Pro",
    price: 1200,
    stock: 15,
    category: "Électronique",
    description: "Dernier modèle iPhone avec caméra 48MP",
    lowStockThreshold: 5,
  },
  {
    name: "Samsung Galaxy S24",
    price: 999,
    stock: 8,
    category: "Électronique",
    description: "Smartphone Android haut de gamme",
    lowStockThreshold: 5,
  },
  {
    name: "MacBook Pro M3",
    price: 2500,
    stock: 3,
    category: "Informatique",
    description: "Ordinateur portable professionnel",
    lowStockThreshold: 2,
  },
  {
    name: "AirPods Pro 2",
    price: 280,
    stock: 25,
    category: "Audio",
    description: "Écouteurs sans fil avec réduction de bruit",
    lowStockThreshold: 10,
  },
  {
    name: "iPad Air",
    price: 650,
    stock: 12,
    category: "Électronique",
    description: "Tablette polyvalente pour le travail et loisirs",
    lowStockThreshold: 5,
  },
  {
    name: "Chargeur USB-C 65W",
    price: 45,
    stock: 50,
    category: "Accessoires",
    description: "Chargeur rapide universel",
    lowStockThreshold: 15,
  },
  {
    name: "Coque iPhone 15",
    price: 25,
    stock: 4,
    category: "Accessoires",
    description: "Protection transparente antichoc",
    lowStockThreshold: 10,
  },
  {
    name: "Câble USB-C/Lightning",
    price: 19,
    stock: 75,
    category: "Accessoires",
    description: "Câble de charge et synchronisation",
    lowStockThreshold: 20,
  },
  {
    name: "Support bureau aluminium",
    price: 35,
    stock: 18,
    category: "Accessoires",
    description: "Support réglable pour laptop",
    lowStockThreshold: 5,
  },
  {
    name: "Batterie externe 20000mAh",
    price: 55,
    stock: 2,
    category: "Accessoires",
    description: "Power bank haute capacité",
    lowStockThreshold: 5,
  },
];

const seedDB = async () => {
  try {
    // Connexion à MongoDB
    await connectDB();

    console.log("🌱 Début du seeding...\n");

    // Supprimer les données existantes
    await Admin.deleteMany();
    await Product.deleteMany();
    console.log("🗑️  Données existantes supprimées");

    // Créer l'admin
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    });
    console.log(`✅ Admin créé: ${admin.email}`);

    // Créer les produits
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ ${products.length} produits créés`);

    // Afficher les alertes stock bas
    const lowStockProducts = products.filter(
      (p) => p.stock <= p.lowStockThreshold,
    );
    if (lowStockProducts.length > 0) {
      console.log("\n⚠️  Produits en stock bas:");
      lowStockProducts.forEach((p) => {
        console.log(`   - ${p.name}: ${p.stock}/${p.lowStockThreshold}`);
      });
    }

    console.log("\n🎉 Seeding terminé avec succès!");
    console.log("\n📋 Identifiants admin:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD}`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Erreur seeding: ${error.message}`);
    process.exit(1);
  }
};

// Exécuter le seeding
seedDB();
