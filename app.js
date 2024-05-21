const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const exphbs = require("express-handlebars");
const handlebarsHelpers = require("handlebars-helpers")();
require("dotenv").config();
const passport = require("./config/passport");

const PORT = process.env.PORT || 1000;

const compression = require("compression");
app.use(compression());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

const hbs = exphbs.create({
  helpers: {
    ...handlebarsHelpers,
    json: function (context) {
      return JSON.stringify(context);
    }
  },
});

hbs.handlebars.registerHelper('formatDate', function(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
});

// Register the new helper
hbs.handlebars.registerHelper('ifGreaterThanOrEqual', function(v1, v2, options) {
  if(v1 >= v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", "./views");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    autoRemove: 'interval',
    autoRemoveInterval: 60 * 24,
    mongooseConnection: mongoose.connection
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/", require("./routes/index"));
app.use("/", require("./routes/auth"));
app.use("/exercise", require("./routes/exercise"));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
