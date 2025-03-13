// middlewares/auth.js
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    // Ajouter l'utilisateur aux variables locales pour l'utiliser dans les vues
    res.locals.user = req.session.user;
    return next();
  }

  req.flash("error_msg", "Veuillez vous connecter pour accéder à cette page");
  res.redirect("/login");
};

const isAdmin = (req, res, next) => {
  console.log("Auth check - user:", req.session.user); // Debug

  if (req.session && req.session.user && req.session.user.isAdmin) {
    return next();
  }

  req.flash(
    "error_msg",
    "Accès non autorisé, privilèges administrateur requis"
  );
  res.redirect("/");
};

module.exports = {
  isAuthenticated,
  isAdmin,
};
