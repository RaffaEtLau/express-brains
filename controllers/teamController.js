const mongoose = require("mongoose");
const Team = require("../models/team");
const TeamMember = require("../models/teamMember");
const User = require("../models/user");
const Score = require("../models/score");

// Afficher la liste des équipes
exports.listTeams = async (req, res) => {
  try {
    // Récupérer toutes les équipes
    const teams = await Team.find().sort({ name: 1 });

    // Pour chaque équipe, récupérer le nombre de membres
    const teamsWithMemberCount = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await TeamMember.countDocuments({
          teamId: team._id,
        });

        // Vérifier si l'utilisateur actuel est membre de cette équipe
        const isMember = req.session.user
          ? await TeamMember.findOne({
              userId: req.session.user.id,
              teamId: team._id,
            })
          : null;

        return {
          ...team.toObject(),
          memberCount,
          isMember: !!isMember,
          role: isMember ? isMember.role : null,
        };
      })
    );

    res.render("teams/list", {
      title: "Équipes",
      teams: teamsWithMemberCount,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la récupération des équipes"
    );
    res.redirect("/");
  }
};

// Afficher le formulaire de création d'équipe
exports.createTeamForm = (req, res) => {
  res.render("teams/create", {
    title: "Créer une équipe",
  });
};

// Traiter la création d'équipe
exports.createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name) {
      req.flash("error_msg", "Le nom de l'équipe est obligatoire");
      return res.redirect("/teams/create");
    }

    // Vérifier que le nom n'est pas déjà utilisé
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      req.flash("error_msg", "Ce nom d'équipe est déjà utilisé");
      return res.redirect("/teams/create");
    }

    // Créer l'équipe
    const team = new Team({
      name,
      description,
      createdBy: req.session.user.id,
    });

    await team.save();

    // Ajouter le créateur comme membre admin
    const teamMember = new TeamMember({
      userId: req.session.user.id,
      teamId: team._id,
      role: "admin",
    });

    await teamMember.save();

    req.flash("success_msg", "Équipe créée avec succès");
    res.redirect("/teams");
  } catch (error) {
    console.error("Erreur lors de la création de l'équipe:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la création de l'équipe"
    );
    res.redirect("/teams/create");
  }
};

// Afficher les détails d'une équipe
exports.teamDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'équipe
    const team = await Team.findById(id);

    if (!team) {
      req.flash("error_msg", "Équipe non trouvée");
      return res.redirect("/teams");
    }

    // Récupérer les membres
    const membersData = await TeamMember.find({ teamId: id });
    const userIds = membersData.map((member) => member.userId);

    const users = await User.find({ _id: { $in: userIds } }).select("pseudo");

    // Combiner les données de membre avec les données utilisateur
    const members = membersData.map((member) => {
      const user = users.find(
        (u) => u._id.toString() === member.userId.toString()
      );
      return {
        id: member._id,
        userId: member.userId,
        pseudo: user ? user.pseudo : "Utilisateur inconnu",
        role: member.role,
        joinedAt: member.joinedAt,
      };
    });

    // Vérifier si l'utilisateur actuel est membre
    const userMembership = req.session.user
      ? await TeamMember.findOne({ userId: req.session.user.id, teamId: id })
      : null;

    // Récupérer les scores de l'équipe
    const teamScores = await Score.aggregate([
      // Joindre avec TeamMember pour récupérer les scores des membres de l'équipe
      {
        $lookup: {
          from: "teammembers",
          localField: "userId",
          foreignField: "userId",
          as: "membership",
        },
      },
      // Filtrer pour ne garder que les scores des membres de cette équipe
      {
        $match: {
          "membership.teamId": {
            $eq: mongoose.Types.ObjectId.createFromHexString(id),
          },
        },
      },
      // Grouper par utilisateur et prendre le meilleur score
      {
        $group: {
          _id: "$userId",
          bestScore: { $min: "$attempts" },
          gamesCompleted: { $sum: 1 },
        },
      },
      // Trier par meilleur score
      {
        $sort: { bestScore: 1 },
      },
    ]);

    // Récupérer les noms des utilisateurs pour les scores
    const scoreUserIds = teamScores.map((score) => score._id);
    const scoreUsers = await User.find({ _id: { $in: scoreUserIds } }).select(
      "pseudo"
    );

    const formattedScores = teamScores.map((score) => {
      const user = scoreUsers.find(
        (u) => u._id.toString() === score._id.toString()
      );
      return {
        userId: score._id,
        pseudo: user ? user.pseudo : "Utilisateur inconnu",
        bestScore: score.bestScore,
        gamesCompleted: score.gamesCompleted,
      };
    });

    res.render("teams/details", {
      title: team.name,
      team,
      members,
      scores: formattedScores,
      isMember: !!userMembership,
      isAdmin: userMembership && userMembership.role === "admin",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails de l'équipe:",
      error
    );
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la récupération des détails de l'équipe"
    );
    res.redirect("/teams");
  }
};

// Rejoindre une équipe
exports.joinTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'équipe existe
    const team = await Team.findById(id);
    if (!team) {
      req.flash("error_msg", "Équipe non trouvée");
      return res.redirect("/teams");
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMembership = await TeamMember.findOne({
      userId: req.session.user.id,
      teamId: id,
    });

    if (existingMembership) {
      req.flash("error_msg", "Vous êtes déjà membre de cette équipe");
      return res.redirect(`/teams/${id}`);
    }

    // Créer l'appartenance
    const teamMember = new TeamMember({
      userId: req.session.user.id,
      teamId: id,
      role: "member",
    });

    await teamMember.save();

    req.flash("success_msg", `Vous avez rejoint l'équipe ${team.name}`);
    res.redirect(`/teams/${id}`);
  } catch (error) {
    console.error("Erreur lors de l'adhésion à l'équipe:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de l'adhésion à l'équipe"
    );
    res.redirect("/teams");
  }
};

// Quitter une équipe
exports.leaveTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'équipe existe
    const team = await Team.findById(id);
    if (!team) {
      req.flash("error_msg", "Équipe non trouvée");
      return res.redirect("/teams");
    }

    // Vérifier si l'utilisateur est membre
    const membership = await TeamMember.findOne({
      userId: req.session.user.id,
      teamId: id,
    });

    if (!membership) {
      req.flash("error_msg", "Vous n'êtes pas membre de cette équipe");
      return res.redirect(`/teams/${id}`);
    }

    // Vérifier si l'utilisateur est le dernier admin
    if (membership.role === "admin") {
      const adminCount = await TeamMember.countDocuments({
        teamId: id,
        role: "admin",
      });

      if (adminCount <= 1) {
        req.flash(
          "error_msg",
          "Vous ne pouvez pas quitter l'équipe car vous êtes le dernier administrateur"
        );
        return res.redirect(`/teams/${id}`);
      }
    }

    // Supprimer l'appartenance
    await TeamMember.deleteOne({ _id: membership._id });

    req.flash("success_msg", `Vous avez quitté l'équipe ${team.name}`);
    res.redirect("/teams");
  } catch (error) {
    console.error("Erreur lors du départ de l'équipe:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors du départ de l'équipe"
    );
    res.redirect("/teams");
  }
};
