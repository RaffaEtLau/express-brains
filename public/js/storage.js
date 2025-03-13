// Gestion du stockage local pour le jeu
const Storage = {
  // Sauvegarder les statistiques du joueur
  saveStats: function (stats) {
    localStorage.setItem("expressbrains_stats", JSON.stringify(stats));
  },

  // Récupérer les statistiques du joueur
  getStats: function () {
    const stats = localStorage.getItem("expressbrains_stats");
    return stats
      ? JSON.parse(stats)
      : {
          games: 0,
          wins: 0,
          bestScore: 0,
          totalAttempts: 0,
        };
  },

  // Mettre à jour les statistiques après une partie
  updateStats: function (won, attempts) {
    const stats = this.getStats();
    stats.games++;

    if (won) {
      stats.wins++;
      stats.totalAttempts += attempts;

      // Mettre à jour le meilleur score (moins d'essais est meilleur)
      if (stats.bestScore === 0 || attempts < stats.bestScore) {
        stats.bestScore = attempts;
      }
    }

    this.saveStats(stats);
    return stats;
  },
};
