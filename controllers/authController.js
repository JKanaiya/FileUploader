import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";
import { body, validationResult } from "express-validator";

const prisma = new PrismaClient();

const validateUser = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 15 })
    .withMessage("Name must be at min 1 and max length of 15 chars"),
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

const createUser = [
  validateUser,
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
          name: req.body.name,
          password: hashedPassword,
        },
      });

      res.redirect("/");
    } catch (err) {
      return next(err);
    }
  },
];
