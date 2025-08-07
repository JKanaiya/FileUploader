import prisma from "./prismaController.js";
import fs, { ReadStream } from "fs";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import multer from "multer";
import path from "path";
import fs1 from "fs-extra";
import fsProm from "fs/promises";
import { log } from "console";
import supabase from "./supabaseController.js";
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
    edit: 0,
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

const folderExists = async (req, res, next) => {
  const selectedFolder = await prisma.folder.findFirst({
    where: {
      id: Number(req.params.selected),
    },
  });
  const pathToFolder = path.join(
    localDirame,
    `../tempFolder`,
    `${res.locals.user.fullname}`,
    `${selectedFolder.name}`,
  );
  res.locals.folderPath = pathToFolder;
  fs.access(pathToFolder, (err) => {
    if (err) {
      throw new Error("Folder Does not exist");
    } else {
      next();
    }
  });
};

const viewFolder = [
  // folderExists,
  async (req, res, next) => {
    const selectedFolder = await prisma.folder.findFirst({
      where: {
        id: Number(req.params.selected),
      },
      include: {
        files: true,
      },
    });
    res.locals.selectedFolder = selectedFolder;
    next();
  },
  async (req, res) => {
    if (res.locals.user) {
      const folders = await prisma.folder.findMany({
        where: {
          userId: res.locals.user.id,
        },
      });
      console.log(res.locals.selectedFolder);
      res.render("home", {
        folders: folders,
        edit: 0,
        files: res.locals.selectedFolder.files,
      });
    } else {
      res.redirect("/");
    }
  },
];

const updateFolder = [
  // folderExists,
  async (req, res) => {
    // try {
    //   await fsProm.rename(pathToFolder, req.body.folderName);
    // } catch (err) {
    //   console.log(err);
    // }
    const files = await prisma.file.findMany({
      where: {
        folderId: Number(req.params.selected),
      },
    });

    const updatedFileUrls = files.map((file) => {
      const split = file.url.split("/");
      console.log(split);
      return path.join(`${split[0]}`, `${req.body.folderName}`, `${split[2]}`);
    });

    for (let n = 0; updatedFileUrls.length > n; n++) {
      const { error } = await supabase.storage
        .from("files")
        .move(`${files[n].url}`, updatedFileUrls[n]);

      if (error) {
        console.log(error);
      } else {
        await prisma.file.update({
          where: {
            folderId: Number(req.params.selected),
            id: files[n].id,
          },
          data: {
            url: updatedFileUrls[n],
          },
        });
      }
    }

    await prisma.folder.update({
      where: {
        id: Number(req.params.selected),
      },
      data: {
        name: req.body.folderName,
      },
    });
    res.redirect("/");
  },
];

const deleteFolder = [
  // folderExists,
  async (req, res) => {
    console.log(req.params.selected);
    const selectedFolder = await prisma.folder.findFirst({
      where: {
        id: Number(req.params.selected),
      },
      include: {
        files: true,
      },
    });

    const pathToFolder = path.join(
      `${res.locals.user.fullname}`,
      `${selectedFolder.name}`,
    );
    res.locals.folderPath = pathToFolder;
    try {
      await supabase.storage.from("files").remove([res.locals.folderPath]);
    } catch (err) {
      console.log(err);
    }
    // fs1.remove(res.locals.folderPath, (err) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log("successful folder deletion");
    //   }
    // });
    await prisma.file.deleteMany({
      where: {
        folderId: Number(req.params.selected),
      },
    });
    await prisma.folder.delete({
      where: {
        id: Number(req.params.selected),
      },
    });
    res.redirect("/");
  },
];

const viewFileDetails = async (req, res) => {
  const file = await prisma.file.findFirst({
    where: {
      id: Number(req.params.fileId),
    },
  });
  const folders = await prisma.folder.findMany({
    where: {
      userId: res.locals.user.id,
    },
  });
  const selectedFolder = await prisma.folder.findFirst({
    where: {
      id: file.folderId,
    },
  });
  res.locals.details = file;
  res.locals.selectedFolder = selectedFolder;
  res.render("home", {
    folders: folders,
  });
};

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
  // addFolderToApp,
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
  // addUserFolder,
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

const downloadFile = async (req, res) => {
  const filePath = path.join(
    `${res.locals.user.fullname}/${req.params.folder}`,
    `${req.params.selectedFile}`,
  );

  try {
    const { data } = supabase.storage.from("files").getPublicUrl(filePath, {
      download: true,
    });
    console.log(data);
    res.redirect(data.publicUrl);
  } catch (err) {
    console.log(err);
  }
};

export {
  getHome,
  getSignUp,
  createUser,
  getLogIn,
  createFolder,
  deleteFolder,
  viewFolder,
  updateFolder,
  viewFileDetails,
  downloadFile,
};
