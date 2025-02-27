const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../../config/dbconfig");
const ExcelJS = require("exceljs");

// GET
// Halaman utama data anggota
router.get("/admin/data-anggota", (req, res, next) => {
  let message = req.session.message;
  req.session.message = null;
  const { kelas, divisi, role } = req.query;

  let sqlGetAll = "SELECT * FROM accounts";
  const filters = [];

  if (kelas) filters.push(`kelas = '${kelas}'`);
  if (divisi) filters.push(`divisi = '${divisi}'`);
  if (role) filters.push(`role = '${role}'`);

  if (filters.length > 0) {
    sqlGetAll += " WHERE " + filters.join(" AND ");
  }

  const sqlUniqueKelas =
    "SELECT DISTINCT kelas FROM accounts ORDER BY kelas ASC";
  const sqlUniqueDivisi =
    "SELECT DISTINCT divisi FROM accounts ORDER BY divisi ASC";
  const sqlUniqueRoles = "SELECT DISTINCT role FROM accounts ORDER BY role ASC";

  db.query(sqlGetAll, (err, results) => {
    if (err) throw err;

    const accounts = results;

    db.query(sqlUniqueKelas, (errKelas, resultsKelas) => {
      if (errKelas) throw errKelas;

      db.query(sqlUniqueDivisi, (errDivisi, resultsDivisi) => {
        if (errDivisi) throw errDivisi;

        db.query(sqlUniqueRoles, (errRoles, resultsRoles) => {
          if (errRoles) throw errRoles;

          const uniqueKelas = resultsKelas.map((row) => row.kelas);
          const uniqueDivisi = resultsDivisi.map((row) => row.divisi);
          const uniqueRoles = resultsRoles.map((row) => row.role);

          if (req.session.loggedin && req.session.isPengurus === "Ya") {
            res.render(
              path.join(__dirname, "../../views/data/anggota/dataAnggota"),
              {
                accounts,
                uniqueKelas,
                uniqueDivisi,
                uniqueRoles,
                query: req.query, // Pastikan req.query dikirim ke view
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
});

// Export data
router.get("/admin/data-anggota/export-data", async (req, res) => {
  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    try {
      // Ambil parameter filter dari query string
      const { kelas, divisi, role } = req.query;

      // Siapkan query SQL dengan filter dinamis
      let sqlGet =
        "SELECT id, username, nama, kelas, divisi, email, no_telpon, role FROM accounts WHERE 1=1";

      // Tambahkan filter jika tersedia
      const params = [];
      if (kelas) {
        sqlGet += " AND kelas = ?";
        params.push(kelas);
      }
      if (divisi) {
        sqlGet += " AND divisi = ?";
        params.push(divisi);
      }
      if (role) {
        sqlGet += " AND role = ?";
        params.push(role);
      }

      // Eksekusi query
      db.query(sqlGet, params, async (err, results) => {
        if (err) {
          console.error("Terjadi kesalahan saat query:", err);
          return res
            .status(500)
            .send("Terjadi kesalahan saat mengambil data anggota.");
        }

        // Buat workbook dan worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Data Anggota");

        // Tambahkan header ke worksheet
        worksheet.columns = [
          { header: "ID", key: "id", width: 10 },
          { header: "Nama", key: "nama", width: 25 },
          { header: "Kelas", key: "kelas", width: 10 },
          { header: "Divisi", key: "divisi", width: 15 },
          { header: "Role", key: "role", width: 10 },
          { header: "Username", key: "username", width: 20 },
          { header: "Email", key: "email", width: 30 },
          { header: "No. Telpon", key: "no_telpon", width: 15 },
        ];

        // Tambahkan data ke worksheet
        worksheet.addRows(results);

        // Format sebagai tabel
        worksheet.addTable({
          name: "DataAnggotaTable",
          ref: "A1", // Mulai dari cell A1
          headerRow: true,
          totalsRow: false,
          style: {
            theme: "TableStyleMedium15",
            showRowStripes: true,
          },
          columns: [
            { name: "ID", filterButton: true },
            { name: "Nama", filterButton: true },
            { name: "Kelas", filterButton: true },
            { name: "Divisi", filterButton: true },
            { name: "Role", filterButton: true },
            { name: "Username", filterButton: true },
            { name: "Email", filterButton: true },
            { name: "No. Telpon", filterButton: true },
          ],
          rows: results.map((row) => [
            row.id,
            row.nama,
            row.kelas,
            row.divisi,
            row.role,
            row.username,
            row.email,
            row.no_telpon,
          ]),
        });

        // Set header response untuk file Excel
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=Data_Anggota.xlsx"
        );

        // Kirim file Excel ke browser
        await workbook.xlsx.write(res);
        res.end();
      });
    } catch (error) {
      console.error("Terjadi kesalahan saat ekspor data:", error);
      res.status(500).send("Terjadi kesalahan saat ekspor data anggota.");
    }
  } else {
    res.redirect("/login");
  }
});
// END GET

// POST
// Filter data anggota
router.post("/admin/data-anggota/filter", (req, res, next) => {
  const { kelas, divisi, role } = req.body;

  if (req.session.loggedin && req.session.isPengurus === "Ya") {
    let sqlFilter = "SELECT * FROM accounts WHERE 1=1";
    if (kelas) sqlFilter += ` AND kelas = '${kelas}'`;
    if (divisi) sqlFilter += ` AND divisi = '${divisi}'`;
    if (role) sqlFilter += ` AND role = '${role}'`;

    db.query(sqlFilter, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  } else {
    res.redirect("/login");
  }
});
// End Posting

module.exports = router;
