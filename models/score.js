const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
    required: true,
  },
  attempts: {
    type: Number,
    required: true,
  },
  secretNumber: {
    type: Number,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

const Score = mongoose.model("Score", scoreSchema);

module.exports = Score;
