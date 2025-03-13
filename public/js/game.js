// Script principal du jeu
document.addEventListener("DOMContentLoaded", function () {
  // Références aux éléments du DOM
  const guessForm = document.getElementById("guess-form");
  const guessInput = document.getElementById("guess-input");
  const feedbackContainer = document.getElementById("feedback-container");
  const attemptsCount = document.getElementById("attempts-count");
  const attemptsPlural = document.getElementById("attempts-plural");
  let guessHistory = document.getElementById("guess-history");
  let guessList = document.getElementById("guess-list");

  // Initialisation du jeu
  if (guessForm) {
    // Mettre le focus sur le champ de saisie
    guessInput.focus();

    // Gestionnaire de soumission du formulaire
    guessForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const guess = guessInput.value;

      // Validation côté client
      if (!guess || isNaN(guess) || guess < 1 || guess > 100) {
        showFeedback("error", "Veuillez entrer un nombre entre 1 et 100");
        return;
      }

      // Envoyer la requête AJAX
      fetch("/game/guess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ guess: parseInt(guess) }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur réseau");
          }
          return response.json();
        })
        .then((data) => {
          // Traitement de la réponse
          if (data.error) {
            showFeedback("error", data.error);
            return;
          }

          // Mettre à jour le nombre de tentatives
          if (attemptsCount && data.attempts) {
            attemptsCount.textContent = data.attempts;
            if (attemptsPlural) {
              attemptsPlural.textContent = data.attempts > 1 ? "s" : "";
            }
            document.querySelector(".attempts").style.display = "inline-block";
          }

          // Afficher le feedback
          showFeedback(data.feedbackType, data.feedbackMessage);

          // Ajouter la tentative à l'historique
          if (typeof data.guess !== "undefined") {
            let resultType = "low";
            if (data.found) {
              resultType = "correct";
            } else if (data.feedbackType === "high") {
              resultType = "high";
            }

            addGuessToHistory(data.guess || guess, resultType);
          }

          // Le joueur a trouvé le nombre
          if (data.found) {
            celebrateWin(data.secretNumber, data.attempts);
          } else {
            // Vider le champ de saisie et remettre le focus
            guessInput.value = "";
            guessInput.focus();
          }
        })
        .catch((error) => {
          console.error("Erreur:", error);
          showFeedback("error", "Une erreur est survenue, veuillez réessayer");
        });
    });
  }

  /**
   * Affiche un message de feedback
   * @param {string} type - Type de message (error, success, low, high)
   * @param {string} message - Contenu du message
   */
  function showFeedback(type, message) {
    // Créer l'élément de feedback s'il n'existe pas
    if (!feedbackContainer) return;

    // Supprimer l'ancien message
    const oldFeedback = document.getElementById("feedback-message");
    if (oldFeedback) {
      oldFeedback.classList.add("fade-out");
      setTimeout(() => {
        if (oldFeedback.parentNode) {
          oldFeedback.parentNode.removeChild(oldFeedback);
        }
      }, 300);
    }

    // Créer le nouveau message
    const feedbackElement = document.createElement("div");
    feedbackElement.id = "feedback-message";
    feedbackElement.className = `alert alert-${type} fade-in`;
    feedbackElement.textContent = message;

    // Ajouter le nouveau message
    feedbackContainer.appendChild(feedbackElement);

    // Animation d'entrée
    setTimeout(() => {
      feedbackElement.classList.remove("fade-in");
    }, 10);

    // Lire le message pour l'accessibilité
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "fr-FR";
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Ajoute une tentative à l'historique
   * @param {number} guess - Nombre deviné
   * @param {string} result - Résultat (low, high, correct)
   */
  function addGuessToHistory(guess, result) {
    if (!guessHistory || !guessList) {
      guessHistory = document.getElementById("guess-history");
      guessList = document.getElementById("guess-list");
      if (!guessHistory || !guessList) return;
    }

    // Afficher le conteneur d'historique
    guessHistory.style.display = "";

    // Créer un élément pour cette tentative
    const guessItem = document.createElement("div");
    guessItem.className = `guess-item guess-${result}`;

    const guessNumber = document.createElement("span");
    guessNumber.className = "guess-number";
    guessNumber.textContent = guess;

    const guessResult = document.createElement("span");
    guessResult.className = "guess-result";

    // Icon et texte en fonction du résultat
    if (result === "low") {
      guessResult.innerHTML = '<i class="fas fa-arrow-up"></i> Trop bas';
    } else if (result === "high") {
      guessResult.innerHTML = '<i class="fas fa-arrow-down"></i> Trop haut';
    } else if (result === "correct") {
      guessResult.innerHTML = '<i class="fas fa-check"></i> Correct !';
    }

    guessItem.appendChild(guessNumber);
    guessItem.appendChild(guessResult);

    // Ajouter au début de la liste pour voir les tentatives récentes en premier
    if (guessList.firstChild) {
      guessList.insertBefore(guessItem, guessList.firstChild);
    } else {
      guessList.appendChild(guessItem);
    }
  }

  /**
   * Affiche une animation de victoire
   * @param {number} secretNumber - Le nombre mystère trouvé
   * @param {number} attempts - Nombre de tentatives
   */
  function celebrateWin(secretNumber, attempts) {
    // Désactiver le formulaire
    if (guessForm) {
      guessForm.querySelector("button").disabled = true;
      guessInput.disabled = true;
    }

    // Créer l'animation de confettis
    createConfetti();

    // Afficher un message de félicitations
    showFeedback(
      "success",
      `Bravo ! Vous avez trouvé le nombre ${secretNumber} en ${attempts} tentative${
        attempts > 1 ? "s" : ""
      }`
    );

    // Rediriger vers la page de résultat après un délai
    setTimeout(() => {
      window.location.href = `/game/result?number=${secretNumber}&attempts=${attempts}`;
    }, 3000);
  }

  /**
   * Crée une animation de confettis pour célébrer la victoire
   */
  function createConfetti() {
    // Créer le conteneur de confettis s'il n'existe pas déjà
    let confettiContainer = document.getElementById("confetti-container");
    if (!confettiContainer) {
      confettiContainer = document.createElement("div");
      confettiContainer.id = "confetti-container";
      document.body.appendChild(confettiContainer);
    }

    // Créer les confettis
    const colors = [
      "#f94144",
      "#f3722c",
      "#f8961e",
      "#f9c74f",
      "#90be6d",
      "#43aa8b",
      "#577590",
    ];

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 10 + 5}px`;
      confetti.style.opacity = Math.random();
      confetti.style.animation = `confetti-fall ${
        Math.random() * 3 + 2
      }s linear forwards`;
      confetti.style.animationDelay = `${Math.random() * 2}s`;

      confettiContainer.appendChild(confetti);
    }

    // Supprimer les confettis après l'animation
    setTimeout(() => {
      if (confettiContainer) {
        confettiContainer.remove();
      }
    }, 5000);
  }

  // Fonctionnalités pour améliorer l'accessibilité et l'expérience utilisateur
  if (guessInput) {
    // Permettre l'utilisation des flèches haut/bas pour incrémenter/décrémenter
    guessInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        this.value = Math.min(100, parseInt(this.value || 0) + 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.value = Math.max(1, parseInt(this.value || 0) - 1);
      }
    });

    // Sélectionner tout le texte quand on clique sur l'input
    guessInput.addEventListener("click", function () {
      this.select();
    });
  }

});
