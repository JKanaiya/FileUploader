import express from "express";
import {
  createFolder,
  createUser,
  deleteFIle,
  deleteFolder,
  downloadFile,
  getHome,
  getLogIn,
  getSignUp,
  updateFolder,
  viewFileDetails,
  viewFolder,
} from "../controllers/indexController.js";
import {
  loginAuthenticate,
  logOut,
} from "../controllers/passportController.js";

const indexRouter = express.Router();

indexRouter.get("/", getHome);
indexRouter.get("/details/:fileId", viewFileDetails);
indexRouter.get("/:name/:selected", viewFolder);
indexRouter.get("/sign-up", getSignUp);
indexRouter.get("/log-in", getLogIn);
indexRouter.get("/folder/:id", getLogIn);
indexRouter.get("/log-out", logOut);
indexRouter.get("/deleteFile/:folder/:selectedFile/:fileId", deleteFIle);
indexRouter.get("/download/:folder/:selectedFile", downloadFile);
indexRouter.get("/deleteFolder/:name/:selected", deleteFolder);
indexRouter.post("/sign-up", createUser);
indexRouter.post("/update/:selected", updateFolder);
indexRouter.post("/log-in", loginAuthenticate);
indexRouter.post("/newFolder", createFolder);

export default indexRouter;
