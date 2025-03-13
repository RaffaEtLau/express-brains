const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const connectDB = require("./config/database");

// Initialiser l'application Express
const app = express();

// Connexion à la base de données
connectDB();

// Configuration du moteur de template
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware pour parser les requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configuration des sessions
app.use(
  session({
    secret: "express-brains-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 jour
  })
);

// Middleware flash
app.use(flash());

// Middleware global pour les variables locales
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  res.locals.success_msg = req.flash ? req.flash("success_msg") : [];
  res.locals.error_msg = req.flash ? req.flash("error_msg") : [];
  res.locals.error = null;
  next();
});

// Routes
const indexRoutes = require("./routes/index");
app.use("/", indexRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).render("error", {
    title: "404 - Page non trouvée",
    error: "La page que vous recherchez n'existe pas.",
  });
});

// Gestion des erreurs 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    title: "500 - Erreur interne",
    error: "Une erreur est survenue sur le serveur.",
  });
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
