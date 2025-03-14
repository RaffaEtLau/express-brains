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

    // Récupérer l'équipe actuelle de l'utilisateur, s'il en a une
    let currentUserTeam = null;
    if (req.session.user) {
      currentUserTeam = await TeamMember.findOne({
        userId: req.session.user.id,
      });
    }

    // Pour chaque équipe, récupérer le nombre de membres
    const teamsWithMemberCount = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await TeamMember.countDocuments({
          teamId: team._id,
        });

        // Vérifier si l'utilisateur actuel est membre de cette équipe
        const isMember =
          req.session.user && currentUserTeam
            ? currentUserTeam.teamId.toString() === team._id.toString()
            : false;

        return {
          ...team.toObject(),
          memberCount,
          isMember: isMember,
          role: isMember && currentUserTeam ? currentUserTeam.role : null,
        };
      })
    );

    res.render("teams/list", {
      title: "Équipes",
      teams: teamsWithMemberCount,
      userHasTeam: !!currentUserTeam,
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
exports.createTeamForm = async (req, res) => {
  try {
    // Vérifier si l'utilisateur fait déjà partie d'une équipe
    const existingMembership = await TeamMember.findOne({
      userId: req.session.user.id,
    });

    if (existingMembership) {
      req.flash(
        "error_msg",
        "Vous faites déjà partie d'une équipe. Vous devez la quitter avant d'en créer une nouvelle."
      );
      return res.redirect("/teams");
    }

    res.render("teams/create", {
      title: "Créer une équipe",
    });
  } catch (error) {
    console.error("Erreur lors de l'accès au formulaire de création:", error);
    req.flash("error_msg", "Une erreur est survenue");
    res.redirect("/teams");
  }
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

    // Vérifier si l'utilisateur fait déjà partie d'une équipe
    const existingMembership = await TeamMember.findOne({
      userId: req.session.user.id,
    });

    if (existingMembership) {
      req.flash(
        "error_msg",
        "Vous faites déjà partie d'une équipe. Vous devez la quitter avant d'en créer une nouvelle."
      );
      return res.redirect("/teams");
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

    // Récupérer l'équipe actuelle de l'utilisateur, s'il en a une
    let currentUserTeam = null;
    if (req.session.user) {
      currentUserTeam = await TeamMember.findOne({
        userId: req.session.user.id,
      });
    }

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
      userHasTeam: !!currentUserTeam,
      canJoin:
        !currentUserTeam ||
        currentUserTeam.teamId.toString() === team._id.toString(),
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

    // Vérifier si l'utilisateur est déjà membre d'une équipe
    const existingMembership = await TeamMember.findOne({
      userId: req.session.user.id,
    });

    if (existingMembership) {
      // S'il est déjà dans cette équipe
      if (existingMembership.teamId.toString() === id) {
        req.flash("error_msg", "Vous êtes déjà membre de cette équipe");
        return res.redirect(`/teams/${id}`);
      } else {
        // S'il est dans une autre équipe
        req.flash(
          "error_msg",
          "Vous faites déjà partie d'une équipe. Vous devez la quitter avant d'en rejoindre une nouvelle."
        );
        return res.redirect("/teams");
      }
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
        // Si c'est le dernier admin, vérifiez s'il y a d'autres membres
        const memberCount = await TeamMember.countDocuments({
          teamId: id,
        });

        if (memberCount > 1) {
          req.flash(
            "error_msg",
            "Vous ne pouvez pas quitter l'équipe car vous êtes le dernier administrateur. Veuillez d'abord promouvoir un autre membre en administrateur."
          );
          return res.redirect(`/teams/${id}`);
        } else {
          // Si l'admin est le seul membre, supprimez l'équipe
          await Team.deleteOne({ _id: id });
          await TeamMember.deleteOne({ _id: membership._id });

          req.flash(
            "success_msg",
            `L'équipe ${team.name} a été supprimée car vous étiez le dernier membre`
          );
          return res.redirect("/teams");
        }
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

// Promouvoir un membre au rang d'administrateur
exports.promoteMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;

    // Vérifier si l'utilisateur actuel est admin de l'équipe
    const currentUserMembership = await TeamMember.findOne({
      userId: req.session.user.id,
      teamId: teamId,
      role: "admin",
    });

    if (!currentUserMembership) {
      req.flash(
        "error_msg",
        "Vous n'avez pas les droits d'administrateur pour cette équipe"
      );
      return res.redirect(`/teams/${teamId}`);
    }

    // Récupérer le membre à promouvoir
    const memberToPromote = await TeamMember.findById(memberId);

    if (!memberToPromote || memberToPromote.teamId.toString() !== teamId) {
      req.flash("error_msg", "Membre non trouvé dans cette équipe");
      return res.redirect(`/teams/${teamId}`);
    }

    // Promouvoir le membre
    memberToPromote.role = "admin";
    await memberToPromote.save();

    // Récupérer les informations de l'utilisateur promu
    const user = await User.findById(memberToPromote.userId);
    const username = user ? user.pseudo : "Utilisateur inconnu";

    req.flash(
      "success_msg",
      `${username} a été promu administrateur de l'équipe`
    );
    res.redirect(`/teams/${teamId}`);
  } catch (error) {
    console.error("Erreur lors de la promotion du membre:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la promotion du membre"
    );
    res.redirect(`/teams/${req.params.teamId}`);
  }
};
