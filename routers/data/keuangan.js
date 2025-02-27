const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../../config/dbconfig"); // Sesuaikan path database Anda

// GET
// Halaman utama data keuangan
router.get("/admin/data-keuangan", (req, res, next) => {
  let message = req.session.message || null;
  req.session.message = null; // Hapus pesan setelah ditampilkan

  // Update total pemasukan dan pengeluaran berdasarkan data detail
  const updateTotalsQuery = `
      UPDATE keuangan AS k
      LEFT JOIN (
        SELECT 
          keuangan_id, 
          SUM(CASE WHEN jenis_transaksi = 'Pemasukan' THEN nominal ELSE 0 END) AS total_pemasukan,
          SUM(CASE WHEN jenis_transaksi = 'Pengeluaran' THEN nominal ELSE 0 END) AS total_pengeluaran
        FROM keuangan_detail
        GROUP BY keuangan_id
      ) AS kd
      ON k.id = kd.keuangan_id
      SET 
        k.total_pemasukan = IFNULL(kd.total_pemasukan, 0),
        k.total_pengeluaran = IFNULL(kd.total_pengeluaran, 0)
    `;

  db.query(updateTotalsQuery, (errUpdate) => {
    if (errUpdate) {
      console.error("Error updating totals:", errUpdate);
      return res
        .status(500)
        .send("Gagal memperbarui total pemasukan dan pengeluaran.");
    }

    // Ambil data utama keuangan
    const sqlMain = `
        SELECT 
          id, 
          tahun, 
          total_pemasukan, 
          total_pengeluaran, 
          DATE_FORMAT(updated_at, '%d %M %Y %H:%i:%s') AS tanggal_update_terakhir 
        FROM keuangan
      `;

    // Hitung total uang saat ini
    const sqlTotalUangSaatIni = `
        SELECT 
          SUM(total_pemasukan - total_pengeluaran) AS total_uang_saat_ini 
        FROM keuangan
      `;

    db.query(sqlMain, (errMain, resultMain) => {
      if (errMain) {
        console.error("Error retrieving main data:", errMain);
        return res.status(500).send("Gagal mengambil data keuangan.");
      }

      db.query(sqlTotalUangSaatIni, (errTotal, resultTotal) => {
        if (errTotal) {
          console.error("Error calculating total money:", errTotal);
          return res.status(500).send("Gagal menghitung total uang saat ini.");
        }

        const totalUangSaatIni = resultTotal[0]?.total_uang_saat_ini || 0;

        // Render halaman jika pengguna telah login dan memiliki izin pengurus
        if (req.session.loggedin && req.session.isPengurus === "Ya") {
          res.render(
            path.join(__dirname, "../../views/data/keuangan/dataKeuangan"),
            {
              keuangan: resultMain,
              totalUangSaatIni,
              message,
            }
          );
        } else {
          res.redirect("/login");
        }
      });
    });
  });
});

// Halaman detail data keuangan
router.get("/admin/data-keuangan/detail/:id", (req, res, next) => {
  let message = req.session.message || null;
  req.session.message = null; // Hapus pesan setelah ditampilkan

  const keuanganId = req.params.id;

  const sqlDetail = `
      SELECT
        id,
        keuangan_id, 
        jenis_transaksi, 
        nominal, 
        keterangan, 
        DATE_FORMAT(tanggal, '%d %M %Y') AS tanggal 
      FROM keuangan_detail 
      WHERE keuangan_id = ?
    `;

  const sqlTahun = `SELECT tahun FROM keuangan WHERE id = ?`;

  db.query(sqlDetail, [keuanganId], (err, detailResults) => {
    if (err) throw err;

    db.query(sqlTahun, [keuanganId], (err, tahunResults) => {
      if (err) throw err;

      const tahun = tahunResults.length > 0 ? tahunResults[0].tahun : null;

      if (req.session.loggedin && req.session.isPengurus === "Ya") {
        res.render(
          path.join(__dirname, "../../views/data/keuangan/detailKeuangan"),
          {
            detail: detailResults.length > 0 ? detailResults : null,
            tahun,
            message,
          }
        );
      } else {
        res.redirect("/login");
      }
    });
  });
});
// END GET

// POST
// Proses tambah tahun
router.post("/admin/data-keuangan/tambah-tahun", (req, res) => {
  const { tahunBaru } = req.body;

  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    // Query untuk memeriksa apakah tahun sudah ada
    const sqlCheck = "SELECT COUNT(*) AS count FROM keuangan WHERE tahun = ?";
    db.query(sqlCheck, [tahunBaru], (err, results) => {
      if (err) {
        console.error("Error checking year existence:", err);
        req.session.message =
          "Terjadi kesalahan pada database. Silakan coba lagi.";
        return res.redirect("/admin/data-keuangan");
      }

      const { count } = results[0];
      if (count > 0) {
        // Jika tahun sudah ada
        req.session.message = `Tahun ${tahunBaru} sudah ada di data keuangan.`;
        return res.redirect("/admin/data-keuangan");
      }

      // Jika tahun belum ada, tambahkan ke database
      const sqlInsert = `
          INSERT INTO keuangan (tahun, total_pemasukan, total_pengeluaran, updated_at)
          VALUES (?, 0, 0, NOW())
        `;
      db.query(sqlInsert, [tahunBaru], (err) => {
        if (err) {
          console.error("Error inserting new year:", err);
          req.session.message =
            "Gagal menambahkan tahun baru. Silakan coba lagi.";
          return res.redirect("/admin/data-keuangan");
        }

        req.session.message = `Tahun ${tahunBaru} berhasil ditambahkan.`;
        res.redirect("/admin/data-keuangan");
      });
    });
  } else {
    res.redirect("/login");
  }
});

// Tambah data
router.post("/admin/data-keuangan/tambah", (req, res) => {
  const { tahun, combinedTanggal, jenis_transaksi, nominal, keterangan } =
    req.body;

  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    // Ambil keuangan_id berdasarkan tahun
    const getKeuanganIdQuery = "SELECT id FROM keuangan WHERE tahun = ?";
    db.query(getKeuanganIdQuery, [tahun], (err, results) => {
      if (err || results.length === 0) {
        console.error("Error finding keuangan_id:", err);
        return res.status(500).send("Database error");
      }

      const keuangan_id = results[0].id;

      // Masukkan data keuangan_detail
      const insertDetailQuery = `
          INSERT INTO keuangan_detail 
          (keuangan_id, tanggal, jenis_transaksi, nominal, keterangan) 
          VALUES (?, ?, ?, ?, ?)
        `;
      db.query(
        insertDetailQuery,
        [keuangan_id, combinedTanggal, jenis_transaksi, nominal, keterangan],
        (err) => {
          if (err) {
            console.error("Error inserting detail:", err);
            return res.status(500).send("Database error");
          }

          res.redirect("/admin/data-keuangan");
        }
      );
    });
  } else {
    res.redirect("/login");
  }
});

// Penghapusan data
router.post("/admin/data-keuangan/hapus/:id", (req, res) => {
  const id = req.params.id;

  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    const sql = `DELETE FROM keuangan_detail WHERE id = ?`;
    db.query(sql, [id], (err) => {
      if (err) throw err;
      req.session.message = "Data berhasil dihapus.";
      res.redirect("/admin/data-keuangan");
    });
  } else {
    res.redirect("/login");
  }
});

// Edit data
router.post("/admin/data-keuangan/edit", (req, res) => {
  const { id, jenis_transaksi, nominal, keterangan, keuangan_id } = req.body;

  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    // Query untuk update data keuangan_detail berdasarkan ID
    const sqlUpdateDetail = `
      UPDATE keuangan_detail
      SET jenis_transaksi = ?, nominal = ?, keterangan = ?
      WHERE id = ?
    `;

    db.query(
      sqlUpdateDetail,
      [jenis_transaksi, nominal, keterangan, id],
      (err, result) => {
        if (err) {
          console.error("Error updating data:", err);
          req.session.message = "Gagal mengupdate data. Silakan coba lagi.";
          return res.redirect(`/admin/data-keuangan/detail/${keuangan_id}`);
        }
        req.session.message = "Data berhasil diperbarui.";
        return res.redirect(`/admin/data-keuangan/`);
      }
    );
  } else {
    res.redirect("/login");
  }
});

// END POST

module.exports = router;
