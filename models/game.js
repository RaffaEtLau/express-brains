// models/game.js
const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  secretNumber: {
    type: Number,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  guessHistory: [
    {
      number: Number,
      result: String, // 'high', 'low', 'correct'
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  found: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
