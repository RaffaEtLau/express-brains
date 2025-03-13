// flush_mongoose.js
const mongoose = require("mongoose");
const User = require("./models/user");

// Connexion à MongoDB
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/express-brains",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected successfully");
    initDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Fonction pour initialiser la base de données
async function initDatabase() {
  try {
    // Supprimer toutes les données existantes
    await User.deleteMany({});

    // Créer l'utilisateur admin
    const admin = new User({
      email: "admin@express-brains.local",
      pseudo: "admin",
      password: "admin123",
      isAdmin: true,
    });

    await admin.save();
    console.log(
      "Admin utilisateur créé : admin@express-brains.local / admin123"
    );

    // Créer quelques utilisateurs de test
    const testUsers = [
      {
        email: "test@express-brains.local",
        pseudo: "test",
        password: "test123",
      },
    ];

    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
    }

    console.log("Database initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}
