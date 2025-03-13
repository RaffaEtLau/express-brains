// routes/index.js
const express = require("express");
const router = express.Router();

// Vérifier que les contrôleurs sont correctement importés
const homeController = require("../controllers/homeController");
const authController = require("../controllers/authController");
const gameController = require("../controllers/gameController");
const adminController = require("../controllers/adminController");
const leaderboardController = require("../controllers/leaderboardController");
const teamController = require("../controllers/teamController");
const userController = require("../controllers/userController");

const { isAuthenticated, isAdmin } = require("../middlewares/auth");

// Page d'accueil publique
router.get("/", homeController.getHome);

// Routes d'authentification
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.get("/register", authController.getRegister);
router.post("/register", authController.postRegister);
router.get("/logout", authController.logout);

// Routes de jeu (protégées)
router.get("/game/play", isAuthenticated, gameController.getGame);
router.post("/game/guess", isAuthenticated, gameController.guess); // Route classique
router.post("/game/guess-ajax", isAuthenticated, gameController.guessAjax); // Nouvelle route AJAX
router.get("/game/reset", isAuthenticated, gameController.resetGame);
// Route pour le classement
router.get("/leaderboard", leaderboardController.getLeaderboard);
router.get("/leaderboard/teams", leaderboardController.getTeamLeaderboard);

// Routes pour les équipes
router.get("/teams", teamController.listTeams);
router.get("/teams/create", isAuthenticated, teamController.createTeamForm);
router.post("/teams/create", isAuthenticated, teamController.createTeam);
router.get("/teams/:id", teamController.teamDetails);
router.get("/teams/:id/join", isAuthenticated, teamController.joinTeam);
router.get("/teams/:id/leave", isAuthenticated, teamController.leaveTeam);

// Routes utilisateur
router.get("/profile", isAuthenticated, userController.getUserProfile);
router.get("/profile/:id", isAuthenticated, userController.getUserProfile);

// Routes admin (protégées)
router.get("/admin/users", isAuthenticated, isAdmin, adminController.usersList);

module.exports = router;
