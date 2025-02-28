const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../config/dbconfig"); // Sesuaikan path database Anda

// GET
// Halaman utama
router.get("/", (req, res, next) => {
  const query = "SELECT * FROM divisi";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from database:", err);
      return res.status(500).send("Database error");
    }

    const divisi = results;

    res.render("index", { divisi, req });
  });
});

// Halamam divisi
router.get("/divisi", (req, res, next) => {
  const query = "SELECT * FROM divisi";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from database:", err);
      return res.status(500).send("Database error");
    }

    const divisi = results;

    res.render("index/divisi", { divisi, req });
  });
});

// Halamam aktivitas
router.get("/aktivitas", (req, res, next) => {
  const query = "SELECT * FROM aktivitas";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from database:", err);
      return res.status(500).send("Database error");
    }

    const aktivitas = results;

    res.render("index/aktivitas", { aktivitas, req });
  });
});

// Halamam blog
router.get("/blog", (req, res, next) => {
  const query = "SELECT * FROM blog";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data from database:", err);
      return res.status(500).send("Database error");
    }

    const blog = results;

    res.render("index/blog", { blog, req });
  });
});

// Halamam tentang
router.get("/tentang", (req, res, next) => {
  res.render("index/tentang", {
    req,
  });
});

// Halamam kontak
router.get("/kontak", (req, res, next) => {
  res.render("index/kontak", { req });
});
// END GET

module.exports = router;
