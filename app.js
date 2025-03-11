const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 3000;

//Configuration de l'application
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "express-brains-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

//Middleware pour initialiser le jeu si nécessaire
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

//Route pour la page d'accueil
app.get("/", (req, res) => {
  res.render("index");
});

//Route pour commencer une nouvelle partie
app.get("/play", (req, res) => {
  //Vérifier que req.session existe
  if (!req.session) {
    console.error("Session is undefined");
    return res.status(500).send("Session error");
  }
  // Réinitialiser le jeu
  req.session.secretNumber = Math.floor(Math.random() * 100) + 1;
  req.session.attempts = 0;
  req.session.message = null;
  req.session.status = null;

  console.log("Session initialized", req.session);

  return res.render("game", {
    message: req.session.message,
    status: req.session.status,
    attempts: req.session.attempts,
  });
});

//Route pour traiter une tentative
app.post("/guess", (req, res) => {
  const guess = parseInt(req.body.guess);
  const secretNumber = req.session.secretNumber;

  //Vérifier si l'entrée est un nombre valide
  if (isNaN(guess) || guess < 1 || guess > 100) {
    req.session.message =
      "Erreur ! Vous devez saisir un nombre entre 1 et 100.";
    req.session.status = "error";
    res.render("game", {
      message: req.session.message,
      status: req.session.status,
      attempts: req.session.attempts,
    });
    return;
  }

  //Incrémenter le nombre de tentatives
  req.session.attempts++;

  //Vérifier si la tentative est correcte
  if (guess === secretNumber) {
    res.render("win", {
      secretNumber,
      attempts: req.session.attempts,
    });
  } else if (guess < secretNumber) {
    req.session.message = "Vous êtes trop bas !";
    req.session.status = "low";
    res.render("game", {
      message: req.session.message,
      status: req.session.status,
      attempts: req.session.attempts,
    });
  } else {
    req.session.message = "Vous êtes trop haut !";
    req.session.status = "high";
    res.render("game", {
      message: req.session.message,
      status: req.session.status,
      attempts: req.session.attempts,
    });
  }
});

//Démarrer le serveur
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
