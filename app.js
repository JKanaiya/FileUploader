import path from "node:path";
import express from "express";
import path from "node:path";
import "dotenv/config.js";

const app = express();
app.set("view engine", "ejs");

const PORT = process.env.HOST || 3000;
app.listen(PORT, () => {
  `Express listening on PORT: ${PORT}`;
});
