import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import prisma from "./prismaController.js";

const pSession = passport.session();

const logOut = function (req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: {
          fullname: username,
        },
      });

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      console.log(err);
      return done(err);
    }
  }),
);
const loginAuthenticate = passport.authenticate("local", {
  successRedirect: "/",
  // TODO: Add correct routing on failure to auth
  failureRedirect: "/log-in",
});

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: id,
      },
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export { pSession, loginAuthenticate, logOut };
