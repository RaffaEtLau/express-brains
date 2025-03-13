const Game = require("../models/game");
const Score = require("../models/score");

// Obtenir et afficher le jeu
exports.getGame = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Récupérer la partie en cours ou en créer une nouvelle
    let game = await Game.findOne({
      userId: req.session.user.id,
      found: false,
    }).sort({ createdAt: -1 });

    // Créer une nouvelle partie si nécessaire
    if (!game) {
      game = new Game({
        userId: req.session.user.id,
        secretNumber: Math.floor(Math.random() * 100) + 1,
        attempts: 0,
        guessHistory: [],
        found: false,
      });
      await game.save();
    }

    res.render("game/play", {
      title: "Jouer",
      game,
      feedback: null,
    });
  } catch (error) {
    console.error("Erreur lors du chargement du jeu:", error);
    res.render("game/play", {
      title: "Jouer",
      game: null,
      feedback: {
        type: "error",
        message: "Une erreur est survenue, veuillez réessayer",
      },
    });
  }
};

// Traiter une tentative
exports.guess = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Récupérer la partie en cours
    let game = await Game.findOne({
      userId: req.session.user.id,
      found: false,
    }).sort({ createdAt: -1 });

    // Créer une nouvelle partie si nécessaire
    if (!game) {
      game = new Game({
        userId: req.session.user.id,
        secretNumber: Math.floor(Math.random() * 100) + 1,
        attempts: 0,
        guessHistory: [],
        found: false,
      });
      await game.save();
    }

    // Récupérer et valider le nombre deviné
    const guess = parseInt(req.body.guess);
    if (isNaN(guess) || guess < 1 || guess > 100) {
      return res.render("game/play", {
        title: "Jouer",
        game,
        feedback: {
          type: "error",
          message: "Veuillez entrer un nombre entre 1 et 100",
        },
      });
    }

    // Incrémenter le nombre de tentatives
    game.attempts += 1;

    // Comparer avec le nombre secret
    if (guess === game.secretNumber) {
      // Trouvé - victoire
      game.guessHistory.push({ number: guess, result: "correct" });
      game.found = true;
      await game.save();

      // Enregistrer le score
      const score = new Score({
        userId: req.session.user.id,
        gameId: game._id,
        attempts: game.attempts,
        secretNumber: game.secretNumber,
        completedAt: new Date(),
      });
      await score.save();

      return res.render("game/play", {
        title: "Jouer",
        game,
        feedback: {
          type: "success",
          message: "Bravo ! Vous avez trouvé le nombre mystère",
        },
      });
    } else if (guess < game.secretNumber) {
      // Trop bas
      game.guessHistory.push({ number: guess, result: "low" });
      await game.save();

      return res.render("game/play", {
        title: "Jouer",
        game,
        feedback: {
          type: "low",
          message: "Vous êtes trop bas !",
        },
      });
    } else {
      // Trop haut
      game.guessHistory.push({ number: guess, result: "high" });
      await game.save();

      return res.render("game/play", {
        title: "Jouer",
        game,
        feedback: {
          type: "high",
          message: "Vous êtes trop haut !",
        },
      });
    }
  } catch (error) {
    console.error("Erreur lors du traitement de la tentative:", error);
    res.render("game/play", {
      title: "Jouer",
      game: null,
      feedback: {
        type: "error",
        message: "Une erreur est survenue, veuillez réessayer",
      },
    });
  }
};

// Version AJAX pour traiter une tentative
exports.guessAjax = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user) {
      return res.status(401).json({
        error: "Vous devez être connecté pour jouer",
        feedbackType: "error",
        feedbackMessage: "Vous devez être connecté pour jouer",
      });
    }

    // Récupérer la partie en cours
    let game = await Game.findOne({
      userId: req.session.user.id,
      found: false,
    }).sort({ createdAt: -1 });

    // Créer une nouvelle partie si nécessaire
    if (!game) {
      game = new Game({
        userId: req.session.user.id,
        secretNumber: Math.floor(Math.random() * 100) + 1,
        attempts: 0,
        guessHistory: [],
        found: false,
      });
      await game.save();
    }

    // Récupérer et valider le nombre deviné
    const guess = parseInt(req.body.guess);
    if (isNaN(guess) || guess < 1 || guess > 100) {
      return res.json({
        guess: guess,
        error: "Veuillez entrer un nombre entre 1 et 100",
        feedbackType: "error",
        feedbackMessage: "Veuillez entrer un nombre entre 1 et 100",
      });
    }

    // Incrémenter le nombre de tentatives
    game.attempts += 1;

    // Comparer avec le nombre secret
    if (guess === game.secretNumber) {
      // Trouvé - victoire
      game.guessHistory.push({ number: guess, result: "correct" });
      game.found = true;
      await game.save();

      // Enregistrer le score
      const score = new Score({
        userId: req.session.user.id,
        gameId: game._id,
        secretNumber: game.secretNumber,
        attempts: game.attempts,
        completedAt: new Date(),
      });
      await score.save();

      return res.json({
        found: true,
        guess: guess,
        attempts: game.attempts,
        secretNumber: game.secretNumber,
        feedbackType: "success",
        feedbackMessage: "Bravo ! Vous avez trouvé le nombre mystère",
      });
    } else if (guess < game.secretNumber) {
      // Trop bas
      game.guessHistory.push({ number: guess, result: "low" });
      await game.save();

      return res.json({
        found: false,
        guess: guess,
        attempts: game.attempts,
        feedbackType: "low",
        feedbackMessage: "Vous êtes trop bas !",
      });
    } else {
      // Trop haut
      game.guessHistory.push({ number: guess, result: "high" });
      await game.save();

      return res.json({
        found: false,
        guess: guess,
        attempts: game.attempts,
        feedbackType: "high",
        feedbackMessage: "Vous êtes trop haut !",
      });
    }
  } catch (error) {
    console.error("Erreur lors du traitement AJAX:", error);
    res.status(500).json({
      error: "Une erreur est survenue, veuillez réessayer",
      feedbackType: "error",
      feedbackMessage: "Une erreur est survenue, veuillez réessayer",
    });
  }
};

// Réinitialiser le jeu
exports.resetGame = async (req, res) => {
  try {
    // Vérifier l'authentification
    if (!req.session.user) {
      return res.redirect("/login");
    }

    // Créer une nouvelle partie
    const game = new Game({
      userId: req.session.user.id,
      secretNumber: Math.floor(Math.random() * 100) + 1,
      attempts: 0,
      guessHistory: [],
      found: false,
    });
    await game.save();

    res.redirect("/game/play");
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du jeu:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la réinitialisation du jeu"
    );
    res.redirect("/game/play");
  }
};
