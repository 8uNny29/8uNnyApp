const mysql = require("mysql");
require("dotenv").config(); // Memuat file .env

const dbconfig = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: process.env.DB_MULTIPLE_STATEMENTS,
});

dbconfig.connect(function (err) {
  if (err) throw err;
  console.log("Database berhasil terkoneksi dengan baik!");
});

module.exports = dbconfig;
