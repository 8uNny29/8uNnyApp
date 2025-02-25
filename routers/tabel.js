const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../config/dbconfig");

// Getting
router.get("/admin/tabel-pendaftaran", (req, res, next) => {
  const sqlGet = "SELECT * FROM pendaftaran";

  db.query(sqlGet, (err, results) => {
    const message = req.session.message || null;
    req.session.message = null; // Hapus pesan setelah ditampilkan
    if (err) throw err;

    if (req.session.loggedin && req.session.isPengurus === "Ya") {
      // Render halaman dengan data atau pesan kosong
      res.render(path.join(__dirname, "../views/tabel/tabel-pendaftaran"), {
        accounts: results.length > 0 ? results : null, // Kirim null jika tidak ada data
        message,
      });
    } else {
      res.redirect("/login");
    }
  });
});
// End Getting

// Posting
router.post("/admin/tabel-pendaftaran/terima", (req, res, next) => {
  const { id } = req.body; // ID dari data pendaftaran yang akan diterima

  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    // Ambil data dari tabel pendaftaran berdasarkan ID
    const sqlSelect =
      "SELECT username, password, nama, kelas, divisi FROM pendaftaran WHERE id = ?";
    db.query(sqlSelect, [id], (err, results) => {
      if (err) {
        console.error("Error fetching data:", err);
        return res.status(500).send("Database error");
      }

      if (results.length === 0) {
        // Jika data tidak ditemukan
        return res.status(404).send("Data tidak ditemukan");
      }

      const { username, password, nama, kelas, divisi } = results[0];

      // Masukkan data ke tabel accounts
      const sqlInsert =
        "INSERT INTO accounts (username, password, nama, kelas, divisi) VALUES (?, ?, ?, ?, ?)";
      db.query(sqlInsert, [username, password, nama, kelas, divisi], (err) => {
        if (err) {
          console.error("Error inserting data:", err);
          return res.status(500).send("Database error");
        }

        // Hapus data dari tabel pendaftaran setelah diproses
        const sqlDelete = "DELETE FROM pendaftaran WHERE id = ?";
        db.query(sqlDelete, [id], (err) => {
          if (err) {
            console.error("Error deleting data:", err);
            return res.status(500).send("Database error");
          }

          // Redirect kembali ke halaman tabel pendaftaran
          req.session.message = "Pendaftaran berhasil diterima.";
          res.redirect("/admin/tabel-pendaftaran");
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});

router.post("/admin/tabel-pendaftaran/tolak", (req, res, next) => {
  const { id } = req.body; // ID dari data pendaftaran yang akan ditolak

  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    // Hapus data dari tabel pendaftaran berdasarkan ID
    const sqlDelete = "DELETE FROM pendaftaran WHERE id = ?";
    db.query(sqlDelete, [id], (err) => {
      if (err) {
        console.error("Error deleting data:", err);
        return res.status(500).send("Database error");
      }

      // Redirect kembali ke halaman tabel pendaftaran setelah proses selesai
      req.session.message = "Pendaftaran berhasil ditolak.";
      res.redirect("/admin/tabel-pendaftaran");
    });
  } else {
    res.redirect("/login");
  }
});

// End Posting

module.exports = router;
