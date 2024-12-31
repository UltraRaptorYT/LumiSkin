const express = require("express");
const app = express();
const serverless = require("serverless-http"); // Required for Vercel

app.use(express.json());

// Example route
app.get("/api", (req, res) => {
  res.json({ message: "Hello from the API!" });
});

module.exports = app;
module.exports.handler = serverless(app);
