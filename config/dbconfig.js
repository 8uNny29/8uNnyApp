const mysql = require("mysql");

const dbconfig = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "8unnyapps",
  multipleStatements: true,
});

dbconfig.connect(function (err) {
  if (err) throw err;
  console.log("DB Behasil terkoneksi dengan baik!");
});

module.exports = dbconfig;
