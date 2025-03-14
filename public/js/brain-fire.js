// brain-fire.js - Version simplifiée
document.addEventListener("DOMContentLoaded", function () {
  // Éléments DOM
  const fireModeToggle = document.getElementById("fire-mode-toggle");
  const gameForm = document.querySelector('form[action="/game/guess"]');
  const guessInput = document.querySelector('input[name="guess"]');

  // Si nous ne sommes pas sur la page de jeu, sortir
  if (!fireModeToggle || !gameForm) return;

  // Configuration du mode feu
  let fireMode = false;
  let timeLimit = 20; // Secondes (réduit pour éviter trop de scroll)
  let timer;
  let timeLeft;

  // Créer et ajouter l'affichage du timer
  const timerDisplay = document.createElement("div");
  timerDisplay.classList.add("timer-display");
  timerDisplay.style.display = "none";
  gameForm.parentNode.insertBefore(timerDisplay, gameForm.nextSibling);

  // Créer et ajouter les flammes
  const flameContainer = document.createElement("div");
  flameContainer.classList.add("flame-container");
  flameContainer.style.display = "none";

  // Créer plusieurs flammes
  for (let i = 0; i < 5; i++) {
    const flame = document.createElement("div");
    flame.classList.add("flame");
    flame.style.left = `${20 * i}%`;
    flameContainer.appendChild(flame);
  }

  gameForm.parentNode.appendChild(flameContainer);

  // Événement de changement de mode
  fireModeToggle.addEventListener("change", function () {
    fireMode = this.checked;

    if (fireMode) {
      // Activer le mode feu
      flameContainer.style.display = "block";
      timerDisplay.style.display = "block";
      localStorage.setItem("fireMode", "true");
      startTimer();
    } else {
      // Désactiver le mode feu
      flameContainer.style.display = "none";
      timerDisplay.style.display = "none";
      localStorage.setItem("fireMode", "false");
      clearInterval(timer);
    }
  });

  // Vérifier si le mode feu était activé
  if (localStorage.getItem("fireMode") === "true") {
    fireModeToggle.checked = true;
    fireMode = true;
    flameContainer.style.display = "block";
    timerDisplay.style.display = "block";
    startTimer();
  }

  // Fonction de démarrage du timer
  function startTimer() {
    timeLeft = timeLimit;
    updateTimerDisplay();

    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      updateFlameIntensity();

      if (timeLeft <= 0) {
        clearInterval(timer);

        // Si le temps est écoulé et qu'une valeur est entrée, soumettre le formulaire
        if (guessInput.value) {
          gameForm.submit();
        } else {
          // Sinon, redémarrer le timer avec un message d'alerte
          const timeoutMessage = document.createElement("div");
          timeoutMessage.classList.add("alert", "alert-error");
          timeoutMessage.textContent =
            "Temps écoulé! Proposez un nombre rapidement!";

          // Insérer le message avant le formulaire
          const existingAlert = document.querySelector(".alert-error");
          if (existingAlert) {
            existingAlert.textContent = timeoutMessage.textContent;
          } else {
            gameForm.parentNode.insertBefore(timeoutMessage, gameForm);
          }

          // Faire clignoter l'input
          guessInput.classList.add("time-expired");

          // Redémarrer le timer avec moins de temps
          setTimeout(() => {
            timeLimit = 15;
            startTimer();
          }, 500);
        }
      }
    }, 1000);
  }

  // Mise à jour de l'affichage du timer
  function updateTimerDisplay() {
    timerDisplay.textContent = `Temps restant: ${timeLeft}s`;

    // Changer l'apparence selon le temps restant
    if (timeLeft <= 5) {
      timerDisplay.style.color = "#ff0000";
      timerDisplay.classList.add("pulse");
    } else if (timeLeft <= 10) {
      timerDisplay.style.color = "#ff6600";
      timerDisplay.classList.remove("pulse");
    } else {
      timerDisplay.style.color = "#000000";
      timerDisplay.classList.remove("pulse");
    }
  }

  // Mise à jour de l'intensité des flammes
  function updateFlameIntensity() {
    const intensity = 1 - timeLeft / timeLimit;
    const flames = document.querySelectorAll(".flame");

    flames.forEach((flame) => {
      flame.style.height = `${30 + intensity * 40}px`;
      flame.style.opacity = `${0.5 + intensity * 0.5}`;
    });
  }

  // Si on soumet le formulaire, réinitialiser le timer
  gameForm.addEventListener("submit", function () {
    if (fireMode) {
      clearInterval(timer);
      setTimeout(() => {
        if (fireMode) {
          startTimer();
        }
      }, 1000);
    }
  });
});
