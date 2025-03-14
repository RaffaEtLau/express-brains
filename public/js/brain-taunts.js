// brain-taunts.js
document.addEventListener("DOMContentLoaded", function () {
  // Tableaux de messages de provocation
  const tauntsWayOff = [
    "Ton cerveau est en pause?",
    "Tu cherches dans une autre dimension?",
    "Sérieusement? Ton cerveau a besoin d'un café!",
    "On est encore dans les choux...",
    "Houston, nous avons un problème de calcul!",
    "C'est bien d'explorer tous les nombres. TOUS.",
  ];

  const tauntsGettingCloser = [
    "Tu chauffes... ou peut-être pas!",
    "Je sens que ton cerveau commence à s'échauffer.",
    "Plus près que les 10 dernières tentatives... ce qui n'est pas difficile.",
    "Pas mal, mais mon grand-père trouverait plus vite.",
    "On avance! À cette vitesse, tu auras la réponse avant la fin du siècle.",
  ];

  const tauntsVeryClose = [
    "Oh! TON cerveau fume presque autant que le nombre!",
    "Presque là! (ou pas...)",
    "Je sens que ton neurone est sur le point de faire 'clic'!",
    "Brûlant! Ou peut-être que je te mène en bateau?",
    "Tu es SI proche... ou peut-être pas du tout? Qui sait!",
  ];

  // Éléments DOM
  const alertLow = document.querySelector(".alert-low");
  const alertHigh = document.querySelector(".alert-high");
  const tauntContainer = document.createElement("div");
  tauntContainer.classList.add("taunt-container");

  // Ajouter le conteneur de taunts
  if (alertLow || alertHigh) {
    const parentElement = (alertLow || alertHigh).parentNode;
    parentElement.appendChild(tauntContainer);

    // Afficher un taunt en fonction de l'historique des essais
    displayTaunt();
  }

  // Fonction pour afficher un taunt
  function displayTaunt() {
    // Récupérer l'historique des essais
    const guessHistory = document.querySelectorAll(".guess-item");

    if (guessHistory.length === 0) return;

    // Analyser les essais pour déterminer à quel point on est proche
    const lastGuess = guessHistory[0]; // Le plus récent en premier
    const isLow = lastGuess.classList.contains("guess-low");
    const isHigh = lastGuess.classList.contains("guess-high");

    // Déterminer la proximité en regardant les précédents essais
    let proximity = 0; // 0 = loin, 1 = plus proche, 2 = très proche

    if (guessHistory.length >= 2) {
      const previousGuess = guessHistory[1];
      const previousIsLow = previousGuess.classList.contains("guess-low");
      const previousIsHigh = previousGuess.classList.contains("guess-high");

      // Si les deux derniers essais sont du même côté et proches
      if ((isLow && previousIsLow) || (isHigh && previousIsHigh)) {
        // Extraire les nombres
        const lastNumber = parseInt(
          lastGuess.querySelector(".guess-number").textContent
        );
        const prevNumber = parseInt(
          previousGuess.querySelector(".guess-number").textContent
        );

        // Calculer la différence
        const diff = Math.abs(lastNumber - prevNumber);

        if (diff <= 5) {
          proximity = 2; // Très proche
        } else if (diff <= 15) {
          proximity = 1; // Plus proche
        }
      }
    }

    // Choisir un tableau de taunts en fonction de la proximité
    let taunts;
    if (proximity === 2) {
      taunts = tauntsVeryClose;
    } else if (proximity === 1) {
      taunts = tauntsGettingCloser;
    } else {
      taunts = tauntsWayOff;
    }

    // Sélectionner un taunt aléatoire
    const randomTaunt = taunts[Math.floor(Math.random() * taunts.length)];

    // Afficher le taunt
    tauntContainer.textContent = randomTaunt;
    tauntContainer.style.opacity = "0";

    // Animation
    setTimeout(() => {
      tauntContainer.style.opacity = "1";
      tauntContainer.classList.add("active");
    }, 100);

    // Stocker le taunt pour éviter la répétition
    localStorage.setItem("lastTaunt", randomTaunt);
  }

  // Interface pour permettre aux équipes de créer leurs propres taunts
  const createCustomTauntsUI = () => {
    // Seulement pour la page équipe et si l'utilisateur est membre
    const teamDetailsPage = document.querySelector(".team-section");
    const isMember = document.querySelector(".leave-button");

    if (teamDetailsPage && isMember) {
      // Créer la section personnalisée
      const customTauntsSection = document.createElement("div");
      customTauntsSection.classList.add("custom-taunts-section");
      customTauntsSection.innerHTML = `
        <h3>Messages de provocation personnalisés</h3>
        <p>Créez des messages drôles qui s'afficheront pendant que les membres de votre équipe jouent.</p>
        
        <div class="custom-taunts-form">
          <div class="form-group">
            <label for="custom-taunt">Nouveau message:</label>
            <input type="text" id="custom-taunt" placeholder="Ton cerveau a oublié ses lunettes?" maxlength="100">
          </div>
          <div class="form-group">
            <label>Quand l'afficher:</label>
            <select id="taunt-proximity">
              <option value="0">Loin du nombre</option>
              <option value="1">Plus proche du nombre</option>
              <option value="2">Très proche du nombre</option>
            </select>
          </div>
          <button type="button" id="add-taunt" class="btn btn-primary">Ajouter</button>
        </div>
        
        <div class="custom-taunts-list">
          <h4>Messages de l'équipe:</h4>
          <ul id="team-custom-taunts"></ul>
        </div>
      `;

      teamDetailsPage.appendChild(customTauntsSection);

      // Fonctionnalité pour ajouter des taunts personnalisés
      const addTauntButton = document.getElementById("add-taunt");
      const customTauntInput = document.getElementById("custom-taunt");
      const tauntProximitySelect = document.getElementById("taunt-proximity");
      const teamCustomTauntsList =
        document.getElementById("team-custom-taunts");

      // Charger les taunts existants
      loadCustomTaunts();

      // Événement d'ajout
      if (addTauntButton) {
        addTauntButton.addEventListener("click", function () {
          const taunt = customTauntInput.value.trim();
          const proximity = tauntProximitySelect.value;

          if (taunt) {
            // Ajouter au stockage local pour l'instant
            // Dans une implémentation complète, cela serait envoyé au serveur
            let teamTaunts = JSON.parse(
              localStorage.getItem("teamTaunts") || "[]"
            );
            teamTaunts.push({ taunt, proximity });
            localStorage.setItem("teamTaunts", JSON.stringify(teamTaunts));

            // Mettre à jour l'interface
            loadCustomTaunts();
            customTauntInput.value = "";
          }
        });
      }

      // Fonction pour charger les taunts personnalisés
      function loadCustomTaunts() {
        if (!teamCustomTauntsList) return;

        const teamTaunts = JSON.parse(
          localStorage.getItem("teamTaunts") || "[]"
        );
        teamCustomTauntsList.innerHTML = "";

        if (teamTaunts.length === 0) {
          teamCustomTauntsList.innerHTML =
            "<li>Aucun message personnalisé pour le moment.</li>";
          return;
        }

        teamTaunts.forEach((item, index) => {
          const li = document.createElement("li");

          let proximityText = "";
          if (item.proximity === "0") proximityText = "Loin";
          else if (item.proximity === "1") proximityText = "Plus proche";
          else proximityText = "Très proche";

          li.innerHTML = `
            <span class="taunt-text">${item.taunt}</span>
            <span class="taunt-proximity">${proximityText}</span>
            <button class="delete-taunt btn small" data-index="${index}">
              <i class="fas fa-trash-alt"></i>
            </button>
          `;

          teamCustomTauntsList.appendChild(li);
        });

        // Événements de suppression
        document.querySelectorAll(".delete-taunt").forEach((btn) => {
          btn.addEventListener("click", function () {
            const index = this.getAttribute("data-index");
            let teamTaunts = JSON.parse(
              localStorage.getItem("teamTaunts") || "[]"
            );
            teamTaunts.splice(index, 1);
            localStorage.setItem("teamTaunts", JSON.stringify(teamTaunts));
            loadCustomTaunts();
          });
        });
      }
    }
  };

  // Initialiser l'interface pour les taunts personnalisés
  createCustomTauntsUI();
});
