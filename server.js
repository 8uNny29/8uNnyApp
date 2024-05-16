// Modules
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const sessions = require("express-session");
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);

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

io.engine.use(sessionMiddleware);

// Get Routers
const register = require("./routers/register");
const login = require("./routers/login");
const logout = require("./routers/logout");
const settings = require("./routers/settings");

// Routers
app.use("/", register, login, logout, settings);

app.get("/", (req, res, next) => {
  if (req.session.loggedin) {
    res.redirect("/home");
  } else {
    res.render("index");
  }
});

app.get("/home", (req, res, next) => {
  if (req.session.loggedin) {
    res.render("dashboard", { session: req.session });
  } else {
    res.redirect("/login");
  }
});

io.on("connection", (socket) => {
  const req = socket.request;

  if (req.session.loggedin) {
    console.log(`${req.session.username} user connected`);

    socket.on("message", (data) => {
      console.log(`${req.session.username} : ` + data);
      io.emit("message", `${req.session.username} : ` + data);
    });

    socket.on("disconnect", () => {
      console.log(`${req.session.username} user disconnected`);
    });
  }
});

const port = 1511;
server.listen(port, (req, res, next) => {
  console.log("Server berhasil berjalan di (http://127.0.0.1:1511)");
});
