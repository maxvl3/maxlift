const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middlewares/auth').ensureAuthenticated;
const Exercise = require('../models/exercise');

router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const exerciseId = req.params.id;
    const exercise = await Exercise.findOne({ _id: exerciseId, user: req.user._id }).lean();
    if (!exercise) {
      return res.status(404).send('Exercise not found.');
    }
    res.render("pages/exercise", { exercise });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching exercise details.");
  }
});

router.post("/:id/log", ensureAuthenticated, async (req, res) => {
  try {
    const { maxWeight, reps } = req.body;
    const exerciseId = req.params.id;
    await Exercise.findOneAndUpdate(
      { _id: exerciseId, user: req.user._id },
      {
        $push: {
          logs: {
            maxWeight,
            reps,
          },
        },
      },
      { new: true }
    );
    res.redirect(`/exercise/${exerciseId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding log.");
  }
});

module.exports = router;
