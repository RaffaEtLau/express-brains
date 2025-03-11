const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 3000;

// Configuration de base
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
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

// Variables globales pour les templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = "";
  res.locals.error_msg = "";
  res.locals.error = "";
  next();
});

// Middleware pour initialiser le jeu
app.use((req, res, next) => {
  if (!req.session.secretNumber) {
    req.session.secretNumber = Math.floor(Math.random() * 100) + 1;
    req.session.attempts = 0;
    req.session.message = null;
    req.session.status = null;
  }
  next();
});

// Route d'accueil
app.get("/", (req, res) => {
  // Données de démonstration pour les meilleurs joueurs sur la page d'accueil
  const topPlayers = [
    { pseudo: "MasterGuesser", bestScore: 250, bestAttempts: 4 },
    { pseudo: "LuckyNumber", bestScore: 200, bestAttempts: 5 },
    { pseudo: "NumberWizard", bestScore: 167, bestAttempts: 6 },
    { pseudo: "BinarySearchPro", bestScore: 143, bestAttempts: 7 },
    { pseudo: "MathGenius", bestScore: 125, bestAttempts: 8 },
  ];

  res.render("index", {
    title: "Accueil",
    topPlayers: topPlayers,
    stats: {
      totalPlayers: 235,
      totalGames: 1248,
    },
  });
});

// Routes du jeu
app.get("/game", (req, res) => {
  res.send("Page principale du jeu");
});

app.get("/game/play", (req, res) => {
  try {
    res.render("game", {
      title: "Jouer",
      message: req.session.message,
      status: req.session.status,
      attempts: req.session.attempts,
    });
  } catch (err) {
    console.error("Erreur lors du rendu du template game:", err);
    res
      .status(500)
      .send("Erreur lors du rendu de la page de jeu: " + err.message);
  }
});

app.post("/game/guess", (req, res) => {
  const guess = parseInt(req.body.guess);
  const secretNumber = req.session.secretNumber;

  // Vérifier si l'entrée est un nombre valide
  if (isNaN(guess) || guess < 1 || guess > 100) {
    req.session.message =
      "Erreur ! Vous devez saisir un nombre entre 1 et 100.";
    req.session.status = "error";
    return res.redirect("/game/play");
  }

  // Incrémenter le nombre de tentatives
  req.session.attempts++;

  // Vérifier si la tentative est correcte
  if (guess === secretNumber) {
    // Sauvegarder les statistiques du joueur si nécessaire
    if (req.session.user) {
      // Mettre à jour les statistiques...
    }

    // Rediriger vers la page de victoire avec les paramètres
    res.redirect(
      `/game/win?secret=${secretNumber}&attempts=${req.session.attempts}`
    );
  } else if (guess < secretNumber) {
    req.session.message = "Vous êtes trop bas !";
    req.session.status = "low";
    res.redirect("/game/play");
  } else {
    req.session.message = "Vous êtes trop haut !";
    req.session.status = "high";
    res.redirect("/game/play");
  }
});

// Ajouter cette route dans app.js
app.get("/game/win", (req, res) => {
  // Récupérer les paramètres de l'URL
  const secretNumber = req.query.secret;
  const attempts = req.query.attempts;

  if (!secretNumber || !attempts) {
    return res.redirect("/game/play");
  }

  try {
    res.render("win", {
      title: "Victoire !",
      secretNumber: parseInt(secretNumber),
      attempts: parseInt(attempts),
      userDetails: req.session.user,
    });
  } catch (err) {
    console.error("Erreur lors du rendu du template win:", err);
    res
      .status(500)
      .send("Erreur lors du rendu de la page de victoire: " + err.message);
  }
});
app.get("/game/leaderboard", (req, res) => {
  // Données de démonstration pour le classement
  const topPlayers = [
    {
      pseudo: "MasterGuesser",
      bestScore: 250,
      bestAttempts: 4,
      gamesPlayed: 25,
      gamesWon: 22,
    },
    {
      pseudo: "LuckyNumber",
      bestScore: 200,
      bestAttempts: 5,
      gamesPlayed: 18,
      gamesWon: 15,
    },
    {
      pseudo: "NumberWizard",
      bestScore: 167,
      bestAttempts: 6,
      gamesPlayed: 30,
      gamesWon: 26,
    },
    {
      pseudo: "BinarySearchPro",
      bestScore: 143,
      bestAttempts: 7,
      gamesPlayed: 15,
      gamesWon: 12,
    },
    {
      pseudo: "MathGenius",
      bestScore: 125,
      bestAttempts: 8,
      gamesPlayed: 20,
      gamesWon: 18,
    },
  ];

  try {
    res.render("leaderboard", {
      title: "Classement",
      topPlayers,
    });
  } catch (err) {
    console.error("Erreur lors du rendu du template leaderboard:", err);
    res
      .status(500)
      .send("Erreur lors du rendu de la page de classement: " + err.message);
  }
});

app.get("/game/teams", (req, res) => {
  try {
    res.render("teams", {
      title: "Équipes",
    });
  } catch (err) {
    console.error("Erreur lors du rendu du template teams:", err);
    res
      .status(500)
      .send("Erreur lors du rendu de la page des équipes: " + err.message);
  }
});

// Routes d'authentification
app.get("/auth/login", (req, res) => {
  try {
    res.render("auth/login", {
      title: "Connexion",
    });
  } catch (err) {
    console.error("Erreur lors du rendu du template login:", err);
    res
      .status(500)
      .send("Erreur lors du rendu de la page de connexion: " + err.message);
  }
});

app.post("/auth/login", (req, res) => {
  // Simuler une connexion
  req.session.user = {
    id: "123",
    pseudo: "Utilisateur",
    email: "user@example.com",
    bestScore: 200,
    gamesPlayed: 10,
    gamesWon: 8,
    bestAttempts: 5,
  };

  res.locals.success_msg = "Vous êtes maintenant connecté";
  res.redirect("/");
});

app.get("/auth/register", (req, res) => {
  try {
    res.render("auth/register", {
      title: "Inscription",
    });
  } catch (err) {
    console.error("Erreur lors du rendu du template register:", err);
    res
      .status(500)
      .send("Erreur lors du rendu de la page d'inscription: " + err.message);
  }
});

app.post("/auth/register", (req, res) => {
  // Simuler une inscription
  req.session.user = {
    id: "123",
    pseudo: req.body.pseudo || "Nouvel Utilisateur",
    email: req.body.email || "new@example.com",
    bestScore: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    bestAttempts: null,
  };

  res.locals.success_msg = "Compte créé avec succès";
  res.redirect("/");
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Pages statiques
app.get("/about", (req, res) => {
  try {
    res.render("about", {
      title: "À propos",
    });
  } catch (err) {
    res
      .status(500)
      .send("Erreur lors du rendu de la page À propos: " + err.message);
  }
});

app.get("/rules", (req, res) => {
  try {
    res.render("rules", {
      title: "Règles du jeu",
    });
  } catch (err) {
    res
      .status(500)
      .send("Erreur lors du rendu de la page des règles: " + err.message);
  }
});

app.get("/contact", (req, res) => {
  try {
    res.render("contact", {
      title: "Contact",
    });
  } catch (err) {
    res
      .status(500)
      .send("Erreur lors du rendu de la page de contact: " + err.message);
  }
});

app.get("/legal", (req, res) => {
  try {
    res.render("legal", {
      title: "Mentions légales",
    });
  } catch (err) {
    res
      .status(500)
      .send(
        "Erreur lors du rendu de la page des mentions légales: " + err.message
      );
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  try {
    res.status(404).render("404", {
      title: "Page non trouvée",
    });
  } catch (err) {
    res.status(404).send("Page non trouvée");
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
