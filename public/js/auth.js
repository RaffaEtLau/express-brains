/**
 * Gestion de l'authentification côté client
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialiser le stockage
  if (window.expressStorage) {
    window.expressStorage.initStorage();
  }

  // Formulaire d'inscription
  const registerForm = document.querySelector('form[action="/auth/register"]');
  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Récupérer les données du formulaire
      const email = this.querySelector('input[name="email"]').value;
      const pseudo = this.querySelector('input[name="pseudo"]').value;
      const password = this.querySelector('input[name="password"]').value;
      const password2 = this.querySelector('input[name="password2"]').value;

      // Vérifications basiques
      if (!email || !pseudo || !password || !password2) {
        showAlert("Veuillez remplir tous les champs", "error");
        return;
      }

      if (password !== password2) {
        showAlert("Les mots de passe ne correspondent pas", "error");
        return;
      }

      try {
        // Créer l'utilisateur dans le localStorage
        const newUser = window.expressStorage.addUser({
          email,
          pseudo,
          password, // Dans un cas réel, le mot de passe serait haché côté serveur
        });

        // Définir l'utilisateur courant
        window.expressStorage.setCurrentUser(newUser);

        // Rediriger vers la page d'accueil
        showAlert("Votre compte a été créé avec succès", "success");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } catch (error) {
        showAlert(error.message, "error");
      }
    });
  }

  // Formulaire de connexion
  const loginForm = document.querySelector('form[action="/auth/login"]');
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Récupérer les données du formulaire
      const email = this.querySelector('input[name="email"]').value;
      const password = this.querySelector('input[name="password"]').value;

      // Vérifications basiques
      if (!email || !password) {
        showAlert("Veuillez remplir tous les champs", "error");
        return;
      }

      // Récupérer l'utilisateur correspondant à l'email
      const user = window.expressStorage.getUserByEmail(email);

      if (!user) {
        showAlert("Adresse email ou mot de passe incorrect", "error");
        return;
      }

      // Vérifier le mot de passe (dans un cas réel, on comparerait les hashs)
      if (user.password !== password) {
        showAlert("Adresse email ou mot de passe incorrect", "error");
        return;
      }

      // Définir l'utilisateur courant
      window.expressStorage.setCurrentUser(user);

      // Rediriger vers la page d'accueil
      showAlert("Vous êtes maintenant connecté", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    });
  }

  // Liens de déconnexion
  const logoutLinks = document.querySelectorAll('a[href="/auth/logout"]');
  if (logoutLinks.length > 0) {
    logoutLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();

        // Déconnecter l'utilisateur
        window.expressStorage.clearCurrentUser();

        // Rediriger vers la page de connexion
        showAlert("Vous avez été déconnecté", "success");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1500);
      });
    });
  }

  // Vérifier l'état de connexion de l'utilisateur
  checkAuthState();
});

/**
 * Vérifier si l'utilisateur est connecté et mettre à jour l'interface
 */
function checkAuthState() {
  if (!window.expressStorage) return;

  const currentUser = window.expressStorage.getCurrentUser();

  // Mettre à jour l'interface en fonction de l'état de connexion
  const authLinks = document.querySelector(".nav-auth");
  if (authLinks) {
    if (currentUser) {
      // Utilisateur connecté
      authLinks.innerHTML = `
        <span class="user-info">
          <i class="fas fa-user"></i> ${currentUser.pseudo}
        </span>
        <a href="/auth/logout" class="auth-link">
          <i class="fas fa-sign-out-alt"></i> Déconnexion
        </a>
      `;
    } else {
      // Utilisateur non connecté
      authLinks.innerHTML = `
        <a href="/auth/login" class="auth-link">
          <i class="fas fa-sign-in-alt"></i> Connexion
        </a>
      `;
    }
  }
}

/**
 * Afficher une alerte à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type d'alerte (success, error)
 */
function showAlert(message, type = "success") {
  // Créer l'élément d'alerte
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${
    type === "error" ? "error" : "success"
  }`;
  alertElement.style.position = "fixed";
  alertElement.style.top = "20px";
  alertElement.style.left = "50%";
  alertElement.style.transform = "translateX(-50%)";
  alertElement.style.zIndex = "1000";
  alertElement.style.padding = "15px 25px";
  alertElement.style.borderRadius = "5px";
  alertElement.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  alertElement.style.opacity = "0";
  alertElement.style.transition = "opacity 0.3s ease-in-out";

  // Ajouter une icône
  const icon = document.createElement("i");
  icon.className =
    type === "error" ? "fas fa-exclamation-circle" : "fas fa-check-circle";
  icon.style.marginRight = "10px";
  alertElement.appendChild(icon);

  // Ajouter le message
  const textNode = document.createTextNode(message);
  alertElement.appendChild(textNode);

  // Ajouter l'alerte au document
  document.body.appendChild(alertElement);

  // Afficher l'alerte
  setTimeout(() => {
    alertElement.style.opacity = "1";
  }, 10);

  // Masquer l'alerte après 5 secondes
  setTimeout(() => {
    alertElement.style.opacity = "0";
    setTimeout(() => {
      alertElement.remove();
    }, 300);
  }, 5000);
}
