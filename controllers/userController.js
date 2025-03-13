const User = require("../models/user");
const Score = require("../models/score");
const TeamMember = require("../models/teamMember");
const Team = require("../models/team");

// Afficher la liste des utilisateurs (admin seulement)
exports.listUsers = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin
    if (!req.user?.isAdmin) {
      return res.redirect("/");
    }

    const users = await User.find().select("_id email pseudo");

    res.render("users/list", {
      title: "Liste des utilisateurs",
      users,
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).render("error", {
      title: "Erreur",
      error: "Une erreur est survenue lors de la récupération des utilisateurs",
    });
  }
};

// Afficher le profil d'un utilisateur
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.session.user.id;

    // Récupérer les informations de l'utilisateur
    const user = await User.findById(userId).select("-password");

    if (!user) {
      req.flash("error_msg", "Utilisateur non trouvé");
      return res.redirect("/");
    }

    // Récupérer les parties jouées par l'utilisateur
    const games = await Score.find({ userId }).sort({ attempts: 1 });

    // Calculer des statistiques
    const totalGames = games.length;
    const bestScore =
      totalGames > 0 ? Math.min(...games.map((game) => game.attempts)) : null;
    const averageScore =
      totalGames > 0
        ? (
            games.reduce((sum, game) => sum + game.attempts, 0) / totalGames
          ).toFixed(2)
        : null;

    // Récupérer les équipes dont l'utilisateur est membre
    const memberships = await TeamMember.find({ userId });
    const teamIds = memberships.map((m) => m.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } });

    const userTeams = teams.map((team) => {
      const membership = memberships.find(
        (m) => m.teamId.toString() === team._id.toString()
      );
      return {
        id: team._id,
        name: team.name,
        role: membership.role,
        joinedAt: membership.joinedAt,
      };
    });

    // Rendre la vue du profil
    res.render("users/profile", {
      title: `Profil de ${user.pseudo}`,
      user,
      games,
      stats: {
        totalGames,
        bestScore,
        averageScore,
      },
      teams: userTeams,
      isOwnProfile:
        req.session.user && req.session.user.id === userId.toString(),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du profil utilisateur:",
      error
    );
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la récupération du profil utilisateur"
    );
    res.redirect("/");
  }
};
