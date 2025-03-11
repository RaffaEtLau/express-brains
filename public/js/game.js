/**
 * Script principal pour le jeu Express Brains
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialiser le stockage
  if (window.expressStorage) {
    window.expressStorage.initStorage();
  }

  // Sélection des éléments du DOM
  const guessForm = document.querySelector(".guess-form");
  const guessInput = document.querySelector('input[name="guess"]');
  const attemptsElement = document.querySelector(".attempts");

  // Si nous sommes sur la page de jeu et que le formulaire existe
  if (guessForm) {
    // Mettre le focus sur le champ de saisie
    if (guessInput) {
      guessInput.focus();

      // Ajouter des effets visuels au champ de saisie
      guessInput.addEventListener("focus", function () {
        this.parentElement.style.transform = "scale(1.05)";
        this.parentElement.style.transition = "transform 0.2s ease";
      });

      guessInput.addEventListener("blur", function () {
        this.parentElement.style.transform = "scale(1)";
      });
    }

    // Gestion du nombre secret en localStorage
    let secretNumber = localStorage.getItem("secretNumber");
    let attempts = parseInt(localStorage.getItem("attempts")) || 0;

    // Si pas de nombre secret, en générer un
    if (!secretNumber) {
      secretNumber = Math.floor(Math.random() * 100) + 1;
      localStorage.setItem("secretNumber", secretNumber);
      localStorage.setItem("attempts", "0");

      // Mettre à jour l'affichage des tentatives
      if (attemptsElement) {
        attemptsElement.innerHTML = `<i class="fas fa-history" style="margin-right: 0.5rem;"></i> Tentatives : 0`;
      }
    }

    // Animation lors de la soumission du formulaire
    guessForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Récupérer la tentative
      const guess = parseInt(guessInput.value);

      // Vérifier si l'entrée est valide
      if (isNaN(guess) || guess < 1 || guess > 100) {
        showMessage(
          "Erreur ! Vous devez saisir un nombre entre 1 et 100.",
          "error"
        );
        return;
      }

      // Incrémenter le nombre de tentatives
      attempts++;
      localStorage.setItem("attempts", attempts.toString());

      // Mettre à jour l'affichage des tentatives
      if (attemptsElement) {
        attemptsElement.innerHTML = `<i class="fas fa-history" style="margin-right: 0.5rem;"></i> Tentatives : ${attempts}`;
      }

      // Vérifier la tentative
      if (guess == secretNumber) {
        // Victoire !
        if (window.expressStorage) {
          const currentUser = window.expressStorage.getCurrentUser();
          if (currentUser) {
            window.expressStorage.updateUserStats(
              currentUser.id,
              attempts,
              true
            );
          }
          window.expressStorage.updateGameStats(attempts, true);
        }

        // Afficher un message de succès
        showMessage("Bravo ! Vous avez trouvé le nombre !", "success");

        // Rediriger vers la page de victoire
        setTimeout(function () {
          // Réinitialiser le localStorage pour la prochaine partie
          localStorage.removeItem("secretNumber");

          // Rediriger vers la page de victoire avec les paramètres
          window.location.href = `/game/win?secret=${secretNumber}&attempts=${attempts}`;
        }, 1500);
      } else if (guess < secretNumber) {
        showMessage("Vous êtes trop bas !", "low");
      } else {
        showMessage("Vous êtes trop haut !", "high");
      }

      // Vider le champ et remettre le focus
      guessInput.value = "";
      guessInput.focus();
    });
  }

  // Confetti pour la page de victoire
  const confettiContainer = document.getElementById("confetti-container");
  if (confettiContainer) {
    createConfetti();

    // Récupérer les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const secretNumber = urlParams.get("secret");
    const attempts = urlParams.get("attempts");

    // Mettre à jour l'affichage
    const numberDisplay = document.querySelector(".number-display");
    if (numberDisplay && secretNumber) {
      numberDisplay.textContent = secretNumber;
    }

    // Mettre à jour le nombre de tentatives
    const attemptsText = document.querySelector("p strong");
    if (attemptsText && attempts) {
      attemptsText.textContent = attempts;
    }

    // Mettre à jour les statistiques de l'utilisateur
    if (window.expressStorage) {
      const currentUser = window.expressStorage.getCurrentUser();
      if (currentUser && attempts) {
        window.expressStorage.updateUserStats(
          currentUser.id,
          parseInt(attempts),
          true
        );
      }
    }

    // Bouton "Rejouer"
    const replayButton = document.querySelector('a[href="/game/play"]');
    if (replayButton) {
      replayButton.addEventListener("click", function (e) {
        // Réinitialiser le localStorage pour la prochaine partie
        localStorage.removeItem("secretNumber");
        localStorage.removeItem("attempts");
      });
    }
  }

  // Barres de performance dynamiques
  initializePerformanceBars();

  // Navigation mobile
  setupMobileNavigation();

  // Classement
  updateLeaderboard();
});

/**
 * Afficher un message à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message (success, error, low, high)
 */
function showMessage(message, type) {
  // Supprimer les messages existants
  const existingAlerts = document.querySelectorAll(".alert");
  existingAlerts.forEach((alert) => alert.remove());

  // Créer le nouvel élément d'alerte
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${type}`;

  // Ajouter une icône selon le type
  let icon = "fas fa-exclamation-circle";
  if (type === "success") {
    icon = "fas fa-check-circle";
  } else if (type === "low") {
    icon = "fas fa-arrow-up";
  } else if (type === "high") {
    icon = "fas fa-arrow-down";
  }

  alertElement.innerHTML = `<i class="${icon}" style="margin-right: 0.5rem;"></i> ${message}`;

  // Insérer l'alerte avant l'élément des tentatives
  const attemptsElement = document.querySelector(".attempts");
  if (attemptsElement) {
    attemptsElement.parentNode.insertBefore(alertElement, attemptsElement);
  } else {
    // Si pas d'élément des tentatives, ajouter à la fin du formulaire
    const form = document.querySelector(".guess-form");
    if (form) {
      form.insertAdjacentElement("afterend", alertElement);
    }
  }
}

/**
 * Crée des confettis animés pour la page de victoire
 */
function createConfetti() {
  const container = document.getElementById("confetti-container");
  if (!container) return;

  const colors = [
    "#4a6fa5",
    "#6eb670",
    "#ffd700",
    "#ff6b6b",
    "#f8bbd0",
    "#a5d6a7",
  ];
  const confettiCount = 100;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");

    // Styles et propriétés aléatoires
    const size = Math.random() * 8 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 3;
    const duration = Math.random() * 3 + 3;

    // Appliquer les styles
    confetti.style.position = "absolute";
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.backgroundColor = color;
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
    confetti.style.left = `${left}%`;
    confetti.style.top = "-20px";
    confetti.style.opacity = Math.random() * 0.5 + 0.5;

    // Animation
    confetti.style.animation = `confetti-fall ${duration}s ease-in ${delay}s`;
    confetti.style.animationIterationCount = "1";
    confetti.style.animationFillMode = "forwards";

    container.appendChild(confetti);
  }

  // Ajouter le style d'animation si nécessaire
  if (!document.getElementById("confetti-style")) {
    const style = document.createElement("style");
    style.id = "confetti-style";
    style.innerHTML = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0); opacity: 1; }
        100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Initialise les barres de performance dans le jeu
 */
function initializePerformanceBars() {
  const performanceBars = document.querySelectorAll(".performance");

  performanceBars.forEach((bar) => {
    // Animation progressive de la barre
    const fillBar = bar.querySelector('div[style*="position: absolute"]');
    if (fillBar) {
      // Sauvegarder la largeur finale
      const finalWidth = fillBar.style.width;

      // Commencer à zéro et animer jusqu'à la largeur finale
      fillBar.style.width = "0%";
      setTimeout(() => {
        fillBar.style.transition = "width 1s ease-out";
        fillBar.style.width = finalWidth;
      }, 300);
    }
  });
}

/**
 * Configure la navigation responsive pour mobile
 */
function setupMobileNavigation() {
  // Vérifier si nous sommes sur mobile (moins de 768px)
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    const navLinks = document.querySelector(".nav-links");
    const navAuth = document.querySelector(".nav-auth");

    // Si les éléments existent, ajouter un bouton pour basculer la visibilité
    if (navLinks && navAuth) {
      const navBrand = document.querySelector(".nav-brand");

      if (navBrand && !document.querySelector(".menu-toggle")) {
        // Créer le bouton hamburger
        const menuToggle = document.createElement("button");
        menuToggle.className = "menu-toggle";
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.style.background = "none";
        menuToggle.style.border = "none";
        menuToggle.style.color = "white";
        menuToggle.style.fontSize = "1.5rem";
        menuToggle.style.cursor = "pointer";

        // Insérer le bouton
        navBrand.parentNode.insertBefore(menuToggle, navBrand.nextSibling);

        // Cacher les liens par défaut
        navLinks.style.display = "none";
        navAuth.style.display = "none";

        // Ajouter l'événement de clic
        menuToggle.addEventListener("click", function () {
          const isVisible = navLinks.style.display !== "none";

          navLinks.style.display = isVisible ? "none" : "flex";
          navAuth.style.display = isVisible ? "none" : "flex";

          // Changer l'icône
          this.innerHTML = isVisible
            ? '<i class="fas fa-bars"></i>'
            : '<i class="fas fa-times"></i>';
        });
      }
    }
  }
}

/**
 * Met à jour le classement des joueurs
 */
function updateLeaderboard() {
  const leaderboardTable = document.querySelector(".leaderboard-table tbody");
  if (!leaderboardTable || !window.expressStorage) return;

  // Récupérer le classement des meilleurs joueurs
  const topPlayers = window.expressStorage.getLeaderboard();

  // Mettre à jour le tableau
  if (topPlayers.length > 0) {
    leaderboardTable.innerHTML = "";

    topPlayers.forEach((player, index) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="leaderboard-rank rank-${index + 1}">${index + 1}</td>
        <td>${player.pseudo}</td>
        <td>${player.bestScore || 0} points</td>
        <td>${player.bestAttempts || "-"} tentatives</td>
        <td>${player.gamesPlayed || 0}</td>
        <td>${player.gamesWon || 0}</td>
      `;

      leaderboardTable.appendChild(row);
    });
  }
}
