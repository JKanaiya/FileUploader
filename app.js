import path from "node:path";
import express from "express";
import path from "node:path";
import "dotenv/config.js";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import prisma from "./controllers/prismaController";

const app = express();
app.set("view engine", "ejs");

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: "a santa at nasa",
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

const PORT = process.env.HOST || 3000;
app.listen(PORT, () => {
  `Express listening on PORT: ${PORT}`;
});
