const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../config/dbconfig");
const bcrypt = require("bcrypt");
const validator = require("validator");

// Getting
router.get("/login", (req, res, next) => {
  if (req.session.loggedin) {
    res.redirect("/admin");
  } else {
    res.render(path.join(__dirname, "../views/auth/login"));
  }
});

router.get("/register", (req, res, next) => {
  if (req.session.loggedin) {
    res.redirect("/");
  } else {
    res.render(path.join(__dirname, "../views/auth/register"));
  }
});

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
        res.redirect("/");
      });
    });
  }
});
// End Getting

// Posting
router.post("/login", (req, res) => {
  try {
    let { username, password } = req.body;

    // Validasi input kosong
    if (!username || !password) {
      return res.status(400).send("Username dan password harus diisi!");
    }

    // Escape karakter sensitif
    username = validator.escape(username.trim());
    password = password.trim();

    // Query data berdasarkan username (case-sensitive)
    const sqlGet = "SELECT * FROM accounts WHERE BINARY username = ?";
    db.query(sqlGet, [username], (err, results) => {
      if (err) {
        console.error("Terjadi kesalahan saat query:", err);
        return res
          .status(500)
          .send("Terjadi kesalahan server. Silakan coba lagi nanti.");
      }

      // Cek apakah user ditemukan
      if (results.length === 0) {
        return res.status(401).send("Username atau password salah!");
      }

      // Ambil user dari hasil query
      const user = results[0];

      // Verifikasi password
      bcrypt.compare(password, user.password, (err, isPasswordValid) => {
        if (err) {
          console.error("Kesalahan saat verifikasi password:", err);
          return res
            .status(500)
            .send("Terjadi kesalahan server. Silakan coba lagi nanti.");
        }

        if (!isPasswordValid) {
          return res.status(401).send("Username atau password salah!");
        }

        // Set session
        req.session.loggedin = true;
        req.session.user_id = user.id;

        console.log(`[${user.id}] ${username} telah login`);
        res.redirect("/admin");
      });
    });
  } catch (error) {
    console.error("Terjadi kesalahan saat login:", error);
    res.status(500).send("Terjadi kesalahan server. Silakan coba lagi nanti.");
  }
});

router.post("/register", async (req, res) => {
  try {
    let { username, namaLengkap, kelas, divisi, password, confirm_password } =
      req.body;

    // Validasi input kosong
    if (!username || !password || !confirm_password) {
      return res.status(400).send("Semua field harus diisi!");
    }

    // Escape karakter sensitif
    username = validator.escape(username.trim());
    namaLengkap = validator.escape(namaLengkap.trim());
    kelas = validator.escape(kelas.trim());
    divisi = validator.escape(divisi.trim());
    password = password.trim();
    confirm_password = confirm_password.trim();

    // Validasi username hanya alfanumerik
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).send("Username mengandung karakter tidak valid!");
    }

    // Validasi password minimal 8 karakter
    if (password.length < 8) {
      return res.status(400).send("Password harus minimal 8 karakter!");
    }

    // Validasi konfirmasi password
    if (password !== confirm_password) {
      return res
        .status(400)
        .send("Password dan konfirmasi password tidak cocok!");
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan data ke database
    const sqlInsert =
      "INSERT INTO accounts (username, nama, kelas, divisi, password) VALUES (?, ?, ?, ?, ?)";
    db.query(
      sqlInsert,
      [username, namaLengkap, kelas, divisi, hashedPassword],
      (err, results) => {
        if (err) {
          // Tangani error MySQL duplikat username
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(400)
              .send(
                `Username "${username}" sudah digunakan. Silakan pilih username lain.`
              );
          }
          // Tangani error lainnya
          console.error("Error MySQL:", err);
          return res.status(500).send("Terjadi kesalahan pada server.");
        }

        console.log(`${username} berhasil mendaftar!`);
        res.redirect("/login");
      }
    );
  } catch (error) {
    console.error("Terjadi kesalahan saat mendaftar:", error);
    res.status(500).send("Terjadi kesalahan server. Silakan coba lagi nanti.");
  }
});

// End Posting

module.exports = router;
