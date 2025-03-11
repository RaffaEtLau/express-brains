const express = require("express");
const router = express.Router();

// Middleware pour vérifier si l'utilisateur est connecté
const isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    req.flash("error_msg", "Veuillez vous connecter pour accéder à cette page");
    return res.redirect("/auth/login");
  }
  next();
};

// Middleware pour initialiser le jeu si nécessaire
const initGame = (req, res, next) => {
  // Réinitialiser le jeu
  req.session.secretNumber = Math.floor(Math.random() * 100) + 1;
  req.session.attempts = 0;
  req.session.message = null;
  req.session.status = null;
  next();
};

// Route pour commencer une nouvelle partie
router.get("/play", initGame, (req, res) => {
  console.log("Nouveau nombre secret:", req.session.secretNumber);

  res.render("game", {
    title: "Jouer",
    message: req.session.message,
    status: req.session.status,
    attempts: req.session.attempts,
  });
});

// Route pour traiter une tentative
router.post("/guess", async (req, res) => {
  const guess = parseInt(req.body.guess);
  const secretNumber = req.session.secretNumber;

  // Vérifier si l'entrée est un nombre valide
  if (isNaN(guess) || guess < 1 || guess > 100) {
    req.session.message =
      "Erreur ! Vous devez saisir un nombre entre 1 et 100.";
    req.session.status = "error";
    return res.render("game", {
      title: "Jouer",
      message: req.session.message,
      status: req.session.status,
      attempts: req.session.attempts,
    });
  }

  // Incrémenter le nombre de tentatives
  req.session.attempts++;

  // Vérifier si la tentative est correcte
  if (guess === secretNumber) {
    // Si l'utilisateur est connecté, mettre à jour ses statistiques
    if (req.session.user) {
      try {
        // Dans une vraie implémentation, nous mettrions à jour les statistiques dans localStorage
        // Ici, on met simplement à jour la session pour la démonstration
        req.session.user.gamesPlayed = (req.session.user.gamesPlayed || 0) + 1;
        req.session.user.gamesWon = (req.session.user.gamesWon || 0) + 1;

        // Mettre à jour le meilleur score si nécessaire
        if (
          !req.session.user.bestAttempts ||
          req.session.attempts < req.session.user.bestAttempts
        ) {
          req.session.user.bestAttempts = req.session.attempts;

          // Calculer le score (inversement proportionnel au nombre d'essais)
          const score = Math.round(1000 / req.session.attempts);
          if (score > (req.session.user.bestScore || 0)) {
            req.session.user.bestScore = score;
          }
        }

        console.log(
          `Statistiques mises à jour pour ${req.session.user.pseudo}: ${req.session.attempts} tentatives`
        );
      } catch (error) {
        console.error("Erreur lors de la mise à jour des statistiques:", error);
      }
    }

    return res.render("win", {
      title: "Victoire !",
      secretNumber,
      attempts: req.session.attempts,
      userDetails: req.session.user,
    });
  } else if (guess < secretNumber) {
    req.session.message = "Vous êtes trop bas !";
    req.session.status = "low";
    return res.render("game", {
      title: "Jouer",
      message: req.session.message,
      status: req.session.status,
      attempts: req.session.attempts,
    });
  } else {
    req.session.message = "Vous êtes trop haut !";
    req.session.status = "high";
    return res.render("game", {
      title: "Jouer",
      message: req.session.message,
      status: req.session.status,
      attempts: req.session.attempts,
    });
  }
});

// Route pour afficher le classement
router.get("/leaderboard", (req, res) => {
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

  res.render("leaderboard", {
    title: "Classement",
    topPlayers,
  });
});

// Route pour la page des équipes
router.get("/teams", (req, res) => {
  res.render("teams", {
    title: "Équipes",
  });
});

// Route pour voir son profil (nécessite d'être connecté)
router.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile", {
    title: "Mon Profil",
    userDetails: req.session.user,
  });
});

module.exports = router;
