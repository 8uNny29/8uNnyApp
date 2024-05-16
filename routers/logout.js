const express = require("express");
const router = express.Router();
const db = require("../config/dbconfig");

// Getting
router.get("/logout", (req, res, next) => {
  if (req.session.loggedin) {
    req.session.username = null;
    req.session.email = null;
    req.session.password = null;
    req.session.idacc = null;
    req.session.save(function (err) {
      if (err) next(err);

      req.session.regenerate(function (err) {
        if (err) next(err);
        res.redirect("/login");
      });
    });
  }
});
// End Getting

// Posting
router.post("/register", (req, res, next) => {
  const { username, email, password } = req.body;
  const sqlInsert =
    "INSERT INTO accounts (username, email, password) VALUES (?,?,?)";

  db.query(sqlInsert, [username, email, password], (err, results, rows) => {
    if (err) throw err;
    console.log(`${username} berhasil mendaftar!`);
    res.redirect("/login");
  });
});

router.post("/login", (req, res, next) => {
  const { email, password } = req.body;
  const sqlGet = "SELECT * FROM accounts WHERE email = ? AND password = ?";

  db.query(sqlGet, [email, password], (err, results, rows) => {
    if (err) throw err;

    if (results.length > 0) {
      req.session.loggedin = true;
      req.session.username = results[0].username;
      res.redirect("/home");
      console.log(`${req.session.username} telah login`);
    } else {
      res.redirect("/login");
    }
  });
});
// End Posting

module.exports = router;
