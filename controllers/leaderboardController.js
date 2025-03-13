const Score = require("../models/score");
const User = require("../models/user");
const TeamMember = require("../models/teamMember");
const Team = require("../models/team");

exports.getLeaderboard = async (req, res) => {
  try {
    // Récupérer les meilleurs scores (nombre minimum de tentatives)
    const scores = await Score.aggregate([
      // Grouper par utilisateur et prendre le meilleur score
      {
        $group: {
          _id: "$userId",
          bestScore: { $min: "$attempts" },
          gamesCompleted: { $sum: 1 },
          lastCompletedAt: { $max: "$completedAt" },
        },
      },
      // Trier par meilleur score (ascendant)
      { $sort: { bestScore: 1, lastCompletedAt: 1 } },
      // Limiter à 20 résultats
      { $limit: 20 },
    ]);

    // Récupérer les infos utilisateurs pour les scores
    const usersMap = {};

    if (scores.length > 0) {
      const userIds = scores.map((score) => score._id);
      const users = await User.find({ _id: { $in: userIds } }).select("pseudo");

      users.forEach((user) => {
        usersMap[user._id] = user;
      });
    }

    // Formater les résultats pour l'affichage
    const leaderboard = scores.map((score) => ({
      userId: score._id,
      pseudo: usersMap[score._id]
        ? usersMap[score._id].pseudo
        : "Utilisateur inconnu",
      bestScore: score.bestScore,
      gamesCompleted: score.gamesCompleted,
      lastCompletedAt: score.lastCompletedAt,
    }));

    res.render("leaderboard", {
      title: "Classement",
      leaderboard,
    });
  } catch (error) {
    console.error("Erreur dans le classement:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la récupération du classement"
    );
    res.redirect("/");
  }
};

// Ajouter une méthode pour le classement des équipes
exports.getTeamLeaderboard = async (req, res) => {
  try {
    // Récupérer toutes les équipes
    const teams = await Team.find();

    // Pour chaque équipe, calculer les scores
    const teamScores = await Promise.all(
      teams.map(async (team) => {
        // Récupérer tous les membres de l'équipe
        const members = await TeamMember.find({ teamId: team._id });
        const memberIds = members.map((member) => member.userId);

        // Récupérer les meilleurs scores pour chaque membre
        const scores = await Score.aggregate([
          { $match: { userId: { $in: memberIds } } },
          {
            $group: {
              _id: "$userId",
              bestScore: { $min: "$attempts" },
              totalGames: { $sum: 1 },
            },
          },
        ]);

        // Calculer le score moyen de l'équipe
        let totalBestScore = 0;
        let totalMembers = 0;

        scores.forEach((score) => {
          totalBestScore += score.bestScore;
          totalMembers++;
        });

        const averageScore =
          totalMembers > 0 ? totalBestScore / totalMembers : 0;
        const totalGames = scores.reduce(
          (sum, score) => sum + score.totalGames,
          0
        );

        return {
          id: team._id,
          name: team.name,
          memberCount: members.length,
          averageScore: averageScore.toFixed(2),
          totalGames,
          activeMembers: totalMembers,
        };
      })
    );

    // Trier par score moyen (du plus petit au plus grand)
    const sortedTeams = teamScores.sort(
      (a, b) => a.averageScore - b.averageScore
    );

    res.render("leaderboard/teams", {
      title: "Classement des équipes",
      teams: sortedTeams,
    });
  } catch (error) {
    console.error("Erreur dans le classement des équipes:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la récupération du classement des équipes"
    );
    res.redirect("/");
  }
};
