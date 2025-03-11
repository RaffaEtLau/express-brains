const express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const router = express.Router();

// Middleware pour vérifier si l'utilisateur est déjà connecté
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est connecté
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash("error_msg", "Veuillez vous connecter pour accéder à cette page");
    return res.redirect("/auth/login");
  }
  next();
};

// Afficher le formulaire d'inscription
router.get("/register", isAuthenticated, (req, res) => {
  res.render("auth/register", { title: "Créer un compte" });
});

// Traiter le formulaire d'inscription
router.post(
  "/register",
  isAuthenticated,
  [
    check("email", "Veuillez entrer une adresse email valide").isEmail(),
    check(
      "pseudo",
      "Le pseudo doit contenir entre 3 et 20 caractères"
    ).isLength({ min: 3, max: 20 }),
    check(
      "password",
      "Le mot de passe doit contenir au moins 6 caractères"
    ).isLength({ min: 6 }),
    check("password2").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Les mots de passe ne correspondent pas");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("auth/register", {
        title: "Créer un compte",
        errors: errors.array(),
        email: req.body.email,
        pseudo: req.body.pseudo,
      });
    }

    try {
      // Récupérer les utilisateurs existants du localStorage côté client
      const users = [];

      // Vérifier si l'email existe déjà
      const existingEmail = users.find((user) => user.email === req.body.email);
      if (existingEmail) {
        req.flash("error_msg", "Cette adresse email est déjà utilisée");
        return res.render("auth/register", {
          title: "Créer un compte",
          email: req.body.email,
          pseudo: req.body.pseudo,
        });
      }

      // Vérifier si le pseudo existe déjà
      const existingPseudo = users.find(
        (user) => user.pseudo === req.body.pseudo
      );
      if (existingPseudo) {
        req.flash("error_msg", "Ce pseudo est déjà utilisé");
        return res.render("auth/register", {
          title: "Créer un compte",
          email: req.body.email,
          pseudo: req.body.pseudo,
        });
      }

      // Hacher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Créer un nouvel utilisateur
      const newUser = {
        id: Date.now().toString(),
        email: req.body.email,
        pseudo: req.body.pseudo,
        password: hashedPassword,
        bestScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        bestAttempts: null,
        createdAt: new Date(),
      };

      // Ajouter l'utilisateur au localStorage côté client
      // Ceci sera géré avec JavaScript côté client

      // Créer la session utilisateur
      req.session.user = {
        id: newUser.id,
        email: newUser.email,
        pseudo: newUser.pseudo,
      };

      // Rediriger vers la page d'accueil avec un message de succès
      req.flash(
        "success_msg",
        "Votre compte a été créé avec succès et vous êtes maintenant connecté."
      );
      res.redirect("/");
    } catch (error) {
      console.error(error);
      req.flash("error_msg", "Une erreur est survenue lors de l'inscription.");
      res.render("auth/register", {
        title: "Créer un compte",
        email: req.body.email,
        pseudo: req.body.pseudo,
      });
    }
  }
);

// Afficher le formulaire de connexion
router.get("/login", isAuthenticated, (req, res) => {
  res.render("auth/login", { title: "Connexion" });
});

// Traiter le formulaire de connexion
router.post("/login", isAuthenticated, async (req, res) => {
  try {
    // Dans un environnement réel, ces données proviendraient du localStorage
    // Pour cet exemple, utilisez des données en dur
    const demoUser = {
      id: "123456789",
      email: "demo@example.com",
      pseudo: "Demo",
      password: await bcrypt.hash("password123", 10),
      bestScore: 185,
      gamesPlayed: 10,
      gamesWon: 8,
      bestAttempts: 5,
      createdAt: new Date(),
    };

    // Dans une véritable implémentation, nous vérifierions les données du localStorage
    const user = req.body.email === demoUser.email ? demoUser : null;

    if (!user) {
      req.flash("error_msg", "Adresse email ou mot de passe incorrect");
      return res.render("auth/login", {
        title: "Connexion",
        email: req.body.email,
      });
    }

    // Vérifier le mot de passe (simplifiée pour la démo)
    const isMatch = req.body.password === "password123";

    if (!isMatch) {
      req.flash("error_msg", "Adresse email ou mot de passe incorrect");
      return res.render("auth/login", {
        title: "Connexion",
        email: req.body.email,
      });
    }

    // Créer la session utilisateur
    req.session.user = {
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
      bestScore: user.bestScore,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      bestAttempts: user.bestAttempts,
    };

    req.flash("success_msg", `Bienvenue, ${user.pseudo} !`);
    res.redirect("/");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Une erreur est survenue lors de la connexion.");
    res.render("auth/login", {
      title: "Connexion",
      email: req.body.email,
    });
  }
});

// Route de déconnexion
router.get("/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion:", err);
      return res.redirect("/");
    }
    res.redirect("/auth/login");
  });
});

module.exports = router;
