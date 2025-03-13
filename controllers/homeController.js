exports.getHome = (req, res) => {
  res.render("home", {
    title: "Accueil",
  });
};
