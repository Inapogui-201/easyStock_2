require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db.js");
const { protect } = require("./middleware/auth.js");
const { errorHandler, notFound } = require("./middleware/errorHandler.js");

// Routes
const authRoutes = require("./routes/auth.js");
const productRoutes = require("./routes/products.js");
const saleRoutes = require("./routes/sales.js");
const stockRoutes = require("./routes/stock.js");
const dashboardRoutes = require("./routes/dashboard.js");
const uploadRoutes = require("./routes/upload.js");

// Initialisation
const app = express();
const PORT = process.env.PORT || 5000;

// Connexion MongoDB
connectDB();

// Sécurité
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// CORS - Autoriser plusieurs origines
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser les requêtes sans origine (Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS: Origin not allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par minute
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
  },
});
app.use(limiter);

// Logging
app.use(morgan("dev"));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "EasyStock API",
    timestamp: new Date().toISOString(),
  });
});

// Routes publiques
app.use("/api/auth", authRoutes);

// Routes protégées (JWT requis)
app.use("/api/products", protect, productRoutes);
app.use("/api/sales", protect, saleRoutes);
app.use("/api/stock", protect, stockRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);
app.use("/api/upload", protect, uploadRoutes);

// Gestion des routes non trouvées
app.use(notFound);

//test

// Gestionnaire d'erreurs global
app.use(errorHandler);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`
🚀 =========================================
   EasyStock API - Serveur démarré
   Port: ${PORT}
   Environnement: ${process.env.NODE_ENV || "development"}
   MongoDB: ${process.env.MONGODB_URI ? "Connecté" : "Non configuré"}
=========================================
  `);
  console.log(`📍 Endpoints disponibles:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/products`);
  console.log(`   - POST /api/sales`);
  console.log(`   - GET  /api/stock`);
  console.log(`   - GET  /api/dashboard`);
  console.log(`   - GET  /health`);
  console.log(
    `\n👉 Frontend: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );
  console.log(`\n💡 Pour seed la DB: npm run seed`);
  console.log(`💡 Pour développement: npm run dev\n`);
});

// Gestion des erreurs non capturées
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  // Ne pas quitter en production, juste logger
  if (process.env.NODE_ENV === "development") {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  if (process.env.NODE_ENV === "development") {
    process.exit(1);
  }
});
