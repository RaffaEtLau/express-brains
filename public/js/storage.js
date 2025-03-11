/**
 * Module de gestion du stockage côté client avec localStorage
 * Ce fichier contient les fonctions pour gérer les utilisateurs et leurs statistiques
 */

// Clés utilisées dans le localStorage
const STORAGE_KEYS = {
  USERS: "express_brains_users",
  CURRENT_USER: "express_brains_current_user",
  LEADERBOARD: "express_brains_leaderboard",
  GAME_STATS: "express_brains_game_stats",
};

/**
 * Initialiser le stockage si nécessaire
 */
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LEADERBOARD)) {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.GAME_STATS)) {
    localStorage.setItem(
      STORAGE_KEYS.GAME_STATS,
      JSON.stringify({
        totalGames: 0,
        totalWins: 0,
        averageAttempts: 0,
      })
    );
  }
}

/**
 * Récupérer tous les utilisateurs
 * @returns {Array} Liste des utilisateurs
 */
function getUsers() {
  initStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
}

/**
 * Récupérer un utilisateur par son ID
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object|null} Données de l'utilisateur ou null si non trouvé
 */
function getUserById(userId) {
  const users = getUsers();
  return users.find((user) => user.id === userId) || null;
}

/**
 * Récupérer un utilisateur par son email
 * @param {string} email - Email de l'utilisateur
 * @returns {Object|null} Données de l'utilisateur ou null si non trouvé
 */
function getUserByEmail(email) {
  const users = getUsers();
  return users.find((user) => user.email === email) || null;
}

/**
 * Récupérer un utilisateur par son pseudo
 * @param {string} pseudo - Pseudo de l'utilisateur
 * @returns {Object|null} Données de l'utilisateur ou null si non trouvé
 */
function getUserByPseudo(pseudo) {
  const users = getUsers();
  return users.find((user) => user.pseudo === pseudo) || null;
}

/**
 * Ajouter un nouvel utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Object} L'utilisateur créé
 */
function addUser(userData) {
  const users = getUsers();

  // Vérifier si l'email ou le pseudo existe déjà
  if (getUserByEmail(userData.email)) {
    throw new Error("Cette adresse email est déjà utilisée");
  }

  if (getUserByPseudo(userData.pseudo)) {
    throw new Error("Ce pseudo est déjà utilisé");
  }

  // Créer un nouvel utilisateur
  const newUser = {
    id: Date.now().toString(),
    email: userData.email,
    pseudo: userData.pseudo,
    password: userData.password, // Note: le mot de passe devrait être haché côté serveur
    bestScore: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    bestAttempts: null,
    createdAt: new Date().toISOString(),
  };

  // Ajouter l'utilisateur à la liste
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  // Renvoyer l'utilisateur sans le mot de passe
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Mettre à jour les données d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userData - Nouvelles données
 * @returns {Object|null} L'utilisateur mis à jour ou null si non trouvé
 */
function updateUser(userId, userData) {
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return null;
  }

  // Mettre à jour l'utilisateur
  users[userIndex] = { ...users[userIndex], ...userData };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  // Renvoyer l'utilisateur sans le mot de passe
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

/**
 * Mettre à jour les statistiques d'un utilisateur après une partie
 * @param {string} userId - ID de l'utilisateur
 * @param {number} attempts - Nombre de tentatives pour cette partie
 * @param {boolean} won - Si la partie a été gagnée
 * @returns {Object|null} L'utilisateur mis à jour ou null si non trouvé
 */
function updateUserStats(userId, attempts, won = true) {
  const user = getUserById(userId);

  if (!user) {
    return null;
  }

  // Mettre à jour les statistiques
  user.gamesPlayed += 1;

  if (won) {
    user.gamesWon += 1;

    // Mettre à jour le meilleur score
    if (!user.bestAttempts || attempts < user.bestAttempts) {
      user.bestAttempts = attempts;

      // Calculer le score (inversement proportionnel au nombre d'essais)
      const score = Math.round(1000 / attempts);
      if (score > user.bestScore) {
        user.bestScore = score;
      }
    }
  }

  // Mettre à jour l'utilisateur
  return updateUser(userId, user);
}

/**
 * Mettre à jour les statistiques globales du jeu
 * @param {number} attempts - Nombre de tentatives pour cette partie
 * @param {boolean} won - Si la partie a été gagnée
 */
function updateGameStats(attempts, won = true) {
  const stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATS)) || {
    totalGames: 0,
    totalWins: 0,
    averageAttempts: 0,
  };

  // Mettre à jour les statistiques
  stats.totalGames += 1;

  if (won) {
    stats.totalWins += 1;

    // Mettre à jour la moyenne des tentatives
    const totalAttempts =
      stats.averageAttempts * (stats.totalWins - 1) + attempts;
    stats.averageAttempts = totalAttempts / stats.totalWins;
  }

  localStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(stats));
}

/**
 * Récupérer le classement des meilleurs joueurs
 * @param {number} limit - Nombre maximum de joueurs à récupérer
 * @returns {Array} Liste des meilleurs joueurs
 */
function getLeaderboard(limit = 10) {
  const users = getUsers();

  // Trier les utilisateurs par score décroissant
  const sortedUsers = users
    .filter((user) => user.bestScore > 0)
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, limit)
    .map(({ password, ...user }) => user); // Supprimer le mot de passe

  return sortedUsers;
}

/**
 * Définir l'utilisateur courant (connexion)
 * @param {Object} user - Données de l'utilisateur
 */
function setCurrentUser(user) {
  // Ne pas stocker le mot de passe
  const { password, ...userWithoutPassword } = user;
  localStorage.setItem(
    STORAGE_KEYS.CURRENT_USER,
    JSON.stringify(userWithoutPassword)
  );
}

/**
 * Récupérer l'utilisateur courant
 * @returns {Object|null} Données de l'utilisateur courant ou null si non connecté
 */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
}

/**
 * Déconnecter l'utilisateur courant
 */
function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Exporter les fonctions
window.expressStorage = {
  initStorage,
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByPseudo,
  addUser,
  updateUser,
  updateUserStats,
  updateGameStats,
  getLeaderboard,
  setCurrentUser,
  getCurrentUser,
  clearCurrentUser,
};
