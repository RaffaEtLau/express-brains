const User = require("../models/user");

// Afficher la page de connexion
exports.getLogin = (req, res) => {
  res.render("auth/login", {
    title: "Connexion",
  });
};

// Traiter la connexion
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier que l'email est fourni
    if (!email) {
      return res.render("auth/login", {
        title: "Connexion",
        error: "Merci de saisir une adresse email",
        success_msg: null,
      });
    }

    // Vérifier que le mot de passe est fourni
    if (!password) {
      return res.render("auth/login", {
        title: "Connexion",
        error: "Merci de saisir un mot de passe",
        success_msg: null,
      });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ email });

    // Vérifier si l'utilisateur existe
    if (!user) {
      return res.render("auth/login", {
        title: "Connexion",
        error: "Email ou mot de passe incorrect",
        success_msg: null,
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.render("auth/login", {
        title: "Connexion",
        error: "Email ou mot de passe incorrect",
        success_msg: null,
      });
    }

    // Stocker l'utilisateur dans la session
    req.session.user = {
      id: user._id,
      email: user.email,
      pseudo: user.pseudo,
      isAdmin: user.isAdmin,
    };

    // Redirection
    req.flash("success_msg", `Bienvenue ${user.pseudo}`);
    res.redirect("/");
  } catch (error) {
    console.error("Erreur de connexion:", error);
    req.flash("error_msg", "Une erreur est survenue lors de la connexion");
    res.redirect("/login");
  }
};

// Afficher la page d'inscription
exports.getRegister = (req, res) => {
  res.render("auth/register", {
    title: "Créer un compte",
    error: null,
  });
};

// Traiter l'inscription
exports.postRegister = async (req, res) => {
  try {
    const { email, pseudo, password, confirmPassword } = req.body;

    // Vérifier que l'email est valide
    if (!email || !email.includes("@")) {
      return res.render("auth/register", {
        title: "Créer un compte",
        error: "Merci de saisir une adresse email valide",
      });
    }

    // Vérifier que le pseudo est valide
    if (!pseudo || pseudo.length < 3) {
      return res.render("auth/register", {
        title: "Créer un compte",
        error: "Le pseudo doit contenir au moins 3 caractères",
      });
    }

    // Vérifier que le mot de passe est valide
    if (!password || password.length < 4) {
      return res.render("auth/register", {
        title: "Créer un compte",
        error: "Doit contenir au moins 4 caractères",
      });
    }

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      return res.render("auth/register", {
        title: "Créer un compte",
        error: "Les mots de passe ne correspondent pas",
      });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.render("auth/register", {
        title: "Créer un compte",
        error: "Cette adresse email est déjà utilisée",
      });
    }

    // Vérifier si le pseudo existe déjà (insensible à la casse)
    const pseudoExists = await User.pseudoExists(pseudo);
    if (pseudoExists) {
      return res.render("auth/register", {
        title: "Créer un compte",
        error: "Ce pseudo est déjà utilisé",
      });
    }

    // Créer le nouvel utilisateur
    const newUser = new User({
      email,
      pseudo,
      password,
    });

    await newUser.save();

    // Message de succès et redirection vers la page de connexion
    req.flash("success_msg", `Votre compte ${email} a bien été créé`);
    res.redirect("/login");
  } catch (error) {
    console.error("Registration error:", error);
    res.render("auth/register", {
      title: "Créer un compte",
      error: "Une erreur est survenue, veuillez réessayer",
    });
  }
};

// Déconnexion
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Erreur de déconnexion:", err);
    res.redirect("/login");
  });
};
