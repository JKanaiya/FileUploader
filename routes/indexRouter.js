import express from "express";
import {
  createFolder,
  createUser,
  deleteFolder,
  getHome,
  getLogIn,
  getSignUp,
  viewFolder,
} from "../controllers/indexController.js";
import {
  loginAuthenticate,
  logOut,
} from "../controllers/passportController.js";
import multer from "multer";

const indexRouter = express.Router();
const upload = multer({ dest: "./tempFolder/uploads" });

indexRouter.get("/", getHome);
indexRouter.get("/:name/:selected", viewFolder);
indexRouter.get("/sign-up", getSignUp);
indexRouter.get("/log-in", getLogIn);
indexRouter.get("/folder/:id", getLogIn);
// indexRouter.get("/:user/:folder", getFolder);
indexRouter.post("/sign-up", createUser);
indexRouter.post("/log-in", loginAuthenticate);
indexRouter.get("/log-out", logOut);
indexRouter.get("/deleteFolder/:name/:folderId", deleteFolder);
indexRouter.post("/newFolder", createFolder);
indexRouter.post("/upload", upload.single("uploaded_file"), (req, res) =>
  res.redirect("/"),
);

export default indexRouter;
