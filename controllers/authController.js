export const isAuth = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.render("home");
  }
};
