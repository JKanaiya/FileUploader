import prisma from "./prismaController.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import path from "path";
import fs1 from "fs-extra";
import fsProm from "fs/promises";
import { log } from "console";
const localDirame = import.meta.dirname;

const validateFolder = [
  body("newFolder")
    .trim()
    .isLength({ min: 1, max: 15 })
    .withMessage("Folder Name must be at min 1 and max length of 15 chars"),
];

const validateUser = [
  body("fullname")
    .trim()
    .isLength({ min: 1, max: 15 })
    .withMessage("Full name must be at min 1 and max length of 15 chars"),
  body("password")
    .trim()
    .isLength({ min: 4 })
    .withMessage("Password has a min length of 4 chars"),
  body("passwordConfirm")
    .trim()
    .custom((val, { req }) => {
      return val === req.body.password;
    })
    .withMessage("Passwords do not match"),
];

const getHome = async function (req, res) {
  if (res.locals.user) {
    const folders = await prisma.folder.findMany({
      where: {
        userId: res.locals.user.id,
      },
    });
    console.log(folders);
    res.render("home", {
      folders: folders,
    });
  } else {
    res.render("home");
  }
};

const getFolder = await function (req, res) {
  const folders = prisma.user.findMany({
    where: {
      fullname: req.params.user,
    },
    include: {
      folder: true,
    },
  });
  res.render("home", {
    folders: folders,
  });
};

const getSignUp = function (req, res) {
  res.render("sign-up");
};

const getLogIn = function (req, res) {
  res.render("log-in");
};

const addFolderToApp = (req, res, next) => {
  const pathToFolder = path.join(
    import.meta.dirname,
    `../tempFolder/`,
    `${res.locals.user.fullname}`,
    `${req.body.newFolder}`,
  );
  fs.access(pathToFolder, (err) => {
    if (err) {
      fs.mkdir(pathToFolder, (err) => {
        if (err) {
          console.log(err);
        } else {
          next();
        }
      });
    } else {
      res.redirect("/");
    }
  });
};

const folderExists = (req, res, next) => {
  const selected = req.params.selected;
  const pathToFolder = path.join(
    localDirame,
    `../tempFolder`,
    `${res.locals.user.fullname}`,
    `${selected}`,
  );
  res.locals.folderPath = pathToFolder;
  console.log(req.params);
  fs.access(pathToFolder, (err) => {
    if (err) {
      throw new Error("Folder Does not exist");
    } else {
      next();
    }
  });
};

const viewFolder = [
  folderExists,
  async (req, res) => {
    if (res.locals.user) {
      const folders = await prisma.folder.findMany({
        where: {
          userId: res.locals.user.id,
        },
      });
      res.render("home", {
        folders: folders,
        folder: req.params.selected,
      });
    } else {
      res.redirect("/");
    }
  },
];

const updateFolder = [
  folderExists,
  async (req, res) => {
    try {
      await fsProm.rename(pathToFolder, req.body.newFolderName);
    } catch (err) {
      console.log(err);
    }
  },
];

const deleteFolder = [
  folderExists,
  async (req, res) => {
    fs1.remove(res.locals.folderPath, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("successful folder deletion");
      }
    });
    await prisma.folder.delete({
      where: {
        id: Number(req.params.folderId),
      },
    });
    res.redirect("/");
  },
];

const addUserFolder = function (req, res, next) {
  const pathToUser = path.join(
    import.meta.dirname,
    `../tempFolder/${req.body.fullname}`,
  );
  fs.access(pathToUser, (err) => {
    if (err) {
      fs.mkdir(pathToUser, (err) => {
        if (err) {
          console.log(err);
        } else {
          next();
        }
      });
    } else {
      res.render("sign-up");
    }
  });
};

const createFolder = [
  validateFolder,
  addFolderToApp,
  async (req, res) => {
    await prisma.folder.create({
      data: {
        name: req.body.newFolder,
        userId: res.locals.user.id,
      },
    });
    res.redirect("/");
  },
];

const createUser = [
  validateUser,
  addUserFolder,
  async (req, res, next) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render("sign-up", {
          errors: errors.array(),
        });
      }
      await prisma.user.create({
        data: {
          fullname: req.body.fullname,
          password: hashedPassword,
        },
      });
      res.redirect("/");
    } catch (err) {
      return next(err);
    }
  },
];

export {
  getHome,
  getSignUp,
  createUser,
  getLogIn,
  createFolder,
  deleteFolder,
  viewFolder,
};
