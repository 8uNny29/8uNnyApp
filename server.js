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
const dataAnggota = require("./routers/data/anggota");
const dataKeuangan = require("./routers/data/keuangan");
const tabel = require("./routers/tabel");

// Routers
app.use("/", auth, settings, dataAnggota, dataKeuangan, tabel);

app.get("/", (req, res, next) => {
  res.render("index");
});

app.get("/admin", (req, res, next) => {
  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    res.render(path.join(__dirname, "/views/admins/panel"), {
      session: req.session,
    });
  } else {
    res.redirect("/dashboard");
  }
});

// Middleware untuk menangani berbagai kode status
app.use((err, req, res, next) => {
  // Tetapkan status default ke 500 jika tidak ada
  const statusCode = err.status || 500;

  // Pastikan kode status valid
  if (!res.statusCode || res.statusCode < 400) {
    res.status(statusCode);
  }

  // Render halaman error sesuai dengan statusCode
  res.render("errorcode", {
    statusCode: statusCode,
    message: err.message || "Terjadi kesalahan.",
    url: req.originalUrl,
  });
});

// Middleware untuk 404 (halaman tidak ditemukan)
app.use((req, res) => {
  res.status(404).render("errorcode", {
    statusCode: 404,
    message: "Halaman tidak ditemukan.",
    url: req.originalUrl,
  });
});

const port = 1511;
server.listen(port, (req, res, next) => {
  console.log("Server berhasil berjalan di (http://localhost:1511)");
});
