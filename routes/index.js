const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middlewares/auth').ensureAuthenticated;
const Exercise = require('../models/exercise');

router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const exercises = await Exercise.find({ user: req.user._id }).lean();

    for (const exercise of exercises) {
      let maxWeightLifted = 0;
      let maxReps = 0;

      for (const log of exercise.logs) {
        if (log.maxWeight > maxWeightLifted) {
          maxWeightLifted = log.maxWeight;
          maxReps = log.reps;
        }
      }

      exercise.maxWeightLifted = maxWeightLifted;
      exercise.maxReps = maxReps;
    }

    res.render('pages/home', { exercises, user: req.user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching exercises.');
  }
});

router.post("/new", ensureAuthenticated, async (req, res) => {
  try {
    const { exerciseName } = req.body;
    const newExercise = new Exercise({ exerciseName, user: req.user._id });
    await newExercise.save();
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding exercise.");
  }
});

module.exports = router;
