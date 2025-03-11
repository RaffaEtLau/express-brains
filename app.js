const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");

// Routes
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");

const app = express();
const port = process.env.PORT || 3000;

// Configuration de l'application
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "express-brains-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24, // 1 jour
    },
  })
);

// Configuration des messages flash
app.use(flash());

// Variables globales
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || null;
  next();
});

// Middleware pour initialiser le jeu si nécessaire
app.use((req, res, next) => {
  if (!req.session.secretNumber) {
    // Génération d'un nombre aléatoire entre 1 et 100
    req.session.secretNumber = Math.floor(Math.random() * 100) + 1;
    req.session.attempts = 0;
    req.session.message = null;
    req.session.status = null;
  }
  next();
});

// Routes
app.use("/", indexRoutes);
app.use("/auth", authRoutes);
app.use("/game", gameRoutes);

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Une erreur s'est produite: " + err.message);
});
