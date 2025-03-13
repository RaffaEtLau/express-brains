// controllers/adminController.js
const User = require("../models/user");
const path = require("path");

// Liste des utilisateurs
exports.usersList = async (req, res) => {
  try {
    const viewPath = path.join(req.app.get("views"), "admin/user.ejs");
    console.log("Triyng to find view at :", viewPath);

    const users = await User.find().select("-password");

    res.render("admin/users", {
      title: "Liste des utilisateurs",
      users: users || [],
    });
  } catch (error) {
    console.error("Erreur dans la liste des utilisateurs:", error);
    req.flash(
      "error_msg",
      "Une erreur est survenue lors de la récupération des utilisateurs"
    );
    res.redirect("/");
  }
};
