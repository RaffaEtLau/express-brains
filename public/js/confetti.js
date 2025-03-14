// confetti.js - Version simplifiée
document.addEventListener("DOMContentLoaded", function () {
  // Vérifier si l'utilisateur a trouvé le nombre
  const foundNumber = document.querySelector(".number-display");

  if (foundNumber) {
    console.log("Nombre trouvé! Lancement des confettis...");
    launchConfetti();
  }

  // Écouter un événement personnalisé (déclenché par le script dans footer)
  document.addEventListener("success-found", function () {
    console.log("Événement de succès détecté!");
    launchConfetti();
  });

  // Fonction pour lancer les confettis
  function launchConfetti() {
    console.log("Fonction launchConfetti appelée");

    // Créer le conteneur de confettis
    const confettiContainer = document.createElement("div");
    confettiContainer.classList.add("confetti-container");
    document.body.appendChild(confettiContainer);

    // Nombre de confettis
    const confettiCount = 200;

    // Couleurs des confettis
    const colors = ["#e60000", "#ff3333", "#ffcc00", "#ff6600", "#ffffff"];

    // Créer les confettis
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");

      // Position aléatoire
      confetti.style.left = `${Math.random() * 100}%`;

      // Taille aléatoire
      const size = Math.random() * 10 + 5;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;

      // Couleur aléatoire
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];

      // Délai d'animation aléatoire
      confetti.style.animationDelay = `${Math.random() * 2}s`;

      // Durée d'animation aléatoire
      const animationDuration = Math.random() * 3 + 2;
      confetti.style.animation = `fall ${animationDuration}s linear forwards`;

      confettiContainer.appendChild(confetti);
    }

    // Ajouter une classe d'animation à la carte
    const card = document.querySelector(".card");
    if (card) {
      card.classList.add("celebration-animation");
    }

    // Supprimer les confettis après l'animation
    setTimeout(() => {
      if (confettiContainer && confettiContainer.parentNode) {
        confettiContainer.parentNode.removeChild(confettiContainer);
      }
    }, 5000);

    // Jouer un son si possible
    try {
      const sound = new Audio("/sounds/success.mp3");
      sound.volume = 0.5;
      sound.play().catch((e) => console.log("Son non disponible"));
    } catch (e) {
      console.log("Son non disponible");
    }
  }
});
