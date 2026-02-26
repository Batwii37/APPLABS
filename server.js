// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend files from current folder
app.use(express.static(path.join(__dirname, ".")));

// Admin config
const ADMIN_EMAIL = "stormywilliams279@gmail.com";
const ADMIN_KEY = "SuperSecret123";

// Upload folder
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/vnd.android.package-archive") {
      return cb(new Error("Only APK files are allowed"));
    }
    cb(null, true);
  }
});

// In-memory games database
const games = [];

// Upload game (user or admin)
app.post("/upload-game", upload.single("gameFile"), (req, res) => {
  const { title, description, price, developerEmail, isAdmin } = req.body;

  if (!title || !developerEmail || !req.file) {
    return res.status(400).json({ error: "Missing fields or file" });
  }

  const status = isAdmin === "true" ? "approved" : "pending";

  const newGame = {
    id: Date.now().toString(),
    title,
    description,
    price: Number(price || 0),
    developerEmail,
    status: status,
    filePath: req.file.filename,
    createdAt: new Date()
  };

  games.push(newGame);

  res.json({
    success: true,
    gameId: newGame.id,
    message: status === "approved"
      ? "Game uploaded and live!"
      : "Upload successful! Awaiting admin verification."
  });
});

// Verify game (admin only)
app.post("/verify-game/:id", (req, res) => {
  const { email, key } = req.body;

  if (email !== ADMIN_EMAIL || key !== ADMIN_KEY) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: "Game not found" });

  game.status = "approved";
  res.json({ success: true, message: "Game approved and live!" });
});

// Public store
app.get("/store", (req, res) => {
  res.json(games.filter(g => g.status === "approved"));
});

// Pending games (admin)
app.get("/pending", (req, res) => {
  const pendingGames = games.filter(g => g.status === "pending");
  res.json(pendingGames);
});

// Serve uploaded APKs
app.use("/uploads", express.static(UPLOAD_DIR));

// Start server
app.listen(3000, () => console.log("GameStorePro backend running on http://localhost:3000"));
