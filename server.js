// server.js — GameStore Pro with Admin Verification

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// ======= ADMIN CONFIG =======
const ADMIN_EMAIL = "stormywilliams279@gmail.com";
const ADMIN_KEY = "SuperSecret123"; // optional secret key for extra security
// ============================

// Configure file uploads
const upload = multer({ dest: "uploads/" });

// In-memory game database
const games = [];

// ------------------ Upload Game (developer) ------------------
app.post("/upload-game", upload.single("gameFile"), (req, res) => {
  const { title, description, price, developerEmail } = req.body;

  if (!title || !developerEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newGame = {
    id: Date.now().toString(),
    title,
    description,
    price: Number(price || 0),
    developerEmail,
    status: "pending",
    filePath: req.file ? req.file.path : null,
    createdAt: new Date()
  };

  games.push(newGame);

  res.json({
    success: true,
    gameId: newGame.id,
    message: "Game uploaded and awaiting verification."
  });
});

// ------------------ Verify Game (ADMIN ONLY) ------------------
app.post("/verify-game/:id", (req, res) => {
  const { email, key } = req.body;

  if (email !== ADMIN_EMAIL || key !== ADMIN_KEY) {
    return res.status(403).json({ error: "Not authorized to verify games." });
  }

  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });

  game.status = "approved";
  res.json({ success: true, message: "Game verified and live!" });
});

// ------------------ Get Approved Games (public store) ------------------
app.get("/store", (req, res) => {
  const approvedGames = games.filter(g => g.status === "approved");
  res.json(approvedGames);
});

// ------------------ Get Pending Games (for admin panel) ------------------
app.get("/pending", (req, res) => {
  res.json(games.filter(g => g.status === "pending"));
});

// ------------------ Start Server ------------------
app.listen(3000, () => {
  console.log("GameStore Pro running on http://localhost:3000");
});
