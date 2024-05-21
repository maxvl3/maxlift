const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exerciseName: { type: String, required: true },
  logs: [
    {
      date: { type: Date, default: Date.now },
      maxWeight: { type: Number, required: true },
      reps: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model("Exercise", exerciseSchema);
