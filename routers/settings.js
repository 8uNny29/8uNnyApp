const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../config/dbconfig");
const validator = require("validator");
const bcrypt = require("bcrypt");

function maskEmail(email) {
  const [user, domain] = email.split("@"); // Pisahkan bagian sebelum dan sesudah "@"
  const visibleStart = user.slice(0, 2); // Ambil 2 karakter pertama
  const visibleEnd = user.slice(-2); // Ambil 2 karakter terakhir

  let maskedMiddle;
  if (user.length <= 4) {
    // Jika username pendek, tampilkan hanya karakter pertama dan terakhir
    maskedMiddle = "*".repeat(user.length - 2 > 0 ? user.length - 2 : 1); // Minimal 1 bintang
    return `${user[0]}${maskedMiddle}${user[user.length - 1]}@${domain}`;
  } else {
    maskedMiddle = "*".repeat(user.length - 4); // Ganti tengahnya dengan bintang
    return `${visibleStart}${maskedMiddle}${visibleEnd}@${domain}`;
  }
}

function maskPhone(phone) {
  return phone.slice(0, 3) + "*".repeat(phone.length - 6) + phone.slice(-3);
}

// Getting
router.get("/admin/settings/", (req, res, next) => {
  const user_id = req.session.user_id;
  const sqlGet = "SELECT * FROM accounts WHERE id = ?";

  db.query(sqlGet, [user_id], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const account = results[0];

      // Validasi email dan nomor telepon sebelum masking
      account.email = account.email
        ? maskEmail(account.email)
        : "Tidak tersedia";
      account.no_telpon = account.no_telpon
        ? maskPhone(account.no_telpon)
        : "Tidak tersedia";

      if (req.session.loggedin && req.session.isPengurus === "Ya") {
        res.render(path.join(__dirname, "../views/account/settings"), {
          account,
        });
      } else {
        res.redirect("/login");
      }
    } else {
      res.redirect("/login");
    }
  });
});

router.get("/admin/settings/account-settings", (req, res, next) => {
  const user_id = req.session.user_id;
  const sqlGet = "SELECT * FROM accounts WHERE id = ?";

  db.query(sqlGet, [user_id], (err, results, rows) => {
    if (err) throw err;

    if (results.length > 0) {
      const account = results[0];

      if (req.session.loggedin && req.session.isPengurus === "Ya") {
        res.render(path.join(__dirname, "../views/account/account-settings"), {
          account,
        });
      } else {
        res.redirect("/login");
      }
    } else {
      res.redirect("/login");
    }
  });
});
// End Getting

// Posting
router.post("/admin/settings/change-username", async (req, res, next) => {
  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    try {
      const { newUsername } = req.body;
      const user_id = req.session.user_id;

      // Validasi input kosong
      if (!newUsername) {
        return res.status(400).send("Username baru tidak boleh kosong!");
      }

      // Escape karakter sensitif
      const escapedUsername = validator.escape(newUsername.trim());

      // Validasi username hanya alfanumerik
      const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
      if (!usernameRegex.test(escapedUsername)) {
        return res
          .status(400)
          .send("Username mengandung karakter tidak valid!");
      }

      // Periksa apakah username sudah ada
      const sqlCheck = "SELECT id FROM accounts WHERE username = ?";
      const sqlUpdate = "UPDATE accounts SET username = ? WHERE id = ?";

      db.query(sqlCheck, [escapedUsername], (err, results) => {
        if (err) {
          console.error("Error MySQL saat memeriksa username:", err);
          return res.status(500).send("Terjadi kesalahan server.");
        }

        if (results.length > 0) {
          // Username sudah digunakan
          return res
            .status(400)
            .send(
              `Username "${escapedUsername}" sudah digunakan. Silakan pilih username lain.`
            );
        }

        // Update username jika belum digunakan
        db.query(sqlUpdate, [escapedUsername, user_id], (err, results) => {
          if (err) {
            console.error("Error MySQL saat mengupdate username:", err);
            return res.status(500).send("Terjadi kesalahan server.");
          }

          // Logout user setelah username diubah
          if (req.session.loggedin) {
            req.session.user_id = null;
            req.session.save(function (err) {
              if (err) next(err);

              req.session.regenerate(function (err) {
                if (err) next(err);
                res.redirect("/login");
              });
            });
          } else {
            res.redirect("/login");
          }
        });
      });
    } catch (error) {
      console.error("Terjadi kesalahan saat mengganti username:", error);
      res
        .status(500)
        .send("Terjadi kesalahan server. Silakan coba lagi nanti.");
    }
  } else {
    res.redirect("/login");
  }
});

router.post("/admin/settings/change-password", async (req, res, next) => {
  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    try {
      const { currentPassword, newPassword, newConfirmPassword } = req.body;
      const user_id = req.session.user_id;

      // Validasi input kosong
      if (!currentPassword || !newPassword || !newConfirmPassword) {
        return res.status(400).send("Semua field harus diisi!");
      }

      // Validasi panjang password baru
      if (newPassword.length < 8) {
        return res.status(400).send("Password baru harus minimal 8 karakter!");
      }

      // Validasi konfirmasi password baru
      if (newPassword !== newConfirmPassword) {
        return res
          .status(400)
          .send("Password baru dan konfirmasi password tidak cocok!");
      }

      // Escape input
      const escapedCurrentPassword = validator.escape(currentPassword.trim());
      const escapedNewPassword = validator.escape(newPassword.trim());

      // Periksa password saat ini di database
      const sqlGetPassword = "SELECT password FROM accounts WHERE id = ?";
      const sqlUpdatePassword = "UPDATE accounts SET password = ? WHERE id = ?";

      db.query(sqlGetPassword, [user_id], async (err, results) => {
        if (err) {
          console.error("Error MySQL saat memeriksa password:", err);
          return res.status(500).send("Terjadi kesalahan server.");
        }

        if (results.length === 0) {
          return res.status(404).send("Akun tidak ditemukan.");
        }

        const hashedCurrentPassword = results[0].password;

        // Validasi password saat ini
        const isMatch = await bcrypt.compare(
          escapedCurrentPassword,
          hashedCurrentPassword
        );
        if (!isMatch) {
          return res
            .status(400)
            .send("Password saat ini tidak sesuai. Silakan coba lagi.");
        }

        // Hash password baru
        const hashedNewPassword = await bcrypt.hash(escapedNewPassword, 10);

        // Update password di database
        db.query(
          sqlUpdatePassword,
          [hashedNewPassword, user_id],
          (err, results) => {
            if (err) {
              console.error("Error MySQL saat mengupdate password:", err);
              return res.status(500).send("Terjadi kesalahan server.");
            }

            // Logout user setelah password diubah
            if (req.session.loggedin) {
              req.session.user_id = null;
              req.session.save(function (err) {
                if (err) next(err);

                req.session.regenerate(function (err) {
                  if (err) next(err);
                  res.redirect("/login");
                });
              });
            } else {
              res.redirect("/login");
            }
          }
        );
      });
    } catch (error) {
      console.error("Terjadi kesalahan saat mengganti password:", error);
      res
        .status(500)
        .send("Terjadi kesalahan server. Silakan coba lagi nanti.");
    }
  }
});

router.post("/admin/settings/change-email", async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    const user_id = req.session.user_id;

    // Validasi input kosong
    if (!newEmail) {
      return res.status(400).send("Email baru tidak boleh kosong!");
    }

    // Escape karakter sensitif
    const escapedEmail = validator.escape(newEmail.trim());

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(escapedEmail)) {
      return res.status(400).send("Format email tidak valid!");
    }

    // Periksa apakah email sudah ada
    const sqlCheck = "SELECT id FROM accounts WHERE email = ?";
    const sqlUpdate = "UPDATE accounts SET email = ? WHERE id = ?";

    db.query(sqlCheck, [escapedEmail], (err, results) => {
      if (err) {
        console.error("Error MySQL saat memeriksa email:", err);
        return res.status(500).send("Terjadi kesalahan server.");
      }

      if (results.length > 0) {
        // Email sudah digunakan
        return res
          .status(400)
          .send(
            `Email "${escapedEmail}" sudah digunakan. Silakan pilih email lain.`
          );
      }

      // Update email jika belum digunakan
      db.query(sqlUpdate, [escapedEmail, user_id], (err, results) => {
        if (err) {
          console.error("Error MySQL saat mengupdate email:", err);
          return res.status(500).send("Terjadi kesalahan server.");
        }

        // Logout user setelah email diubah
        if (req.session.loggedin) {
          req.session.user_id = null;
          req.session.save(function (err) {
            if (err) next(err);

            req.session.regenerate(function (err) {
              if (err) next(err);
              res.redirect("/login");
            });
          });
        } else {
          res.redirect("/login");
        }
      });
    });
  } catch (error) {
    console.error("Terjadi kesalahan saat mengganti email:", error);
    res.status(500).send("Terjadi kesalahan server. Silakan coba lagi nanti.");
  }
});

router.post("/admin/settings/change-phone", async (req, res, next) => {
  try {
    const { newPhone } = req.body;
    const user_id = req.session.user_id;

    // Validasi input kosong
    if (!newPhone) {
      return res.status(400).send("Nomor telepon baru tidak boleh kosong!");
    }

    // Escape karakter sensitif
    const escapedPhone = validator.escape(newPhone.trim());

    // Validasi format nomor telepon (hanya angka dan panjang minimal 10, maksimal 15)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(escapedPhone)) {
      return res
        .status(400)
        .send(
          "Nomor telepon harus berupa angka dengan panjang 10-15 karakter!"
        );
    }

    // Periksa apakah nomor telepon sudah ada
    const sqlCheck = "SELECT id FROM accounts WHERE no_telpon = ?";
    const sqlUpdate = "UPDATE accounts SET no_telpon = ? WHERE id = ?";

    db.query(sqlCheck, [escapedPhone], (err, results) => {
      if (err) {
        console.error("Error MySQL saat memeriksa nomor telepon:", err);
        return res.status(500).send("Terjadi kesalahan server.");
      }

      if (results.length > 0) {
        // Nomor telepon sudah digunakan
        return res
          .status(400)
          .send(
            `Nomor telepon "${escapedPhone}" sudah digunakan. Silakan pilih nomor telepon lain.`
          );
      }

      // Update nomor telepon jika belum digunakan
      db.query(sqlUpdate, [escapedPhone, user_id], (err, results) => {
        if (err) {
          console.error("Error MySQL saat mengupdate nomor telepon:", err);
          return res.status(500).send("Terjadi kesalahan server.");
        }

        // Logout user setelah nomor telepon diubah
        if (req.session.loggedin) {
          req.session.user_id = null;
          req.session.save(function (err) {
            if (err) next(err);

            req.session.regenerate(function (err) {
              if (err) next(err);
              res.redirect("/login");
            });
          });
        } else {
          res.redirect("/login");
        }
      });
    });
  } catch (error) {
    console.error("Terjadi kesalahan saat mengganti nomor telepon:", error);
    res.status(500).send("Terjadi kesalahan server. Silakan coba lagi nanti.");
  }
});
// End Posting

module.exports = router;
