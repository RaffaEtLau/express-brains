// models/teamMember.js
const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  role: {
    type: String,
    enum: ["member", "admin"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Un utilisateur ne peut être membre d'une équipe qu'une seule fois
teamMemberSchema.index({ userId: 1, teamId: 1 }, { unique: true });

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

module.exports = TeamMember;
