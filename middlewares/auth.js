/**
 * Middleware d'authentification pour Express Brains
 * Ce fichier contient les fonctions middleware pour vérifier l'authentification de l'utilisateur
 */

const User = require("../models/user");

/**
 * Middleware qui vérifie si l'utilisateur est connecté
 * Si l'utilisateur n'est pas connecté, il est redirigé vers la page de connexion
 */
exports.isLoggedIn = (req, res, next) => {
  // Vérifier si l'utilisateur a une session active
  if (!req.session.user) {
    req.flash("error_msg", "Veuillez vous connecter pour accéder à cette page");
    return res.redirect("/auth/login");
  }
  // L'utilisateur est connecté, continuer
  next();
};

/**
 * Middleware qui vérifie si l'utilisateur n'est pas connecté
 * Utilisé pour empêcher l'accès aux pages de connexion/inscription si l'utilisateur est déjà connecté
 */
exports.isNotLoggedIn = (req, res, next) => {
  // Si l'utilisateur est déjà connecté, le rediriger vers la page d'accueil
  if (req.session.user) {
    return res.redirect("/");
  }
  // L'utilisateur n'est pas connecté, continuer
  next();
};

/**
 * Middleware pour charger les informations complètes de l'utilisateur depuis la base de données
 * et les mettre à disposition dans req.userDetails pour les routes suivantes
 */
exports.loadUserDetails = async (req, res, next) => {
  try {
    // Si l'utilisateur est connecté, charger ses informations complètes
    if (req.session.user) {
      const userDetails = await User.findById(req.session.user.id);
      if (userDetails) {
        // Ne pas inclure le mot de passe dans les détails
        req.userDetails = {
          id: userDetails._id,
          email: userDetails.email,
          pseudo: userDetails.pseudo,
          bestScore: userDetails.bestScore,
          gamesPlayed: userDetails.gamesPlayed,
          gamesWon: userDetails.gamesWon,
          bestAttempts: userDetails.bestAttempts,
          createdAt: userDetails.createdAt,
        };
      }
    }
    next();
  } catch (error) {
    console.error("Erreur lors du chargement des détails utilisateur:", error);
    next();
  }
};

/**
 * Middleware pour vérifier si l'utilisateur a les droits d'administrateur
 * Utilisé pour protéger les routes réservées aux administrateurs
 */
exports.isAdmin = (req, res, next) => {
  // Vérifier si l'utilisateur est connecté et a le rôle d'administrateur
  if (
    !req.session.user ||
    !req.userDetails ||
    req.userDetails.role !== "admin"
  ) {
    req.flash("error_msg", "Accès non autorisé");
    return res.redirect("/");
  }
  // L'utilisateur est un administrateur, continuer
  next();
};

/**
 * Rendre les informations utilisateur disponibles pour toutes les vues
 */
exports.attachUserToLocals = (req, res, next) => {
  // Ajouter l'utilisateur et les détails utilisateur aux variables locales pour les vues
  res.locals.user = req.session.user || null;
  res.locals.userDetails = req.userDetails || null;
  next();
};
