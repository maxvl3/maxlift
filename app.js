const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

require("dotenv").config();
const PORT = process.env.PORT || 1000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));

const exphbs = require("express-handlebars");
const handlebarsHelpers = require("handlebars-helpers")();
const hbs = exphbs.create({
  helpers: handlebarsHelpers,
});
// Voeg deze code toe vóór het instellen van de handlebars engine
hbs.handlebars.registerHelper('formatDate', function(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Maanden zijn zero-based, vandaar +1
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./views");

const exerciseSchema = new mongoose.Schema({
  exerciseName: { type: String, required: true },
  logs: [
    {
      date: { type: Date, default: Date.now },
      maxWeight: { type: Number, required: true },
      reps: { type: Number, required: true },
    },
  ],
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/", async (req, res) => {
  try {
    const exercises = await Exercise.find({}).lean();

    for (const exercise of exercises) {
      let maxWeightLifted = 0;
      let maxReps = 0;

      for (const log of exercise.logs) {
        if (log.maxWeight > maxWeightLifted) {
          maxWeightLifted = log.maxWeight;
          maxReps = log.reps; // Bijhouden van de reps voor de max weight log
        }
      }

      exercise.maxWeightLifted = maxWeightLifted;
      exercise.maxReps = maxReps; // Toevoegen van maxReps aan het exercise object
    }

    res.render("pages/home", { exercises });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching exercises.");
  }
});




app.post("/new", async (req, res) => {
  try {
    const { exerciseName } = req.body;
    const newExercise = new Exercise({ exerciseName });
    await newExercise.save();
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding exercise.");
  }
});

app.get("/exercise/:id", async (req, res) => {
  try {
    const exerciseId = req.params.id;
    const exercise = await Exercise.findById(exerciseId).lean();
    res.render("pages/exercise", { exercise });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching exercise details.");
  }
});

app.post("/exercise/:id/log", async (req, res) => {
  try {
    const { maxWeight, reps } = req.body;
    const exerciseId = req.params.id;
    await Exercise.findByIdAndUpdate(
      exerciseId,
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

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("listening for requests");
  });
});
