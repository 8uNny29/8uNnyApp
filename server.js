// Modules
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const sessions = require("express-session");
const http = require("http");
const server = http.createServer(app);

// Some settings
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "ejs");
app.set("trust proxy", 1); // trust first proxy
const sessionMiddleware = sessions({
  secret: "amay15112023",
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
});
app.use(sessionMiddleware);

// Get Routers
const auth = require("./routers/auth");
const settings = require("./routers/settings");
const data = require("./routers/data");

// Routers
app.use("/", auth, settings, data);

app.get("/", (req, res, next) => {
  res.render("index");
});

app.get("/admin", (req, res, next) => {
  if (req.session.loggedin) {
    res.render("dashboard", { session: req.session });
  } else {
    res.redirect("/login");
  }
});

const port = 1511;
server.listen(port, (req, res, next) => {
  console.log("Server berhasil berjalan di (http://localhost:1511)");
});
