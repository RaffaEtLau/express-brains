const express = require("express");
const router = express.Router();

// Route pour la page d'accueil
router.get("/", (req, res) => {
  // Données de démonstration pour les statistiques
  const stats = {
    totalPlayers: 235,
    totalGames: 1248,
  };

  // Données de démonstration pour les meilleurs joueurs
  const topPlayers = [
    { pseudo: "MasterGuesser", bestScore: 250, bestAttempts: 4 },
    { pseudo: "LuckyNumber", bestScore: 200, bestAttempts: 5 },
    { pseudo: "NumberWizard", bestScore: 167, bestAttempts: 6 },
    { pseudo: "BinarySearchPro", bestScore: 143, bestAttempts: 7 },
    { pseudo: "MathGenius", bestScore: 125, bestAttempts: 8 },
  ];

  res.render("index", {
    title: "Accueil",
    stats,
    topPlayers,
  });
});

// Route pour les pages statiques
router.get("/about", (req, res) => {
  res.render("about", {
    title: "À propos",
  });
});

router.get("/rules", (req, res) => {
  res.render("rules", {
    title: "Règles du jeu",
  });
});

router.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact",
  });
});

// Route pour les mentions légales
router.get("/legal", (req, res) => {
  res.render("legal", {
    title: "Mentions légales",
  });
});

// Route pour la page 404 (catch-all pour les routes non trouvées)
router.get("*", (req, res) => {
  res.status(404).render("404", {
    title: "Page non trouvée",
  });
});

module.exports = router;
