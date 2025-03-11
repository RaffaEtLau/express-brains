const express = require("express");
const router = express.Router();

// Route simplifiée pour tester
router.get("/", (req, res) => {
  res.send("Page d'accueil du jeu");
});

// Route simplifiée pour jouer
router.get("/play", (req, res) => {
  res.send("Page de jeu");
});

// Route simplifiée pour le classement
router.get("/leaderboard", (req, res) => {
  res.send("Page de classement");
});

// Route simplifiée pour les équipes
router.get("/teams", (req, res) => {
  res.send("Page des équipes");
});

module.exports = router;
