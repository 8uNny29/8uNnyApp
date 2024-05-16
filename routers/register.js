const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../config/dbconfig");

// Getting
router.get("/register", (req, res, next) => {
  if (req.session.loggedin) {
    res.redirect("/home");
  } else {
    res.render(path.join(__dirname, "../views/registerLogin/register"));
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
// End Posting

module.exports = router;
