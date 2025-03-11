const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/test", (req, res) => {
  res.send("Test route works!");
});

app.listen(3001, () => {
  console.log("Test server started on http://localhost:3001");
});
