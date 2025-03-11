# Express Brains

Express Brains est un jeu de devinette basé sur la recherche binaire, développé avec Node.js et Express. Le joueur doit deviner un nombre entre 1 et 100 en utilisant le moins de tentatives possible.

## Fonctionnalités

- 🎮 Jeu interactif de devinette de nombres
- 🏆 Système de classement et de points
- 👤 Gestion des utilisateurs (inscription, connexion, profil)
- 📊 Statistiques de jeu personnelles et globales
- 🎯 Conseils et stratégies pour optimiser ses performances
- 📱 Interface responsive pour tous les appareils

## Technologies utilisées

- **Backend** : Node.js avec Express.js
- **Frontend** : HTML, CSS, JavaScript
- **Templates** : EJS (Embedded JavaScript)
- **Stockage** : LocalStorage du navigateur
- **Authentification** : Express-session et bcrypt

## Installation

1. Cloner le dépôt

   ```bash
   git clone https://github.com/votre-nom/express-brains.git
   cd express-brains
   ```

2. Installer les dépendances

   ```bash
   npm install
   ```

3. Démarrer l'application

   ```bash
   npm start
   ```

4. Accéder à l'application dans votre navigateur
   ```
   http://localhost:3000
   ```

## Structure du projet

```
express-brains/
├── app.js                    # Point d'entrée de l'application
├── routes/                   # Routes de l'application
│   ├── index.js              # Routes principales
│   ├── auth.js               # Routes d'authentification
│   └── game.js               # Routes du jeu
├── views/                    # Templates EJS
│   ├── partials/             # Éléments réutilisables
│   ├── auth/                 # Pages d'authentification
│   └── ...                   # Autres pages
└── public/                   # Fichiers statiques
    ├── css/                  # Styles
    └── js/                   # Scripts JavaScript
```

## Stratégie optimale

Pour obtenir les meilleurs scores, utilisez la technique de la recherche binaire :

1. Commencez par proposer 50 (milieu de l'intervalle 1-100)
2. Si c'est trop bas, le nombre est entre 51 et 100. Proposez donc 75.
3. Si c'est trop haut, le nombre est entre 1 et 49. Proposez donc 25.
4. Continuez à diviser l'intervalle en deux à chaque étape.

Avec cette méthode, vous trouverez toujours le nombre en 7 tentatives maximum !

## Système de score

Votre score est calculé selon la formule : **Score = 1000 / Nombre de tentatives**

Ainsi, moins vous utilisez de tentatives, plus votre score est élevé.

## Licence

Ce projet est sous licence ISC. Voir le fichier LICENSE pour plus de détails.

## Auteur

Développé par LUCE L. dans le cadre d'un TP pour le module "Le développement web côté serveur avec Node.js" de la formation ENI.
