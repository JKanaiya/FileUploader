import multer from "multer";
import path from "path";
import fs from "fs";
import fsProm from "fs/promises";
import express from "express";
import prisma from "../controllers/prismaController.js";
import supabase from "../controllers/supabaseController.js";
const uploadRouter = express.Router();

const handleUpload = async (req, res) => {
  // const pathToFile = path.join(
  //   import.meta.dirname,
  //   `../tempFolder/${res.locals.user.fullname}/${res.locals.selectedFolder.name}/${req.file.originalname}`,
  // );
  const now = new Date();
  try {
    const filePath = `/${res.locals.user.fullname}/${res.locals.selectedFolder.name}/${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from("files")
      .upload(filePath, req.file.buffer, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.log(error);
    } else {
      console.log("File Uploaded");
    }

    await prisma.file.create({
      data: {
        name: `${req.file.originalname}`,
        url: `${res.locals.user.fullname}/${res.locals.selectedFolder.name}/${req.file.originalname}`,
        folderId: res.locals.selectedFolder.id,
        uploadTime: now.toISOString(),
        size: req.file.size,
      },
    });

    res.locals.selectedFolder = await prisma.folder.findFirst({
      where: {
        id: Number(req.params.folderId),
      },
      include: {
        files: true,
      },
    });

    const folders = await prisma.folder.findMany({
      where: {
        userId: res.locals.user.id,
      },
    });

    res.render("home", {
      folders: folders,
      files: res.locals.selectedFolder.files,
    });
  } catch (err) {
    console.log(err);
  }
};

const getFolder = async (req, res, next) => {
  const selectedFolder = await prisma.folder.findFirst({
    where: {
      id: Number(req.params.folderId),
    },
    include: {
      files: true,
    },
  });
  res.locals.selectedFolder = selectedFolder;
  next();
};

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

uploadRouter.post(
  "/upload/:folderId",
  getFolder,
  upload.single("uploaded_file"),
  handleUpload,
);

export default uploadRouter;
