const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../config/dbconfig");

// Getting
router.get("/login", (req, res, next) => {
  if (req.session.loggedin) {
    res.redirect("/home");
  } else {
    res.render(path.join(__dirname, "../views/registerLogin/login"));
  }
});
// End Getting

// Posting
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;
  const sqlGet = "SELECT * FROM accounts WHERE email = ? AND password = ?";

  db.query(sqlGet, [email, password], (err, results, rows) => {
    if (err) throw err;

    if (results.length > 0) {
      req.session.loggedin = true;
      req.session.username = results[0].username;
      req.session.email = results[0].email;
      req.session.password = results[0].password;
      req.session.idacc = results[0].id;
      res.redirect("/home");
      console.log(`[${req.session.idacc}] ${req.session.username} telah login`);
    } else {
      res.redirect("/login");
    }
  });
});
// End Posting

module.exports = router;
