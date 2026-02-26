// server.js — GameStorePro: public uploads + admin verification

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// ------------------ ADMIN CONFIG ------------------
const ADMIN_EMAIL = "stormywilliams279@gmail.com";
const ADMIN_KEY = "SuperSecret123";

// ------------------ FILE UPLOAD ------------------
const upload = multer({ dest: "uploads/" });

// In-memory database
const games = [];

// ------------------ Upload Game (anyone) ------------------
app.post("/upload-game", upload.single("gameFile"), (req, res) => {
  const { title, description, price, developerEmail } = req.body;

  if (!title || !developerEmail) {
    return res.status(400).json({ error: "Missing title or email" });
  }

  const newGame = {
    id: Date.now().toString(),
    title,
    description,
    price: Number(price || 0),
    developerEmail,
    status: "pending", // pending until verified
    filePath: req.file ? req.file.path : null,
    createdAt: new Date()
  };

  games.push(newGame);
  res.json({
    success: true,
    gameId: newGame.id,
    message: "Game uploaded! Awaiting admin verification."
  });
});

// ------------------ Verify Game (Admin only) ------------------
app.post("/verify-game/:id", (req, res) => {
  const { email, key } = req.body;

  if (email !== ADMIN_EMAIL || key !== ADMIN_KEY) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });

  game.status = "approved"; // now it appears in store
  res.json({ success: true, message: "Game approved and live!" });
});

// ------------------ Public Store ------------------
app.get("/store", (req, res) => {
  const approvedGames = games.filter(g => g.status === "approved");
  res.json(approvedGames);
});

// ------------------ Pending Games (Admin panel) ------------------
app.get("/pending", (req, res) => {
  const pendingGames = games.filter(g => g.status === "pending");
  res.json(pendingGames);
});

// ------------------ Start Server ------------------
app.listen(3000, () => {
  console.log("GameStorePro backend running on http://localhost:3000");
});
