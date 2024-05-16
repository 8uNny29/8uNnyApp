const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../config/dbconfig");

// Getting
router.get("/settings", (req, res, next) => {
  if (req.session.loggedin) {
    res.render(path.join(__dirname, "../views/settings/settings"), {
      session: req.session,
    });
  } else {
    res.redirect("/login");
  }
});
// End Getting

// Posting
router.post("/settings", (req, res, next) => {
  const { username, email, password } = req.body;
  const sqlUpdate =
    "UPDATE accounts SET username = ?, email = ?, password = ? WHERE id = ?";

  db.query(
    sqlUpdate,
    [username, email, password, req.session.idacc],
    (err, results, rows) => {
      if (err) throw err;
    }
  );
  //Resetting
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
// End Posting

module.exports = router;
