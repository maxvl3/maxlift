// const express = require("express");
// const app = express();
// const mongoose = require("mongoose");
// const bodyParser = require("body-parser");

// require("dotenv").config();
// const PORT = process.env.PORT || 1000;

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// app.use(express.static("public"));

// const exphbs = require("express-handlebars");
// const handlebarsHelpers = require("handlebars-helpers")();
// const hbs = exphbs.create({
//   helpers: handlebarsHelpers,
// });
// // Voeg deze code toe vóór het instellen van de handlebars engine
// hbs.handlebars.registerHelper('formatDate', function(date) {
//   const day = date.getDate().toString().padStart(2, '0');
//   const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Maanden zijn zero-based, vandaar +1
//   const year = date.getFullYear();
//   return `${day}/${month}/${year}`;
// });
// app.engine("handlebars", hbs.engine);
// app.set("view engine", "handlebars");
// app.set("views", "./views");

// const exerciseSchema = new mongoose.Schema({
//   exerciseName: { type: String, required: true },
//   logs: [
//     {
//       date: { type: Date, default: Date.now },
//       maxWeight: { type: Number, required: true },
//       reps: { type: Number, required: true },
//     },
//   ],
// });

// const Exercise = mongoose.model("Exercise", exerciseSchema);

// app.get("/", async (req, res) => {
//   try {
//     const exercises = await Exercise.find({}).lean();

//     for (const exercise of exercises) {
//       let maxWeightLifted = 0;
//       let maxReps = 0;

//       for (const log of exercise.logs) {
//         if (log.maxWeight > maxWeightLifted) {
//           maxWeightLifted = log.maxWeight;
//           maxReps = log.reps; // Bijhouden van de reps voor de max weight log
//         }
//       }

//       exercise.maxWeightLifted = maxWeightLifted;
//       exercise.maxReps = maxReps; // Toevoegen van maxReps aan het exercise object
//     }

//     res.render("pages/home", { exercises });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error fetching exercises.");
//   }
// });




// app.post("/new", async (req, res) => {
//   try {
//     const { exerciseName } = req.body;
//     const newExercise = new Exercise({ exerciseName });
//     await newExercise.save();
//     res.redirect("/");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error adding exercise.");
//   }
// });

// app.get("/exercise/:id", async (req, res) => {
//   try {
//     const exerciseId = req.params.id;
//     const exercise = await Exercise.findById(exerciseId).lean();
//     res.render("pages/exercise", { exercise });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error fetching exercise details.");
//   }
// });

// app.post("/exercise/:id/log", async (req, res) => {
//   try {
//     const { maxWeight, reps } = req.body;
//     const exerciseId = req.params.id;
//     await Exercise.findByIdAndUpdate(
//       exerciseId,
//       {
//         $push: {
//           logs: {
//             maxWeight,
//             reps,
//           },
//         },
//       },
//       { new: true }
//     );
//     res.redirect(`/exercise/${exerciseId}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error adding log.");
//   }
// });

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.log(error);
//     process.exit(1);
//   }
// };

// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log("listening for requests");
//   });
// });


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const exphbs = require("express-handlebars");
const handlebarsHelpers = require("handlebars-helpers")();

require("dotenv").config();
const PORT = process.env.PORT || 1000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Handlebars setup
const hbs = exphbs.create({
  helpers: handlebarsHelpers,
});
hbs.handlebars.registerHelper('formatDate', function(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Maanden zijn zero-based, vandaar +1
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
});
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./views");

// Mongoose setup
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

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Exercise schema and model
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

const Exercise = mongoose.model("Exercise", exerciseSchema);

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: 'Incorrect username.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: 'Incorrect password.' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    autoRemove: 'interval',
    autoRemoveInterval: 60 * 24 // Interval in minuten (hier: 1 dag)
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 week
}));


app.use(passport.initialize());
app.use(passport.session());

// Ensure authentication middleware
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Routes
app.get("/", ensureAuthenticated, async (req, res) => {
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

app.post("/new", ensureAuthenticated, async (req, res) => {
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

app.get("/exercise/:id", ensureAuthenticated, async (req, res) => {
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

app.post("/exercise/:id/log", ensureAuthenticated, async (req, res) => {
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

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.get('/login', (req, res) => {
  res.render('pages/login');
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error registering user.');
  }
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("listening for requests");
  });
});
