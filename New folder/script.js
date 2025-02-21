const express = require("express");

const app = express();
app;

const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "hFH3Z(4-4Y,&",
  database: "sakila",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("MySQL connected");
});

app.listen("3005", () => {
  console.log("Server started on port 3000");
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/getActors", (req, res) => {
  let sql = "SELECT * FROM actor LIMIT 10";
  let query = db.query(sql, (err, results) => {
    if (err) throw err;
    console.log(results);
    res.send(results);
  });
});
