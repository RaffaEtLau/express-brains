const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  pseudo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  bestScore: {
    type: Number,
    default: 0,
  },
  gamesPlayed: {
    type: Number,
    default: 0,
  },
  gamesWon: {
    type: Number,
    default: 0,
  },
  bestAttempts: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Méthode pour hacher le mot de passe avant de sauvegarder l'utilisateur
UserSchema.pre("save", async function (next) {
  // Si le mot de passe n'a pas été modifié, continuer
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Générer un sel
    const salt = await bcrypt.genSalt(10);
    // Hacher le mot de passe
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Méthode pour mettre à jour les statistiques après une partie
UserSchema.methods.updateStats = async function (attempts, won = true) {
  this.gamesPlayed += 1;

  if (won) {
    this.gamesWon += 1;

    // Mettre à jour le meilleur score
    if (!this.bestAttempts || attempts < this.bestAttempts) {
      this.bestAttempts = attempts;

      // Calculer le score (inversement proportionnel au nombre d'essais)
      const score = Math.round(1000 / attempts);
      if (score > this.bestScore) {
        this.bestScore = score;
      }
    }
  }

  await this.save();
};

module.exports = mongoose.model("User", UserSchema);
