import path from "node:path";
import express from "express";
import "dotenv/config.js";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import prisma from "./controllers/prismaController.js";
import expressSession from "express-session";
import indexRouter from "./routes/indexRouter.js";
import { pSession } from "./controllers/passportController.js";
import uploadRouter from "./routes/uploadRouter.js";
const app = express();
app.set("view engine", "ejs");

app.use(
  expressSession({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(import.meta.dirname, "public")));
app.set("views", path.join(import.meta.dirname, "views"));
app.use(pSession);

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(indexRouter);
app.use(uploadRouter);

const PORT = process.env.HOST || 3000;
app.listen(PORT, () => {
  console.log(`Express listening on PORT: ${PORT}`);
});
